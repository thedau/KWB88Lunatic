import { useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import { isDraftSnapshot } from './draft'
import type { DraftSnapshot } from './draft'

type Status = 'offline' | 'connecting' | 'live' | 'reconnecting' | 'error'
type Room = { id: string; spectator: boolean }
const roomPattern = /^kwb-[a-f0-9-]{36}$/

export function useLiveRoom(snapshot: DraftSnapshot, onSnapshot: (snapshot: DraftSnapshot) => void) {
  const [room, setRoom] = useState<Room | null>(() => {
    const id = new URLSearchParams(window.location.search).get('spectate')
    return id ? { id, spectator: true } : null
  })
  const [status, setStatus] = useState<Status>('offline')
  const [viewers, setViewers] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(snapshot)
  const receive = useRef(onSnapshot)
  const connections = useRef(new Set<DataConnection>())

  useEffect(() => { receive.current = onSnapshot }, [onSnapshot])
  useEffect(() => {
    latest.current = snapshot
    for (const connection of connections.current) {
      if (connection.open) connection.send({ type: 'draft', version: 1, snapshot, viewers: connections.current.size, sentAt: Date.now() })
    }
  }, [snapshot])

  useEffect(() => {
    if (!room || !roomPattern.test(room.id)) return
    let disposed = false
    let outgoing: DataConnection | undefined
    let lastReceived = Date.now()
    let retryAt = 0
    const peer = new Peer(room.spectator ? `viewer-${crypto.randomUUID()}` : room.id, { debug: 0 })
    const peers = connections.current
    const sendSnapshot = () => {
      for (const connection of peers) {
        if (connection.open) connection.send({ type: 'draft', version: 1, snapshot: latest.current, viewers: peers.size, sentAt: Date.now() })
      }
    }
    const connect = () => {
      if (disposed || !room.spectator || outgoing || peer.disconnected || peer.destroyed) return
      lastReceived = Date.now()
      // BinaryPack splits large tournament histories into safe WebRTC chunks.
      const connection = peer.connect(room.id, { reliable: true, serialization: 'binary' })
      outgoing = connection
      const lost = () => {
        if (disposed || outgoing !== connection) return
        outgoing = undefined
        retryAt = Date.now() + 3000
        setStatus('reconnecting')
        connection.close()
      }
      connection.on('data', (message: unknown) => {
        if (disposed || outgoing !== connection || typeof message !== 'object' || message === null) return
        const data = message as Record<string, unknown>
        if (data.type !== 'draft' || data.version !== 1 || !isDraftSnapshot(data.snapshot)) return
        lastReceived = Date.now()
        receive.current(data.snapshot)
        setLastUpdate(lastReceived)
        setViewers(Number.isInteger(data.viewers) && Number(data.viewers) >= 0 ? Number(data.viewers) : 0)
        setStatus('live')
      })
      connection.on('close', lost)
      connection.on('error', lost)
    }
    peer.on('open', () => {
      if (disposed) return
      if (room.spectator) connect()
      else setStatus('live')
    })
    peer.on('connection', (connection) => {
      // Spectators never accept inbound connections; hosts never apply inbound data.
      if (room.spectator) { connection.close(); return }
      connection.on('open', () => {
        if (disposed) return
        peers.add(connection)
        setViewers(peers.size)
        sendSnapshot()
      })
      const remove = () => {
        if (disposed || !peers.delete(connection)) return
        setViewers(peers.size)
        sendSnapshot()
      }
      connection.on('close', remove)
      connection.on('error', () => { remove(); connection.close() })
    })
    peer.on('disconnected', () => { if (!disposed) setStatus('reconnecting') })
    peer.on('error', (error) => {
      if (disposed) return
      if (room.spectator && error.type === 'peer-unavailable') {
        const connection = outgoing
        outgoing = undefined
        connection?.close()
        retryAt = Date.now() + 3000
        setStatus('reconnecting')
      } else setStatus('error')
    })
    const connectionTimeout = window.setTimeout(() => {
      if (!disposed && !peer.open) setStatus('error')
    }, 15000)
    const heartbeat = window.setInterval(() => {
      if (peer.destroyed) return
      if (peer.disconnected) peer.reconnect()
      if (!room.spectator) { sendSnapshot(); return }
      if (outgoing && Date.now() - lastReceived > 12000) {
        const connection = outgoing
        outgoing = undefined
        connection.close()
        setStatus('reconnecting')
      }
      if (!outgoing && Date.now() >= retryAt) connect()
    }, 2000)
    return () => {
      disposed = true
      window.clearTimeout(connectionTimeout)
      window.clearInterval(heartbeat)
      peer.destroy()
      peers.clear()
    }
  }, [room, attempt])

  const start = () => {
    setStatus('connecting')
    setViewers(0)
    setRoom({ id: `kwb-${crypto.randomUUID()}`, spectator: false })
  }
  const stop = () => { setRoom(null); setViewers(0); setStatus('offline') }
  const retry = () => { setStatus('connecting'); setAttempt((value) => value + 1) }
  const link = new URL(window.location.href)
  link.search = ''
  link.hash = ''
  if (room) link.searchParams.set('spectate', room.id)
  const validRoom = !room || roomPattern.test(room.id)

  return { room, status: !validRoom ? 'error' as const : room && status === 'offline' ? 'connecting' as const : status, viewers, lastUpdate, spectator: Boolean(room?.spectator), link: room ? link.href : '', start, stop, retry }
}
