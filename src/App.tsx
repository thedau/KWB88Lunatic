import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Mode = 'normal' | 'lunatic'
type Side = 'blue' | 'red'
type Phase = 'preban' | 'pick' | 'postban'
type Role = 'All' | 'Knight' | 'Soul Weaver' | 'Mage' | 'Ranger' | 'Thief' | 'Warrior' | 'Assassin'
type Hero = { name: string; short: string; role: Exclude<Role, 'All'>; element: string; tone: string; id?: string }
type Turn = { phase: Phase; side: Side; index: number }
type DraftState = { preBan: Record<Side, (Hero | null)[]>; picks: Record<Side, (Hero | null)[]>; postBan: Record<Side, Hero | null> }
type Matchup = { blue: string; red: string }

const starterHeroes: Hero[] = [
  { name: 'Zio', short: 'Z', role: 'Mage', element: 'Dark', tone: 'violet', id: 'c1133' },
  { name: 'Ran', short: 'R', role: 'Thief', element: 'Ice', tone: 'ice', id: 'c1118' },
  { name: 'Nahkwol', short: 'N', role: 'Mage', element: 'Dark', tone: 'rose', id: 'c1151' },
  { name: 'Harseti', short: 'H', role: 'Knight', element: 'Dark', tone: 'gold' },
  { name: 'Briar Witch Iseria', short: 'I', role: 'Ranger', element: 'Dark', tone: 'crimson', id: 'c2024' },
  { name: 'Sea Phantom Politis', short: 'P', role: 'Mage', element: 'Ice', tone: 'aqua', id: 'c2112' },
  { name: 'Conqueror Lilias', short: 'L', role: 'Warrior', element: 'Fire', tone: 'amber', id: 'c2089' },
  { name: 'Belian', short: 'B', role: 'Knight', element: 'Light', tone: 'mint', id: 'c1117' },
  { name: 'Arowell', short: 'A', role: 'Knight', element: 'Light', tone: 'blue', id: 'c3004' },
  { name: 'Mediator Kawerik', short: 'K', role: 'Warrior', element: 'Dark', tone: 'slate', id: 'c2073' },
  { name: 'Lua', short: 'L', role: 'Thief', element: 'Ice', tone: 'sky', id: 'c1126' },
  { name: 'Ainos', short: 'A', role: 'Soul Weaver', element: 'Ice', tone: 'pink', id: 'c3105' },
  { name: 'Dilibet', short: 'D', role: 'Warrior', element: 'Light', tone: 'violet' },
  { name: 'Ruele of Light', short: 'R', role: 'Soul Weaver', element: 'Light', tone: 'cream', id: 'c1022' },
  { name: 'Politis', short: 'P', role: 'Mage', element: 'Fire', tone: 'orange', id: 'c1112' },
  { name: 'Vildred', short: 'V', role: 'Thief', element: 'Earth', tone: 'green', id: 'c1007' },
  { name: 'Abyssal Yufine', short: 'Y', role: 'Warrior', element: 'Dark', tone: 'purple', id: 'c2016' },
  { name: 'Navy Captain Landy', short: 'L', role: 'Ranger', element: 'Ice', tone: 'navy', id: 'c2109' },
]
const roles: Role[] = ['All', 'Knight', 'Soul Weaver', 'Mage', 'Ranger', 'Thief', 'Warrior', 'Assassin']
const elements = ['All', 'Fire', 'Ice', 'Earth', 'Light', 'Dark']
const roleNames: Record<string, Exclude<Role, 'All'>> = { knight: 'Knight', manauser: 'Soul Weaver', mage: 'Mage', ranger: 'Ranger', assassin: 'Assassin', warrior: 'Warrior' }
const elementNames: Record<string, string> = { wind: 'Earth', fire: 'Fire', ice: 'Ice', light: 'Light', dark: 'Dark' }

function createDraft(preBanCount: number): DraftState {
  return { preBan: { blue: Array(preBanCount).fill(null), red: Array(preBanCount).fill(null) }, picks: { blue: Array(5).fill(null), red: Array(5).fill(null) }, postBan: { blue: null, red: null } }
}

