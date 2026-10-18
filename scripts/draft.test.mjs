import assert from 'node:assert/strict'
import test from 'node:test'
import { isDraftSnapshot } from '../src/draft.ts'
import { canPostBanHero, getHeroCooldowns, isProtectedPick, pickAvailabilityRound, summarizeRound } from '../src/draftRules.ts'

const hero = { name: 'Zio', short: 'Z', role: 'Mage', element: 'Dark', tone: 'violet', id: 'c1133' }
const empty = () => ({
  gameNumber: 1, pairIndex: 0, activeTurn: 0, startedAt: Date.now(),
  draft: { preBan: { blue: [null, null], red: [null, null] }, picks: { blue: Array(5).fill(null), red: Array(5).fill(null) }, postBan: { blue: null, red: null } },
  lockedHeroes: [], persistentBans: [], banHistory: [], previousRoundSummaries: [],
  matchups: Array.from({ length: 5 }, () => ({ blue: '', red: '' })),
  matchScores: Array.from({ length: 5 }, () => ({ blue: 0, red: 0 })), matchupHistory: [],
  roundWinner: null, firstPickSide: 'blue', nextFirstPickSide: null,
})

test('accepts a new Lunatic room and a populated round with history', () => {
  const state = empty()
  assert.equal(isDraftSnapshot(state), true)
  state.gameNumber = 2
  state.activeTurn = 16
  state.draft.preBan.blue.fill(hero)
  state.draft.preBan.red.fill(hero)
  state.draft.picks.red[2] = hero
  state.draft.postBan.blue = hero
  state.roundWinner = 'blue'
  state.matchScores[0].blue = 1
  state.previousRoundSummaries.push({ matchup: state.matchups[0], round: 1, preBans: Array(4).fill(hero), picks: [{ hero, side: 'red', protected: true }], postBans: [{ hero, side: 'blue' }] })
  state.matchupHistory.push({ matchup: state.matchups[0], score: { blue: 2, red: 1 } })
  assert.equal(isDraftSnapshot(JSON.parse(JSON.stringify(state))), true)
})

test('rejects missing fields and malformed messages without throwing', () => {
  for (const data of [null, undefined, 'draft', [], {}, { draft: null }, { ...empty(), matchups: null }]) {
    assert.equal(isDraftSnapshot(data), false)
  }
})

test('rejects invalid slots, heroes, sides and turn ranges', () => {
  for (const modify of [
    (state) => { state.draft.preBan.blue.push(null) },
    (state) => { state.draft.preBan.red.pop() },
    (state) => { state.draft.picks.red.pop() },
    (state) => { state.draft.postBan.blue = {} },
    (state) => { state.draft.preBan.blue[0] = { ...hero, name: 123 } },
    (state) => { state.activeTurn = 17 },
    (state) => { state.pairIndex = 5 },
    (state) => { state.firstPickSide = 'green' },
    (state) => { state.roundWinner = undefined },
    (state) => { state.startedAt = Infinity },
  ]) {
    const state = empty()
    modify(state)
    assert.equal(isDraftSnapshot(state), false)
  }
})

test('rejects malformed history and scores before spectators render them', () => {
  const state = empty()
  state.matchScores[0].blue = 3
  assert.equal(isDraftSnapshot(state), false)
  state.matchScores[0].blue = 0
  state.previousRoundSummaries.push({ matchup: {}, round: 1, preBans: [], picks: [], postBans: [] })
  assert.equal(isDraftSnapshot(state), false)
})

test('accepts the last postban turns and rejects more than four preban heroes in a round', () => {
  const state = empty()
  for (const activeTurn of [14, 15, 16]) {
    state.activeTurn = activeTurn
    assert.equal(isDraftSnapshot(state), true)
  }
  state.previousRoundSummaries.push({ matchup: state.matchups[0], round: 1, preBans: Array(5).fill(hero), picks: [], postBans: [] })
  assert.equal(isDraftSnapshot(state), false)
})

