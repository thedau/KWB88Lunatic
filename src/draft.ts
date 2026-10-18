export type Side = 'blue' | 'red'
export const PRE_BANS_PER_SIDE = 2
export const DRAFT_TURN_COUNT = PRE_BANS_PER_SIDE * 2 + 10 + 2
export type Phase = 'preban' | 'pick' | 'postban'
export type Role = 'All' | 'Knight' | 'Soul Weaver' | 'Mage' | 'Ranger' | 'Thief' | 'Warrior'
export type Hero = { name: string; short: string; role: Exclude<Role, 'All'>; element: string; tone: string; id?: string }
export type Turn = { phase: Phase; side: Side; index: number }
export type DraftState = { preBan: Record<Side, (Hero | null)[]>; picks: Record<Side, (Hero | null)[]>; postBan: Record<Side, Hero | null> }
export type Matchup = { blue: string; red: string }
export type RoundPick = { hero: Hero; side: Side; protected: boolean }
export type RoundSummary = { matchup: Matchup; round: number; preBans: Hero[]; picks: RoundPick[]; postBans: { hero: Hero; side: Side }[] }
export type MatchScore = { blue: number; red: number }
export type MatchupHistoryEntry = { matchup: Matchup; score: MatchScore }

export type DraftSnapshot = {
  gameNumber: number
  pairIndex: number
  draft: DraftState
  activeTurn: number
  lockedHeroes: string[]
  persistentBans: string[]
  banHistory: Hero[]
  previousRoundSummaries: RoundSummary[]
  matchups: Matchup[]
  matchScores: MatchScore[]
  matchupHistory: MatchupHistoryEntry[]
  roundWinner: Side | null
  firstPickSide: Side
  nextFirstPickSide: Side | null
  startedAt: number
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const side = (value: unknown): value is Side => value === 'blue' || value === 'red'
const nullableSide = (value: unknown) => value === null || side(value)
const integer = (value: unknown, min: number, max: number) => Number.isInteger(value) && Number(value) >= min && Number(value) <= max
const list = (value: unknown, check: (item: unknown) => boolean, max: number) => Array.isArray(value) && value.length <= max && value.every(check)
const hero = (value: unknown) => record(value) && ['name', 'short', 'role', 'element', 'tone'].every((key) => typeof value[key] === 'string') && (value.id === undefined || typeof value.id === 'string')
const nullableHero = (value: unknown) => value === null || hero(value)
const matchup = (value: unknown) => record(value) && typeof value.blue === 'string' && typeof value.red === 'string'
const score = (value: unknown) => record(value) && integer(value.blue, 0, 2) && integer(value.red, 0, 2)
const heroSide = (value: unknown) => record(value) && hero(value.hero) && side(value.side)
const round = (value: unknown) => record(value) && matchup(value.matchup) && integer(value.round, 1, 15) && list(value.preBans, hero, PRE_BANS_PER_SIDE * 2) && list(value.picks, (pick) => heroSide(pick) && record(pick) && typeof pick.protected === 'boolean', 10) && list(value.postBans, heroSide, 2)

// Validate messages before the spectator renders any remote state.
export function isDraftSnapshot(value: unknown): value is DraftSnapshot {
  if (!record(value) || !record(value.draft)) return false
  const draft = value.draft
  return integer(value.gameNumber, 1, 15) && integer(value.pairIndex, 0, 4) && integer(value.activeTurn, 0, DRAFT_TURN_COUNT)
    && side(value.firstPickSide) && nullableSide(value.roundWinner) && nullableSide(value.nextFirstPickSide)
    && typeof value.startedAt === 'number' && Number.isFinite(value.startedAt) && value.startedAt > 0
    && record(draft.preBan) && record(draft.picks) && record(draft.postBan)
    && (['blue', 'red'] as const).every((key) => {
      const bans = (draft.preBan as Record<string, unknown>)[key]
      const picks = (draft.picks as Record<string, unknown>)[key]
      return Array.isArray(bans) && bans.length === PRE_BANS_PER_SIDE && bans.every(nullableHero)
        && Array.isArray(picks) && picks.length === 5 && picks.every(nullableHero)
        && nullableHero((draft.postBan as Record<string, unknown>)[key])
    })
    && list(value.lockedHeroes, (name) => typeof name === 'string', 20)
    && list(value.persistentBans, (name) => typeof name === 'string', 30)
    && list(value.banHistory, hero, 10) && list(value.previousRoundSummaries, round, 15)
    && Array.isArray(value.matchups) && value.matchups.length === 5 && value.matchups.every(matchup)
    && Array.isArray(value.matchScores) && value.matchScores.length === 5 && value.matchScores.every(score)
    && list(value.matchupHistory, (entry) => record(entry) && matchup(entry.matchup) && score(entry.score), 5)
}