function createTurns(preBanCount: number): Turn[] {
  const preBan = (['blue', 'red'] as Side[]).flatMap((side) => Array.from({ length: preBanCount }, (_, index) => ({ phase: 'preban' as const, side, index })))
  const pickSequence: Side[] = ['blue', 'red', 'red', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'red']
  const pickSeen: Record<Side, number> = { blue: 0, red: 0 }
  const picks = pickSequence.map((side) => ({ phase: 'pick' as const, side, index: pickSeen[side]++ }))
  return [...preBan, ...picks, { phase: 'postban', side: 'blue', index: 0 }, { phase: 'postban', side: 'red', index: 0 }]
}

function App() {
  const [mode, setMode] = useState<Mode>('normal')
  const [gameNumber, setGameNumber] = useState(1)
  const [role, setRole] = useState<Role>('All')
  const [element, setElement] = useState('All')
  const [query, setQuery] = useState('')
  const [heroes, setHeroes] = useState<Hero[]>(starterHeroes)
  const [draft, setDraft] = useState<DraftState>(() => createDraft(2))
  const [activeTurn, setActiveTurn] = useState(0)
  const [lockedHeroes, setLockedHeroes] = useState<string[]>([])
  const [persistentBans, setPersistentBans] = useState<string[]>([])
  const [banHistory, setBanHistory] = useState<Hero[]>([])
  const [previousRoundPicks, setPreviousRoundPicks] = useState<Hero[]>([])
  const [matchups, setMatchups] = useState<Matchup[]>(() => Array.from({ length: 5 }, () => ({ blue: '', red: '' })))
  const [matchupHistory, setMatchupHistory] = useState<Matchup[]>([])
  const preBanCount = mode === 'lunatic' ? 1 : 2
  const turns = useMemo(() => createTurns(preBanCount), [preBanCount])
  const currentTurn = turns[activeTurn]
  const currentPairIndex = Math.floor((gameNumber - 1) / 3)
  const currentMatchup = matchups[currentPairIndex] ?? { blue: '', red: '' }
  const usedNames = useMemo(() => [...draft.preBan.blue, ...draft.preBan.red, ...draft.picks.blue, ...draft.picks.red, draft.postBan.blue, draft.postBan.red].filter(Boolean).map((hero) => hero!.name), [draft])
  const unavailableNames = new Set([...usedNames, ...persistentBans, ...(mode === 'lunatic' ? lockedHeroes : [])])
  const filteredHeroes = useMemo(() => heroes.filter((hero) => hero.name.toLowerCase().includes(query.toLowerCase()) && (role === 'All' || hero.role === role) && (element === 'All' || hero.element === element)), [heroes, query, role, element])

  useEffect(() => {
    fetch('/data/CeciliaBot.github.io-master/data/HeroDatabase.json')
      .then((response) => response.json())
      .then((database: Record<string, { name: string; id: string; attribute: string; role: string }>) => {
        setHeroes(Object.values(database).map((hero) => ({ name: hero.name, short: hero.name.slice(0, 1), id: hero.id, role: roleNames[hero.role] ?? 'Warrior', element: elementNames[hero.attribute] ?? hero.attribute, tone: hero.attribute === 'wind' ? 'green' : hero.attribute })))
      })
      .catch(() => undefined)
  }, [])

  const resetGame = () => { setDraft(createDraft(preBanCount)); setActiveTurn(0) }
  const startNextGame = () => {
    if (mode !== 'lunatic') return resetGame()
    if (gameNumber >= 15) return
    const gamePicks = [...draft.picks.blue, ...draft.picks.red].filter((hero): hero is Hero => Boolean(hero))
    const gamePickNames = gamePicks.map((hero) => hero.name)
    const nextHistory = [...banHistory, ...draft.preBan.blue, ...draft.preBan.red].filter((hero): hero is Hero => Boolean(hero)).slice(-12)
    const pairComplete = gameNumber % 3 === 0
    const nextLockedHeroes = pairComplete ? [] : [...new Set(gamePickNames)]
    setPreviousRoundPicks(gamePicks)
    setLockedHeroes(nextLockedHeroes)
    setPersistentBans([...new Set([...nextHistory.map((hero) => hero.name), ...nextLockedHeroes])])
    setBanHistory(nextHistory)
    if (gameNumber % 3 === 0) setMatchupHistory((current) => [...current, matchups[currentPairIndex] ?? { blue: '', red: '' }])
    setGameNumber((current) => current + 1)
    resetGame()
  }

  const chooseHero = (hero: Hero) => {
    if (!currentTurn) return
    const bannedTurnIndex = turns.findIndex((turn) => turn.phase === 'preban' && draft.preBan[turn.side][turn.index]?.name === hero.name)
    if (currentTurn.phase !== 'postban' && bannedTurnIndex >= 0) {
      setActiveTurn(bannedTurnIndex)
      setDraft((current) => {
        const turn = turns[bannedTurnIndex]
        const next: DraftState = { preBan: { blue: [...current.preBan.blue], red: [...current.preBan.red] }, picks: { blue: [...current.picks.blue], red: [...current.picks.red] }, postBan: { ...current.postBan } }
        next.preBan[turn.side][turn.index] = null
        return next
      })
      return
    }
    const pickedTurnIndex = turns.findIndex((turn) => turn.phase === 'pick' && draft.picks[turn.side][turn.index]?.name === hero.name)
    if (currentTurn.phase !== 'postban' && pickedTurnIndex >= 0) {
      setActiveTurn(pickedTurnIndex)
      setDraft((current) => {
        const turn = turns[pickedTurnIndex]
        const next: DraftState = { preBan: { blue: [...current.preBan.blue], red: [...current.preBan.red] }, picks: { blue: [...current.picks.blue], red: [...current.picks.red] }, postBan: { ...current.postBan } }
        next.picks[turn.side][turn.index] = null
        return next
      })
      return
    }
    const postBanTurnIndex = turns.findIndex((turn) => turn.phase === 'postban' && draft.postBan[turn.side]?.name === hero.name)
    if (currentTurn.phase === 'postban' && postBanTurnIndex >= 0) {
      setActiveTurn(postBanTurnIndex)
      const postBanSide = turns[postBanTurnIndex].side
      setDraft((current) => ({ ...current, postBan: { ...current.postBan, [postBanSide]: null } }))
      return
    }
    if (currentTurn.phase === 'postban') {
      const opponent = currentTurn.side === 'blue' ? 'red' : 'blue'
      if (!draft.picks[opponent].some((pick, index) => pick?.name === hero.name && index !== 2)) return
    } else {
      const currentSlotHero = currentTurn.phase === 'preban' ? draft.preBan[currentTurn.side][currentTurn.index] : draft.picks[currentTurn.side][currentTurn.index]
      if (unavailableNames.has(hero.name) && currentSlotHero?.name !== hero.name) return
    }
    setDraft((current) => {
      const next: DraftState = { preBan: { blue: [...current.preBan.blue], red: [...current.preBan.red] }, picks: { blue: [...current.picks.blue], red: [...current.picks.red] }, postBan: { ...current.postBan } }
      if (currentTurn.phase === 'preban') next.preBan[currentTurn.side][currentTurn.index] = hero
      if (currentTurn.phase === 'pick') next.picks[currentTurn.side][currentTurn.index] = hero
      if (currentTurn.phase === 'postban') next.postBan[currentTurn.side] = hero
      return next
    })
    setActiveTurn((current) => current + 1)
  }

  const selectSlot = (turnIndex: number, slotHero?: Hero) => {
    const turn = turns[turnIndex]
    if (!turn) return
    if (currentTurn?.phase === 'postban' && turn.phase === 'postban') {
      if (draft.postBan[turn.side]) setDraft((current) => ({ ...current, postBan: { ...current.postBan, [turn.side]: null } }))
      setActiveTurn(turnIndex)
      return
    }
    if (currentTurn?.phase === 'postban' && turn.phase === 'pick' && turn.index === 2) return
    if (currentTurn?.phase === 'postban' && turn.phase === 'pick' && turn.index !== 2) {
      const targetHero = slotHero ?? draft.picks[turn.side][turn.index]
      if (!targetHero) return
      setDraft((current) => ({ ...current, postBan: { ...current.postBan, [currentTurn.side]: targetHero } }))
      setActiveTurn((current) => current + 1)
      return
    }
    if (turn.phase === 'postban' && draft.postBan[turn.side]) {
      setDraft((current) => ({ ...current, postBan: { ...current.postBan, [turn.side]: null } }))
      setActiveTurn(turnIndex)
      return
    }
    if (activeTurn === turnIndex && (turn.phase === 'preban' || turn.phase === 'pick')) {
      setDraft((current) => {
        const next: DraftState = { preBan: { blue: [...current.preBan.blue], red: [...current.preBan.red] }, picks: { blue: [...current.picks.blue], red: [...current.picks.red] }, postBan: { ...current.postBan } }
        if (turn.phase === 'preban' && current.preBan[turn.side][turn.index]) next.preBan[turn.side][turn.index] = null
        if (turn.phase === 'pick' && current.picks[turn.side][turn.index]) next.picks[turn.side][turn.index] = null
        return next
      })
      return
    }
    setActiveTurn(turnIndex)
  }

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode)
    setGameNumber(1)
    setLockedHeroes([])
    setPersistentBans([])
    setBanHistory([])
    setPreviousRoundPicks([])
    setMatchups(Array.from({ length: 5 }, () => ({ blue: '', red: '' })))
    setMatchupHistory([])
    setDraft(createDraft(nextMode === 'normal' ? 2 : 1))
    setActiveTurn(0)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark">E7</div><div><strong>ARENA DRAFT</strong><span>Competitive suite</span></div></div>
        <div className="match-status"><span className="status-dot" /> ROOM 0824 <b>•</b> {mode === 'lunatic' ? `PAIR ${Math.ceil(gameNumber / 3)} / BO3 / R${gameNumber}` : 'UNRANKED'}</div>
        <button type="button" className="icon-button" aria-label="Open settings">•••</button>
      </header>
      <section className="workspace-head">
        <div><div className="eyebrow">RTA MATCH ROOM / {mode === 'lunatic' ? `PAIR ${Math.ceil(gameNumber / 3)} OF 5 / ROUND ${gameNumber} OF 15` : 'PREPARATION'}</div><h1>Hero Draft <span>Lab</span></h1><p>{mode === 'lunatic' ? 'Five player pairs, each playing a best-of-three.' : 'Pre-ban, first pick, protection and post-ban in one room.'}</p></div>
        <div className="mode-switch" aria-label="Draft mode"><button type="button" className={mode === 'normal' ? 'active' : ''} onClick={() => changeMode('normal')}>Normal</button><button type="button" className={mode === 'lunatic' ? 'active lunatic' : ''} onClick={() => changeMode('lunatic')}>Lunatic <i>+</i></button></div>
      </section>
      {mode === 'lunatic' && <section className="matchup-panel"><div><div className="eyebrow">PAIR {currentPairIndex + 1} OF 5 / BEST OF THREE</div><strong>Enter the matchup</strong></div><label><span>BLUE SIDE</span><input value={currentMatchup.blue} onChange={(event) => setMatchups((current) => current.map((matchup, index) => index === currentPairIndex ? { ...matchup, blue: event.target.value } : matchup))} placeholder="Player name" /></label><b className="matchup-vs">VS</b><label><span>RED SIDE</span><input value={currentMatchup.red} onChange={(event) => setMatchups((current) => current.map((matchup, index) => index === currentPairIndex ? { ...matchup, red: event.target.value } : matchup))} placeholder="Player name" /></label>{matchupHistory.length > 0 && <div className="matchup-history">{matchupHistory.map((matchup, index) => <span key={`${matchup.blue}-${matchup.red}-${index}`}>PAIR {index + 1}: {matchup.blue || 'Blue'} vs {matchup.red || 'Red'}</span>)}</div>}</section>}
      <section className="draft-card">
        <div className="draft-head"><div><span className="live-kicker"><span className="live-dot" /> {currentTurn ? currentTurn.phase.toUpperCase() : 'DRAFT COMPLETE'}</span><strong>{currentTurn ? `${currentTurn.side === 'blue' ? 'Blue' : 'Red'} Side to ${currentTurn.phase === 'preban' ? 'pre-ban' : currentTurn.phase === 'pick' ? 'pick' : 'post-ban'}` : gameNumber >= 15 ? 'Tournament complete' : 'Round complete'}</strong></div><div className="draft-meta"><span>TURN <b>{currentTurn ? activeTurn + 1 : turns.length}</b> / {turns.length}</span><span className="timer">00:28</span><button type="button" className="reset-button" onClick={resetGame}>Reset</button>{mode === 'lunatic' && gameNumber < 15 && <button type="button" className="reset-button" onClick={startNextGame}>Next round</button>}</div></div>
        <div className="turn-track">{turns.map((turn, index) => <div key={`${turn.phase}-${turn.side}-${turn.index}`} className={`turn-step ${index < activeTurn ? 'done' : ''} ${index === activeTurn ? 'current' : ''}`}><span>{turn.phase === 'preban' ? 'B' : turn.phase === 'pick' ? 'P' : 'PB'}{turn.index + 1}</span><i /></div>)}</div>
        <BanStrip draft={draft} banHistory={banHistory} activeTurn={currentTurn} onSlot={selectSlot} />
        <div className="arena-body">
          <DraftTeam name={currentMatchup.blue || 'BLUE SIDE'} accent="blue" slots={draft} side="blue" activeTurn={currentTurn} onSlot={selectSlot} />
          <section className="pool-section">
            <div className="pool-head"><div><div className="eyebrow">AVAILABLE ROSTER / {heroes.length} HEROES</div><h2>{currentTurn?.phase === 'postban' ? 'Choose a threat to remove' : 'Choose your heroes'}</h2></div><span className="pool-count">{filteredHeroes.length} / {heroes.length} heroes</span></div>
            <div className="controls"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hero..." /></label><div className="role-filters">{roles.map((item) => <button type="button" key={item} className={role === item ? 'active' : ''} onClick={() => setRole((current) => current === item ? 'All' : item)}>{item}</button>)}</div><div className="role-filters element-filters">{elements.map((item) => <button type="button" key={item} className={element === item ? 'active' : ''} onClick={() => setElement((current) => current === item ? 'All' : item)}>{item}</button>)}</div></div>
            <div className="hero-grid">{filteredHeroes.map((hero) => <HeroCard key={hero.name} hero={hero} currentTurn={currentTurn} draft={draft} unavailableNames={unavailableNames} onChoose={chooseHero} />)}</div>
          </section>
          <DraftTeam name={currentMatchup.red || 'RED SIDE'} accent="red" slots={draft} side="red" activeTurn={currentTurn} onSlot={selectSlot} />
        </div>
      </section>
      {mode === 'lunatic' && previousRoundPicks.length > 0 && <PreviousRoundPicks heroes={previousRoundPicks} round={gameNumber - 1} />}
      <footer><span>EPIC SEVEN / {mode === 'lunatic' ? '5 PAIRS / BO3' : 'DRAFT PROTOCOL'} / 5v5</span><span><b className="footer-dot" /> {mode === 'lunatic' ? `${persistentBans.length} ACTIVE PRE-BANS` : 'ALL SYSTEMS NOMINAL'}</span></footer>
    </main>
  )
}

