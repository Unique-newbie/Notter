import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Simple in-memory rate limiter per IP / Email
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, recovery } = await req.json();

    if (!email || !newPassword || !recovery) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `recover_${ip}_${email.toLowerCase()}`;

    if (!checkRateLimit(rateKey)) {
      return NextResponse.json({
        error: 'Too many recovery attempts. Please wait 15 minutes before trying again.'
      }, { status: 429 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

    // 1. Find profile matching email
    const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
    if (userErr || !users.users) {
      return NextResponse.json({ error: 'User lookup failed' }, { status: 404 });
    }

    const matchedUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!matchedUser) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', matchedUser.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'No recovery profile configured for this user' }, { status: 404 });
    }

    // 2. Validate recovery credentials
    if (recovery.type === 'question') {
      const providedAnswer = (recovery.answer || '').trim().toLowerCase();
      if (!profile.recovery_answer_hash || providedAnswer !== profile.recovery_answer_hash) {
        return NextResponse.json({ error: 'Incorrect answer to recovery question' }, { status: 401 });
      }
    } else if (recovery.type === 'code') {
      const providedCode = (recovery.recoveryCode || '').trim().toUpperCase();
      if (!profile.recovery_code_hash || providedCode !== profile.recovery_code_hash) {
        return NextResponse.json({ error: 'Invalid recovery code' }, { status: 401 });
      }
    }

    // 3. Reset Password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      matchedUser.id,
      { password: newPassword }
    );

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
