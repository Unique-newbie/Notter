import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyIssue, ConsistencyReport } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chapters = [], characters = [], items = [], abilities = [], timelineEvents = [], relationships = [] } = body;

    const chapterMap = new Map<string, number>();
    chapters.forEach((c: any) => {
      if (c.id && c.chapterNumber !== undefined) {
        chapterMap.set(c.id, c.chapterNumber);
      }
    });

    const getChapterNumsFromIds = (ids?: string[]): number[] => {
      if (!ids || !Array.isArray(ids)) return [];
      const nums = ids.map(id => chapterMap.get(id)).filter((n): n is number => n !== undefined);
      return Array.from(new Set(nums)).sort((a, b) => a - b);
    };

    const issues: ConsistencyIssue[] = [];

    // Rule 1: Destroyed Items Reappearing
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item.status === 'Destroyed' && item.appearedInChapterIds && item.appearedInChapterIds.length > 1) {
          const affectedNums = getChapterNumsFromIds(item.appearedInChapterIds);
          issues.push({
            id: `issue-item-${item.id}`,
            category: 'Item',
            severity: 'High',
            title: `Destroyed Item Reappearance: "${item.name}"`,
            description: `The item "${item.name}" is marked as Destroyed, but has activity recorded across multiple chapters.`,
            affectedChapterNumbers: affectedNums.length > 0 ? affectedNums : [1],
            suggestedFix: `Update item status or clarify in text if it was repaired or reforged.`
          });
        }
      });
    }

    // Rule 2: Deceased Character Action
    if (Array.isArray(characters)) {
      characters.forEach((char: any) => {
        if (char.status === 'Deceased' && char.appearedInChapterIds && char.appearedInChapterIds.length > 1) {
          const affectedNums = getChapterNumsFromIds(char.appearedInChapterIds);
          issues.push({
            id: `issue-char-${char.id}`,
            category: 'Character',
            severity: 'High',
            title: `Deceased Character Activity: "${char.name}"`,
            description: `Character "${char.name}" is marked Deceased, but has activity recorded in multiple chapters.`,
            affectedChapterNumbers: affectedNums.length > 0 ? affectedNums : [1],
            suggestedFix: `Clarify if post-death appearances are flashbacks, illusions, or resurrective events.`
          });
        }
      });
    }

    // Rule 3: Duplicate Character Records
    if (Array.isArray(characters)) {
      for (let i = 0; i < characters.length; i++) {
        for (let j = i + 1; j < characters.length; j++) {
          const c1 = characters[i];
          const c2 = characters[j];
          if (c1.name && c2.name && c1.name.trim().toLowerCase() === c2.name.trim().toLowerCase()) {
            const affectedNums = getChapterNumsFromIds([
              ...(c1.appearedInChapterIds || []),
              ...(c2.appearedInChapterIds || [])
            ]);
            issues.push({
              id: `issue-dup-${c1.id}-${c2.id}`,
              category: 'Duplicate',
              severity: 'Medium',
              title: `Duplicate Character Entry: "${c1.name}"`,
              description: `Multiple distinct Story Bible character entries exist for "${c1.name}".`,
              affectedChapterNumbers: affectedNums.length > 0 ? affectedNums : [1],
              suggestedFix: `Merge duplicate records into a single character entry.`
            });
          }
        }
      }
    }

    // Rule 4: Timeline Sequence Anomalies
    if (Array.isArray(timelineEvents)) {
      for (let k = 0; k < timelineEvents.length - 1; k++) {
        const e1 = timelineEvents[k];
        const e2 = timelineEvents[k + 1];
        if (e1.chapterNumber > e2.chapterNumber) {
          issues.push({
            id: `issue-time-${e1.id}`,
            category: 'Timeline',
            severity: 'Medium',
            title: `Timeline Chronology Anomaly`,
            description: `Event "${e1.title}" (Ch ${e1.chapterNumber}) is listed before "${e2.title}" (Ch ${e2.chapterNumber}).`,
            affectedChapterNumbers: [e1.chapterNumber, e2.chapterNumber],
            suggestedFix: `Re-order timeline nodes or clarify chronological time-jump.`
          });
        }
      }
    }

    // Rule 5: Unanchored Abilities
    if (Array.isArray(abilities)) {
      abilities.forEach((ab: any) => {
        if (!ab.firstAppearanceChapterId) {
          issues.push({
            id: `issue-ab-${ab.id}`,
            category: 'Ability',
            severity: 'Low',
            title: `Unanchored Ability: "${ab.name}"`,
            description: `Ability "${ab.name}" is registered without a First Appearance Chapter origin.`,
            affectedChapterNumbers: [1],
            suggestedFix: `Assign the first chapter where "${ab.name}" was demonstrated.`
          });
        }
      });
    }

    const report: ConsistencyReport = {
      id: `report-${Date.now()}`,
      bookId: body.bookId || '',
      createdAt: new Date().toISOString(),
      issues,
      totalChaptersAudited: Array.isArray(chapters) ? chapters.length : 0
    };

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Consistency audit failed' }, { status: 500 });
  }
}