function PreviousRoundPicks({ heroes, round }: { heroes: Hero[]; round: number }) {
  return <section className="previous-round-picks"><div><div className="eyebrow">ROUND {round} / PICK MEMORY</div><strong>Heroes picked last round</strong></div><div className="previous-round-hero-list">{heroes.map((hero) => <div className="previous-round-hero" key={hero.name}><HeroPortrait hero={hero} variant="s" /><span>{hero.name}</span></div>)}</div></section>
}

function HeroCard({ hero, currentTurn, draft, unavailableNames, onChoose }: { hero: Hero; currentTurn?: Turn; draft: DraftState; unavailableNames: Set<string>; onChoose: (hero: Hero) => void }) {
  const opponent = currentTurn?.side === 'blue' ? 'red' : 'blue'
  const postBanTarget = currentTurn?.phase === 'postban' && draft.picks[opponent].some((pick, index) => pick?.name === hero.name && index !== 2)
  const protectedHero = currentTurn?.phase === 'postban' && draft.picks[opponent][2]?.name === hero.name
  const bannedHero = [...draft.preBan.blue, ...draft.preBan.red].some((ban) => ban?.name === hero.name)
  const pickedHero = [...draft.picks.blue, ...draft.picks.red].some((pick) => pick?.name === hero.name)
  const postBanHero = draft.postBan.blue?.name === hero.name || draft.postBan.red?.name === hero.name
  const disabled = currentTurn?.phase === 'postban' ? (!postBanHero && (!postBanTarget || protectedHero)) : bannedHero || pickedHero ? false : unavailableNames.has(hero.name)
  return <button type="button" disabled={disabled} className={`hero-tile ${disabled && currentTurn?.phase !== 'postban' ? 'chosen' : ''} ${bannedHero || pickedHero || postBanHero ? 'selected' : ''} ${protectedHero ? 'protected' : ''}`} onClick={() => onChoose(hero)}><HeroPortrait hero={hero} /><span className="hero-info"><b>{hero.name}</b><small>{hero.role} <i /> {hero.element}</small></span>{protectedHero ? <em>PROTECTED</em> : disabled && currentTurn?.phase !== 'postban' && <em>✓</em>}</button>
}

