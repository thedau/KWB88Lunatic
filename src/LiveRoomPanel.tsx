import { useEffect, useRef, useState } from 'react'
import type { useLiveRoom } from './useLiveRoom'

type LiveRoom = ReturnType<typeof useLiveRoom>
const statusLabels = {
  offline: 'Draft riêng tư',
  connecting: 'Đang kết nối phòng live…',
  live: 'Đang trực tiếp',
  reconnecting: 'Mất kết nối — đang thử lại…',
  error: 'Không kết nối được phòng live',
}

export function LiveRoomPanel({ live }: { live: LiveRoom }) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)
  const linkInput = useRef<HTMLInputElement>(null)
  useEffect(() => () => window.clearTimeout(copyTimer.current), [])
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(live.link)
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2500)
    } catch {
      linkInput.current?.focus()
      linkInput.current?.select()
    }
  }
  return <section className={`live-room-panel ${live.status}`} aria-label="Live draft room">
    <div className="live-room-info">
      <div className="live-room-title"><span className="room-indicator" /><strong>{live.spectator ? 'SPECTATE' : live.room ? 'HOST' : 'LIVE DRAFT'}</strong><span role="status">{statusLabels[live.status]}</span></div>
      <p>{live.spectator ? 'Chế độ chỉ xem. Pick, ban, tên người chơi và tỉ số tự cập nhật từ chủ phòng.' : 'Một người điều khiển draft. Chia sẻ link để mọi người cùng theo dõi trực tiếp.'}</p>
      {live.room && <small>{live.viewers} người đang xem{live.spectator && live.lastUpdate ? ` · Nhận cập nhật lúc ${new Date(live.lastUpdate).toLocaleTimeString('vi-VN')}` : ''}</small>}
    </div>
    <div className="live-room-actions">
      {!live.room && <button type="button" className="live-primary" onClick={live.start}>Tạo phòng live</button>}
      {live.room && !live.spectator && <>
        <label className="spectate-link">Link spectate<input ref={linkInput} aria-label="Link spectate" value={live.link} readOnly onFocus={(event) => event.target.select()} /></label>
        <button type="button" className="live-primary" onClick={copyLink} disabled={live.status !== 'live'}>{copied ? 'Đã sao chép!' : 'Copy link spectate'}</button>
        <button type="button" onClick={live.stop}>Dừng live</button>
      </>}
      {live.room && (live.status === 'error' || live.status === 'reconnecting') && <button type="button" onClick={live.retry}>Kết nối lại</button>}
      {live.spectator && <a href={window.location.pathname}>Mở draft riêng</a>}
    </div>
    {live.room && !live.spectator && <p className="live-room-note">Giữ tab này mở khi live. Tải lại trang sẽ kết thúc phòng; hãy tạo phòng mới để tiếp tục.</p>}
    {live.spectator && live.status !== 'live' && <p className="live-room-note">{live.lastUpdate ? 'Đang hiển thị bản cập nhật cuối. ' : ''}Chờ chủ phòng online. Nếu vẫn không kết nối được, hãy xin link mới hoặc thử mạng khác.</p>}
  </section>
}

export function RoundTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  return <time className="timer" title="Thời gian từ khi bắt đầu round">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</time>
}
