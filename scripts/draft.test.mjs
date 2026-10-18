import assert from 'node:assert/strict'
import test from 'node:test'
import { isDraftSnapshot } from '../src/draft.ts'

const hero = { name: 'Zio', short: 'Z', role: 'Mage', element: 'Dark', tone: 'violet', id: 'c1133' }
const empty = () => ({
  gameNumber: 1, pairIndex: 0, activeTurn: 0, startedAt: Date.now(),
  draft: { preBan: { blue: [null], red: [null] }, picks: { blue: Array(5).fill(null), red: Array(5).fill(null) }, postBan: { blue: null, red: null } },
  lockedHeroes: [], persistentBans: [], banHistory: [], previousRoundSummaries: [],
  matchups: Array.from({ length: 5 }, () => ({ blue: '', red: '' })),
  matchScores: Array.from({ length: 5 }, () => ({ blue: 0, red: 0 })), matchupHistory: [],
  roundWinner: null, firstPickSide: 'blue', nextFirstPickSide: null,
})

test('accepts a new Lunatic room and a populated round with history', () => {
  const state = empty()
  assert.equal(isDraftSnapshot(state), true)
  state.gameNumber = 2
  state.activeTurn = 14
  state.draft.preBan.blue[0] = hero
  state.draft.picks.red[2] = hero
  state.draft.postBan.blue = hero
  state.roundWinner = 'blue'
  state.matchScores[0].blue = 1
  state.previousRoundSummaries.push({ matchup: state.matchups[0], round: 1, preBans: [hero], picks: [{ hero, side: 'red', protected: true }], postBans: [{ hero, side: 'blue' }] })
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
    (state) => { state.draft.picks.red.pop() },
    (state) => { state.draft.postBan.blue = {} },
    (state) => { state.draft.preBan.blue[0] = { ...hero, name: 123 } },
    (state) => { state.activeTurn = 15 },
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

test('accepts maximum legitimate accumulated bans and rejects oversized lists', () => {
  const state = empty()
  state.lockedHeroes = Array(10).fill('Hero')
  state.banHistory = Array(10).fill(hero)
  state.persistentBans = Array(20).fill('Hero')
  assert.equal(isDraftSnapshot(state), true)
  state.persistentBans.push('Extra')
  assert.equal(isDraftSnapshot(state), false)
})
