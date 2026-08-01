import { StructuredExtractionJSON } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: StructuredExtractionJSON;
}

export interface ExistingEntitiesContext {
  characters: string[];
  abilities: string[];
  items: string[];
  locations: string[];
  organizations: string[];
}

/**
 * Robust JSON cleaner: Strips markdown code fences, leading text (e.g. "JSON\n{...}", "Here is the JSON:"), and trailing commentary.
 */
export function cleanJsonResponse(rawOutput: string): string {
  if (!rawOutput) return '';
  let text = rawOutput.trim();

  // Strip markdown code fences if present
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();

  // Extract from first opening '{' to last closing '}'
  const firstBraceIndex = text.indexOf('{');
  const lastBraceIndex = text.lastIndexOf('}');

  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    text = text.substring(firstBraceIndex, lastBraceIndex + 1);
  }

  return text;
}

/**
 * Normalizes entity names for fuzzy duplicate detection (strips punctuation, trims, lowercase).
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
}

/**
 * Checks string similarity to prevent accidental duplicate entities.
 */
export function isHighlySimilar(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return true;
  if (n1.length > 3 && n2.length > 3) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  return false;
}

/**
 * Generic character name blacklists to filter out unnamed background characters (e.g. "soldier", "merchant", "guard")
 */
const GENERIC_CHARACTER_PATTERNS = [
  /^(a\s+)?guard$/i, /^(a\s+)?soldier$/i, /^(a\s+)?merchant$/i, /^(a\s+)?villager$/i,
  /^(a\s+)?stranger$/i, /^(a\s+)?man$/i, /^(a\s+)?woman$/i, /^(a\s+)?crowd$/i,
  /^(a\s+)?peasant$/i, /^(a\s+)?bystander$/i, /^(a\s+)?thug$/i, /^(a\s+)?bandit$/i
];

/**
 * Strict Rule Engine & JSON Schema Validator for Story Bible AI
 */