function BanStrip({ draft, banHistory, activeTurn, onSlot }: { draft: DraftState; banHistory: Hero[]; activeTurn?: Turn; onSlot: (turnIndex: number) => void }) {
  const bans = (['blue', 'red'] as Side[]).flatMap((side) => draft.preBan[side].map((hero, index) => ({ side, hero, index })))
  const turns = createTurns(draft.preBan.blue.length)
  return <div className="ban-strip"><div className="ban-strip-title"><span>PRE-BANS</span><small>{banHistory.length + bans.length} SLOTS / CENTRAL LOCKOUT</small></div><div className="ban-slots">{banHistory.map((hero, index) => <button type="button" className="draft-slot ban filled locked-ban" key={`history-ban-${index}`} disabled><HeroPortrait hero={hero} variant="s" /><b>{hero.name}</b></button>)}{bans.map(({ side, hero, index }) => { const turnIndex = turns.findIndex((turn) => turn.phase === 'preban' && turn.side === side && turn.index === index); return <Slot key={`${side}-${index}`} type="ban" hero={hero} active={activeTurn?.phase === 'preban' && activeTurn.side === side && activeTurn.index === index} onSlot={() => onSlot(turnIndex)} /> })}</div></div>
}

function DraftTeam({ name, accent, slots, side, activeTurn, onSlot }: { name: string; accent: Side; slots: DraftState; side: Side; activeTurn?: Turn; onSlot: (turnIndex: number, hero?: Hero) => void }) {
  const turns = createTurns(slots.preBan[side].length)
  const findTurn = (phase: Phase, index: number) => turns.findIndex((turn) => turn.phase === phase && turn.side === side && turn.index === index)
  return <div className={`team-panel ${accent}`}><div className="team-title"><span className="team-badge">{accent === 'blue' ? '◆' : '◇'}</span><div><b>{name}</b><small>{accent === 'blue' ? 'FIRST PICK' : 'SECOND PICK'}</small></div><strong>{accent === 'blue' ? '1,482' : '1,507'} <small>MMR</small></strong></div><div className="slot-group picks"><label>PICKS <span>5 slots / SLOT 3 PROTECTED</span></label><div className="slots picks-five">{slots.picks[side].map((hero, index) => <Slot key={`pick-${index}`} type="pick" hero={hero} protectedSlot={index === 2} active={activeTurn?.phase === 'pick' && activeTurn.side === side && activeTurn.index === index} onSlot={() => onSlot(findTurn('pick', index), hero ?? undefined)} />)}</div></div><div className="postban-line"><span>POST-BAN</span><Slot type="postban" hero={slots.postBan[side]} active={activeTurn?.phase === 'postban' && activeTurn.side === side} onSlot={() => onSlot(findTurn('postban', 0))} /></div></div>
}