test('accepts maximum legitimate accumulated bans and rejects oversized lists', () => {
  const state = empty()
  state.lockedHeroes = Array(20).fill('Hero')
  state.banHistory = Array(10).fill(hero)
  state.persistentBans = Array(30).fill('Hero')
  assert.equal(isDraftSnapshot(state), true)
  state.persistentBans.push('Extra')
  assert.equal(isDraftSnapshot(state), false)
})

const historyRound = (round, name = `Hero R${round}`) => ({ matchup: { blue: '', red: '' }, round, preBans: [], picks: [{ hero: { ...hero, name }, side: 'blue', protected: false }], postBans: [] })
const coolingNames = (history, round) => getHeroCooldowns(history, round).map(({ hero }) => hero.name)

test('rounds 1–6 skip one round and picks from round 7 skip two rounds', () => {
  assert.equal(pickAvailabilityRound(1), 3)
  assert.equal(pickAvailabilityRound(2), 4)
  assert.equal(pickAvailabilityRound(5), 7)
  assert.equal(pickAvailabilityRound(6), 8)
  assert.equal(pickAvailabilityRound(7), 10)
  assert.equal(pickAvailabilityRound(8), 11)
})

test('increasing cooldown at round 7 does not retroactively extend earlier picks', () => {
  const history = [historyRound(5), historyRound(6), historyRound(7), historyRound(8)]
  assert.deepEqual(coolingNames(history, 7), ['Hero R6'])
  assert.deepEqual(coolingNames(history, 8), ['Hero R7'])
  assert.deepEqual(coolingNames(history, 9), ['Hero R7', 'Hero R8'])
  assert.deepEqual(coolingNames(history, 10), ['Hero R8'])
  assert.deepEqual(coolingNames(history, 11), [])
})

test('cooldowns retain the latest use, report exact release rounds, and ignore current/future picks', () => {
  const history = [historyRound(10, 'Zio'), historyRound(7, 'Zio'), historyRound(12, 'Future')]
  assert.deepEqual(getHeroCooldowns(history, 11), [{ hero, usedRound: 10, availableRound: 13 }])
  assert.deepEqual(getHeroCooldowns(history, 13), [{ hero: { ...hero, name: 'Future' }, usedRound: 12, availableRound: 15 }])
})

test('cooldowns continue across completed BO3 pairs and include heroes later postbanned', () => {
  const summary = historyRound(7)
  summary.postBans = [{ hero: summary.picks[0].hero, side: 'red' }]
  assert.equal(getHeroCooldowns([summary], 9)[0].availableRound, 10)
  assert.equal(getHeroCooldowns([summary], 10).length, 0)
})

test('protection is active through round 14 and removed for both sides in round 15', () => {
  const draft = empty().draft
  draft.picks.blue = Array.from({ length: 5 }, (_, index) => ({ ...hero, name: `Blue ${index}` }))
  draft.picks.red = Array.from({ length: 5 }, (_, index) => ({ ...hero, name: `Red ${index}` }))
  assert.equal(isProtectedPick(14, 2), true)
  assert.equal(isProtectedPick(15, 2), false)
  for (const round of [1, 7, 14, 15]) {
    for (const side of ['blue', 'red']) {
      const opponent = side === 'blue' ? 'Red' : 'Blue'
      for (let index = 0; index < 5; index++) {
        assert.equal(canPostBanHero(draft, side, `${opponent} ${index}`, round), round === 15 || index !== 2)
      }
      assert.equal(canPostBanHero(draft, side, `${side === 'blue' ? 'Blue' : 'Red'} 2`, round), false)
    }
  }
  assert.equal(summarizeRound(draft, { blue: '', red: '' }, 14).picks.filter((pick) => pick.protected).length, 2)
  assert.equal(summarizeRound(draft, { blue: '', red: '' }, 15).picks.some((pick) => pick.protected), false)
})
