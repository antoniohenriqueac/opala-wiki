/** Shared experience range (highest level in party). Stonegy / Tibia-style rules. */
export function expShareRange(level: number): { min: number; max: number } {
  const lv = Math.max(1, Math.min(9999, Math.floor(level)));
  const min = lv <= 1 ? 0 : Math.ceil(lv / 1.5);
  const baseMax = Math.floor(lv * 1.5);
  const max = baseMax + (baseMax % 2 === 1 ? 2 : 1);
  return { min, max };
}

export function canShareExp(highestLevel: number, memberLevel: number): boolean {
  const { min, max } = expShareRange(highestLevel);
  const lv = Math.floor(memberLevel);
  return lv >= min && lv <= max;
}

export interface PartyMember {
  id: string;
  name: string;
  level: number;
}

export interface PartyShareResult {
  highestLevel: number;
  range: { min: number; max: number };
  members: Array<PartyMember & { inRange: boolean }>;
  allInRange: boolean;
}

export function analyzeParty(members: PartyMember[]): PartyShareResult | null {
  const valid = members.filter((m) => m.level >= 1);
  if (!valid.length) return null;

  const highestLevel = Math.max(...valid.map((m) => m.level));
  const range = expShareRange(highestLevel);
  const withStatus = members.map((m) => ({
    ...m,
    inRange: m.level >= 1 ? canShareExp(highestLevel, m.level) : false,
  }));

  return {
    highestLevel,
    range,
    members: withStatus,
    allInRange: withStatus.every((m) => m.level < 1 || m.inRange),
  };
}

export function spanLevels(min: number, max: number): number {
  return Math.max(0, max - min + 1);
}