function Slot({ type, hero, active, protectedSlot, onSlot }: { type: 'ban' | 'pick' | 'postban'; hero: Hero | null; active: boolean; protectedSlot?: boolean; onSlot: () => void }) {
  return <button type="button" className={`draft-slot ${type} ${active ? 'active' : ''} ${hero ? 'filled' : ''} ${protectedSlot ? 'protection' : ''}`} onClick={onSlot}>{hero ? <><HeroPortrait hero={hero} variant={type === 'ban' ? 's' : 'l'} />{protectedSlot && <span className="shield-icon" aria-label="Protected slot">🛡</span>}<b>{hero.name}</b></> : <><strong>{protectedSlot ? <span className="shield-icon" aria-label="Protected slot">🛡</span> : type === 'ban' || type === 'postban' ? '×' : '+'}</strong><small>{protectedSlot ? 'SAFE' : type === 'postban' ? 'POST-BAN' : type.toUpperCase()}</small></>}</button>
}

function HeroPortrait({ hero, variant = 's' }: { hero: Hero; variant?: 's' | 'l' }) {
  const imagePath = hero.id ? `/E7Assets-Temp-main/assets/face/${hero.id}_${variant}.png` : undefined
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = 'none'
    event.currentTarget.parentElement?.classList.add('fallback')
  }
  return <span className={`hero-portrait ${hero.tone} ${imagePath ? '' : 'fallback'}`}>{imagePath && <img src={imagePath} alt="" onError={handleImageError} />}<b>{hero.short}</b></span>
}

export default App
