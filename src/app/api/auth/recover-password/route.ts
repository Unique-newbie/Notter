import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, recovery } = await req.json();

    if (!email || !newPassword || !recovery) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

    // 1. Get user profile
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*, auth_users:user_id(*)')
      .limit(50);

    // Find profile matching email
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

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
