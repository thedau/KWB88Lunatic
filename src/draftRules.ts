import type { DraftState, Hero, Matchup, RoundSummary, Side } from './draft.ts'

export type HeroCooldown = { hero: Hero; usedRound: number; availableRound: number }

// A pick keeps the cooldown assigned in its own round, including across BO3 pairs.
export const pickCooldownRounds = (usedRound: number) => usedRound >= 7 ? 2 : 1
export const isProtectedPick = (round: number, index: number) => round < 15 && index === 2
export const pickAvailabilityRound = (usedRound: number) => usedRound + pickCooldownRounds(usedRound) + 1

export function getHeroCooldowns(history: RoundSummary[], currentRound: number): HeroCooldown[] {
  const latest = new Map<string, HeroCooldown>()
  for (const summary of history) {
    if (summary.round >= currentRound) continue
    for (const { hero } of summary.picks) {
      if ((latest.get(hero.name)?.usedRound ?? 0) < summary.round) {
        latest.set(hero.name, { hero, usedRound: summary.round, availableRound: pickAvailabilityRound(summary.round) })
      }
    }
  }
  return [...latest.values()]
    .filter(({ availableRound }) => currentRound < availableRound)
    .sort((a, b) => a.availableRound - b.availableRound || a.hero.name.localeCompare(b.hero.name))
}

export function canPostBanHero(draft: DraftState, banningSide: Side, heroName: string, round: number): boolean {
  const opponent = banningSide === 'blue' ? 'red' : 'blue'
  return draft.picks[opponent].some((hero, index) => hero?.name === heroName && !isProtectedPick(round, index))
}

export function summarizeRound(draft: DraftState, matchup: Matchup, round: number): RoundSummary {
  return {
    matchup: { ...matchup }, round,
    preBans: (['blue', 'red'] as const).flatMap((side) => draft.preBan[side].filter((hero): hero is Hero => Boolean(hero))),
    picks: (['blue', 'red'] as const).flatMap((side) => draft.picks[side].flatMap((hero, index) => hero ? [{ hero, side, protected: isProtectedPick(round, index) }] : [])),
    postBans: (['blue', 'red'] as const).flatMap((side) => draft.postBan[side] ? [{ hero: draft.postBan[side]!, side }] : []),
  }
}