export function validateAndCleanExtraction(
  rawJson: string,
  chapterText: string,
  existingContext: ExistingEntitiesContext = {
    characters: [],
    abilities: [],
    items: [],
    locations: [],
    organizations: []
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cleaned = cleanJsonResponse(rawJson);
  let parsed: any = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt basic structural repair for truncated trailing JSON
    try {
      let repaired = cleaned.trim();
      if (!repaired.endsWith('}')) {
        repaired += '}';
      }
      parsed = JSON.parse(repaired);
      warnings.push('Repaired trailing JSON brackets automatically.');
    } catch (repairErr) {
      return {
        valid: false,
        errors: [`AI response is not valid JSON: ${err.message}. Raw output contained syntax errors.`],
        warnings: []
      };
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      errors: ['AI response root must be a valid JSON object.'],
      warnings: []
    };
  }

  // 1. Summary Validation
  if (!parsed.summary || typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
    errors.push('Summary is required.');
  } else {
    const wordCount = parsed.summary.trim().split(/\s+/).length;
    if (wordCount > 300) {
      errors.push(`Summary exceeds maximum allowed 300 words (Current word count: ${wordCount}).`);
    }
  }

  // Sanitizer helpers
  const sanitizeStringArray = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  };

  const sanitizeOptionalString = (val: any): string | undefined => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return undefined;
  };

  // 2. Character Validation
  const validatedCharacters: any[] = [];
  const seenCharNames = new Set<string>();

  const processCharList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const char of list) {
      if (!char || typeof char !== 'object') continue;
      const name = typeof char.name === 'string' ? char.name.trim() : '';

      if (!name) continue;

      // Filter background generics
      if (GENERIC_CHARACTER_PATTERNS.some(pattern => pattern.test(name))) {
        warnings.push(`Filtered out generic unnamed background entity "${name}".`);
        continue;
      }

      const normalized = normalizeName(name);

      // Check duplicates within this response
      if (seenCharNames.has(normalized)) {
        warnings.push(`Duplicate character entry for "${name}" ignored.`);
        continue;
      }

      // Check against existing database characters
      const existingMatch = existingContext.characters.find(ex => isHighlySimilar(ex, name));
      if (existingMatch && existingMatch.toLowerCase() !== name.toLowerCase()) {
        warnings.push(`Character "${name}" was linked to existing character "${existingMatch}".`);
      }

      seenCharNames.add(normalized);
      validatedCharacters.push({
        name,
        aliases: sanitizeStringArray(char.aliases),
        summary: typeof char.summary === 'string' ? char.summary.trim() : '',
        status: ['Active', 'Deceased', 'Missing', 'Unknown'].includes(char.status) ? char.status : 'Active',
        occupation: sanitizeOptionalString(char.occupation),
        location: sanitizeOptionalString(char.location),
        emotional_state: sanitizeOptionalString(char.emotional_state),
        physical_injuries: sanitizeOptionalString(char.physical_injuries),
        physical_changes: sanitizeOptionalString(char.physical_changes),
        clothing: sanitizeOptionalString(char.clothing),
        goals: sanitizeOptionalString(char.goals),
        secrets_revealed: sanitizeStringArray(char.secrets_revealed),
        promises_made: sanitizeStringArray(char.promises_made),
        promises_broken: sanitizeStringArray(char.promises_broken),
        decisions: sanitizeStringArray(char.decisions),
        knowledge_gained: sanitizeStringArray(char.knowledge_gained),
        knowledge_lost: sanitizeStringArray(char.knowledge_lost)
      });
    }
  };

  processCharList(parsed.characters);
  processCharList(parsed.new_characters);

  // 3. Ability Validation
  const validatedAbilities: any[] = [];
  if (Array.isArray(parsed.abilities)) {
    for (const ab of parsed.abilities) {
      if (!ab || typeof ab !== 'object') continue;
      const name = typeof ab.name === 'string' ? ab.name.trim() : '';
      if (!name) continue;

      validatedAbilities.push({
        name,
        description: typeof ab.description === 'string' ? ab.description.trim() : '',
        users: sanitizeStringArray(ab.users),
        category: sanitizeOptionalString(ab.category)
      });
    }
  }

  // 4. Item Validation
  const validatedItems: any[] = [];
  if (Array.isArray(parsed.items)) {
    for (const it of parsed.items) {
      if (!it || typeof it !== 'object') continue;
      const name = typeof it.name === 'string' ? it.name.trim() : '';
      if (!name) continue;

      if (GENERIC_CHARACTER_PATTERNS.some(p => p.test(name)) || /^item$/i.test(name) || /^thing$/i.test(name)) {
        continue;
      }

      validatedItems.push({
        name,
        description: typeof it.description === 'string' ? it.description.trim() : '',
        type: sanitizeOptionalString(it.type),
        owner: sanitizeOptionalString(it.owner),
        previous_owner: sanitizeOptionalString(it.previous_owner),
        location: sanitizeOptionalString(it.location),
        condition: ['Intact', 'Damaged', 'Repaired'].includes(it.condition) ? it.condition : undefined,
        status: ['Active', 'Destroyed', 'Lost', 'Stored', 'Hidden', 'Borrowed'].includes(it.status) ? it.status : 'Active'
      });
    }
  }

  // 5. Location Validation
  const validatedLocations: any[] = [];
  if (Array.isArray(parsed.locations)) {
    for (const loc of parsed.locations) {
      if (!loc || typeof loc !== 'object') continue;
      const name = typeof loc.name === 'string' ? loc.name.trim() : '';
      if (!name) continue;

      if (/^room$/i.test(name) || /^outside$/i.test(name) || /^inside$/i.test(name)) {
        continue;
      }

      validatedLocations.push({
        name,
        summary: typeof loc.summary === 'string' ? loc.summary.trim() : '',
        type: sanitizeOptionalString(loc.type),
        characters_present: sanitizeStringArray(loc.characters_present),
        items_located: sanitizeStringArray(loc.items_located),
        environmental_changes: sanitizeOptionalString(loc.environmental_changes)
      });
    }
  }

  // 6. Events Validation
  const validatedEvents: any[] = [];
  if (Array.isArray(parsed.events)) {
    for (const ev of parsed.events) {
      if (!ev || typeof ev !== 'object') continue;
      const title = typeof ev.title === 'string' ? ev.title.trim() : '';
      if (!title) continue;

      validatedEvents.push({
        title,
        description: typeof ev.description === 'string' ? ev.description.trim() : '',
        significance: ['Minor', 'Major', 'Climactic'].includes(ev.significance) ? ev.significance : 'Major',
        location: sanitizeOptionalString(ev.location),
        participants: sanitizeStringArray(ev.participants),
        winner: sanitizeOptionalString(ev.winner),
        loser: sanitizeOptionalString(ev.loser),
        deaths: sanitizeStringArray(ev.deaths),
        injuries: sanitizeStringArray(ev.injuries),
        items_exchanged: sanitizeStringArray(ev.items_exchanged),
        abilities_used: sanitizeStringArray(ev.abilities_used),
        consequences: sanitizeOptionalString(ev.consequences)
      });
    }
  }

  // 7. Organizations
  const validatedOrganizations: any[] = [];
  if (Array.isArray(parsed.organizations)) {
    for (const org of parsed.organizations) {
      if (!org || typeof org !== 'object') continue;
      const name = typeof org.name === 'string' ? org.name.trim() : '';
      if (!name) continue;

      validatedOrganizations.push({
        name,
        description: typeof org.description === 'string' ? org.description.trim() : '',
        alignment: sanitizeOptionalString(org.alignment),
        leader: sanitizeOptionalString(org.leader),
        members: sanitizeStringArray(org.members)
      });
    }
  }

  // 8. Relationships
  const validatedRelationships: any[] = [];
  if (Array.isArray(parsed.relationship_changes)) {
    for (const rc of parsed.relationship_changes) {
      if (!rc || typeof rc !== 'object') continue;
      const c1 = typeof rc.character1 === 'string' ? rc.character1.trim() : '';
      const c2 = typeof rc.character2 === 'string' ? rc.character2.trim() : '';
      if (!c1 || !c2) continue;

      validatedRelationships.push({
        character1: c1,
        character2: c2,
        relationType: typeof rc.relationType === 'string' ? rc.relationType.trim() : 'Allies',
        description: typeof rc.description === 'string' ? rc.description.trim() : ''
      });
    }
  }

  // 9. Dialogue Facts
  const validatedDialogueFacts: any[] = [];
  if (Array.isArray(parsed.dialogue_facts)) {
    for (const df of parsed.dialogue_facts) {
      if (!df || typeof df !== 'object') continue;
      const speaker = typeof df.speaker === 'string' ? df.speaker.trim() : '';
      const fact = typeof df.fact === 'string' ? df.fact.trim() : '';
      if (!speaker || !fact) continue;

      const validTypes = ['Promise', 'Threat', 'Lie', 'Confession', 'Secret', 'Agreement', 'Decision', 'Order', 'Oath', 'Revelation'];
      const factType = validTypes.includes(df.type) ? df.type : 'Revelation';

      validatedDialogueFacts.push({
        speaker,
        recipient: sanitizeOptionalString(df.recipient),
        type: factType,
        fact
      });
    }
  }

  // 10. Plot Threads & Foreshadowing
  const validatedPlotThreads: any[] = [];
  if (Array.isArray(parsed.plot_threads)) {
    for (const pt of parsed.plot_threads) {
      if (!pt || typeof pt !== 'object') continue;
      const title = typeof pt.title === 'string' ? pt.title.trim() : '';
      if (!title) continue;

      validatedPlotThreads.push({
        title,
        description: typeof pt.description === 'string' ? pt.description.trim() : ''
      });
    }
  }

  const validatedForeshadowing: any[] = [];
  if (Array.isArray(parsed.foreshadowing)) {
    for (const fs of parsed.foreshadowing) {
      if (!fs || typeof fs !== 'object') continue;
      const clue = typeof fs.clueDescription === 'string' ? fs.clueDescription.trim() : '';
      if (!clue) continue;

      validatedForeshadowing.push({
        clueDescription: clue,
        payoffTarget: typeof fs.payoffTarget === 'string' ? fs.payoffTarget.trim() : undefined
      });
    }
  }

  const cleanedOutput: StructuredExtractionJSON = {
    summary: parsed.summary ? parsed.summary.trim() : '',
    characters: validatedCharacters,
    new_characters: [],
    events: validatedEvents,
    abilities: validatedAbilities,
    items: validatedItems,
    locations: validatedLocations,
    organizations: validatedOrganizations,
    relationship_changes: validatedRelationships,
    dialogue_facts: validatedDialogueFacts,
    timeline: {
      time_passed: parsed.timeline?.time_passed || null,
      current_arc: parsed.timeline?.current_arc || null,
      time_skips: parsed.timeline?.time_skips || null,
      season: parsed.timeline?.season || null,
      is_flashback: Boolean(parsed.timeline?.is_flashback)
    },
    plot_threads: validatedPlotThreads,
    foreshadowing: validatedForeshadowing,
    warnings: warnings
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? cleanedOutput : undefined
  };
}
