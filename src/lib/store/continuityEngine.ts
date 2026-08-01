import { Character, Item, LocationEntity, TimelineEvent, DialogueFactEntity, ContinuityWarning } from '@/types';

export function runContinuityAudit(
  bookId: string,
  characters: Character[],
  items: Item[],
  locations: LocationEntity[],
  events: TimelineEvent[],
  dialogueFacts: DialogueFactEntity[]
): ContinuityWarning[] {
  const warnings: ContinuityWarning[] = [];

  // 1. Deceased Character Reappearance
  characters.forEach(char => {
    if (char.status === 'Deceased' && char.chapterAppearances && char.chapterAppearances.length > 0) {
      const deathAppIdx = char.chapterAppearances.findIndex(a => (a.statusInChapter || '').toLowerCase() === 'deceased');
      if (deathAppIdx !== -1 && deathAppIdx < char.chapterAppearances.length - 1) {
        const postDeathApp = char.chapterAppearances[char.chapterAppearances.length - 1];
        warnings.push({
          id: `warn-deceased-${char.id}-${postDeathApp.chapterNumber}`,
          bookId,
          severity: 'Contradiction',
          title: 'Deceased Character Appears in Story',
          description: `Character "${char.name}" was marked as Deceased in Chapter ${char.chapterAppearances[deathAppIdx].chapterNumber}, but appears active in Chapter ${postDeathApp.chapterNumber}.`,
          entityName: char.name,
          chapterNumber: postDeathApp.chapterNumber,
          detectedAt: new Date().toISOString()
        });
      }
    }
  });

  // 2. Destroyed Item Re-use
  items.forEach(item => {
    if (item.status === 'Destroyed' && item.appearedInChapterIds && item.appearedInChapterIds.length > 1) {
      warnings.push({
        id: `warn-item-${item.id}`,
        bookId,
        severity: 'Warning',
        title: 'Destroyed Item Referenced',
        description: `Item "${item.name}" is marked as Destroyed, but remains referenced across multiple chapter records.`,
        entityName: item.name,
        chapterNumber: 1,
        detectedAt: new Date().toISOString()
      });
    }
  });

  // 3. Unresolved Promises & Broken Oaths
  dialogueFacts.forEach(df => {
    if (df.type === 'Promise' || df.type === 'Oath') {
      warnings.push({
        id: `warn-[#df-${df.id}]`,
        bookId,
        severity: 'Warning',
        title: 'Pending Dialogue Commitment',
        description: `Unresolved ${df.type} made by ${df.speaker}: "${df.fact}" in Chapter ${df.chapterNumber}.`,
        entityName: df.speaker,
        chapterNumber: df.chapterNumber,
        detectedAt: new Date().toISOString()
      });
    }
  });

  return warnings;
}
