import { useEffect, useMemo, useState } from 'react'
import { api, type Clip, type Lookups, type Schedule, type ScheduleItem } from './api'
import ConfirmDialog from './ConfirmDialog'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptySchedule(date: string, lookups: Lookups | null): Schedule {
  return {
    date,
    sovereignty: 0,
    playlists: (lookups?.slots ?? []).map((item) => ({
      slot: item.value,
      slotLabel: item.label,
      sovereignty: 0,
      items: [],
    })),
  }
}

function withSlots(schedule: Schedule, lookups: Lookups | null): Schedule {
  if (schedule.playlists.length > 0 || !lookups) return schedule
  return emptySchedule(schedule.date, lookups)
}

export default function ProgrammingPage({ canEdit }: { canEdit: boolean }) {
  const [date, setDate] = useState(today)
  const [thematic, setThematic] = useState(false)
  const [preset, setPreset] = useState('')
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [slot, setSlot] = useState('')
  const [clips, setClips] = useState<Clip[]>([])
  const [libraryQuery, setLibraryQuery] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [baseline, setBaseline] = useState<Schedule | null>(null)
  const [pendingRemove, setPendingRemove] = useState<ScheduleItem | null>(null)

  useEffect(() => {
    api.lookups().then((data) => {
      setLookups(data)
      setPreset(data.presets[0]?.name ?? '')
    }).catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    api.clips(libraryQuery).then(setClips).catch((err: Error) => setError(err.message))
  }, [libraryQuery])

  useEffect(() => {
    api.schedule(date)
      .then((next) => {
        const ready = withSlots(next, lookups)
        setSchedule(ready)
        setBaseline(structuredClone(ready))
        setSlot((current) => ready.playlists.find((item) => item.slot === current)?.slot ?? ready.playlists[0]?.slot ?? '')
      })
      .catch((err: Error) => setError(err.message))
  }, [date, lookups])

  const playlist = schedule?.playlists.find((item) => item.slot === slot)
  const clipCount = useMemo(
    () => schedule?.playlists.reduce((sum, item) => sum + item.items.length, 0) ?? 0,
    [schedule],
  )

  const canRevert = Boolean(
    canEdit && baseline && schedule && JSON.stringify(baseline.playlists) !== JSON.stringify(schedule.playlists),
  )

  const persist = async (next: Schedule, message: string) => {
    setError('')
    const saved = withSlots(await api.saveSchedule(next), lookups)
    setSchedule(saved)
    setStatus(message)
  }

  const updatePlaylist = async (items: ScheduleItem[], message: string) => {
    if (!schedule || !playlist) return
    const next: Schedule = {
      ...schedule,
      playlists: schedule.playlists.map((row) => row.slot === playlist.slot
        ? { ...row, items: items.map((item, index) => ({ ...item, position: index + 1 })) }
        : row),
    }
    await persist(next, message)
  }

  return (
    <>
      <div className="toolbar library">
        <div className="toolbar-filters">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <label className="row-check">
            <input type="checkbox" checked={thematic} onChange={(e) => setThematic(e.target.checked)} />
            Mode thématique
          </label>
          <select disabled={!thematic} value={preset} onChange={(e) => setPreset(e.target.value)}>
            {lookups?.presets.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="icon-btn primary"
            title="Générer automatiquement"
            aria-label="Générer automatiquement"
            disabled={!canEdit}
            onClick={async () => {
              setError('')
              try {
                const next = withSlots(await api.generate(date, thematic, preset), lookups)
                setSchedule(next)
                setBaseline(structuredClone(next))
                setSlot(next.playlists[0]?.slot ?? '')
                setStatus(`Grille ${next.date} · souveraineté ${next.sovereignty} %`)
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l2 5h5l-4 3.2L12.8 15 8 12l-4.8 3L5 9.2 1 6h5z" /></svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Valider la diffusion"
            aria-label="Valider la diffusion"
            disabled={!canEdit || !schedule}
            onClick={async () => {
              setError('')
              try {
                const result = await api.validateBroadcast(date)
                setStatus(`${result.recorded} passage(s) enregistrés pour le BBDA.`)
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8.2 5.6 13 15 2.4 13.5 1 5.6 10 2.4 6.7z" /></svg>
          </button>
          <button
            type="button"
            className="icon-btn ghost"
            title="Revenir à la grille précédente"
            aria-label="Annuler les modifications"
            disabled={!canRevert}
            onClick={async () => {
              if (!baseline) return
              await persist(structuredClone(baseline), 'Modifications annulées. La grille précédente a été rétablie.')
              setBaseline(structuredClone(baseline))
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 1 1-4.6 2.2L2 2.6V8h4.5L4.8 6.2A4.4 4.4 0 1 0 8 3.6z" /></svg>
          </button>
        </div>
      </div>

      <p className="muted">Retirer enlève le clip de la tranche seulement, pas de la médiathèque. Annuler rétablit la dernière grille chargée ou générée.</p>
      {!canEdit && <p className="gold">Consultation seule : la programmation est réservée aux programmateurs.</p>}
      {status && <p className="gold">{status}</p>}
      {error && <p className="alert">{error}</p>}

      <div className="prog-board">
        <article className="card">
          <div className="kicker">TRANCHES</div>
          <p className="muted">{clipCount} clips programmés</p>
          <ul className="list">
            {(schedule?.playlists ?? []).map((item) => (
              <li key={item.slot} className={item.slot === slot ? 'selected' : ''} onClick={() => setSlot(item.slot)}>
                <strong>{item.slotLabel}</strong>
                <div className="muted">{item.items.length} clips · {item.sovereignty} %</div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <div className="fiche-head">
            <div>
              <div className="kicker">PLAYLIST</div>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                {playlist ? `${playlist.items.length} clip(s) · ${playlist.sovereignty} % burkinabè` : 'Choisissez une tranche'}
              </p>
            </div>
            {schedule && <strong className={schedule.sovereignty >= 90 ? 'ok' : 'gold'}>{schedule.sovereignty} %</strong>}
          </div>

          {!playlist || playlist.items.length === 0 ? (
            <p className="muted">Tranche vide. Ajoutez un clip depuis la médiathèque, ou générez la journée.</p>
          ) : (
            <ul className="list playlist-list">
              {playlist.items.map((item) => (
                <li key={`${playlist.slot}-${item.position}-${item.clipId}`}>
                  <div className="playlist-row">
                    <span className="gold">{item.position}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <div className="muted">{item.artist} · {item.origin}</div>
                    </div>
                    <div className="list-actions">
                      <button
                        type="button"
                        className={`icon-btn compact ${item.isLocked ? 'primary' : 'ghost'}`}
                        title={item.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                        aria-label={item.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                        disabled={!canEdit}
                        onClick={async () => {
                          const next = await api.lock(date, playlist.slot, item.position)
                          setSchedule(withSlots(next, lookups))
                          setStatus(item.isLocked ? 'Clip déverrouillé.' : 'Clip verrouillé.')
                        }}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          {item.isLocked
                            ? <path d="M5 8V6a3 3 0 0 1 6 0v2h2v7H3V8h2zm1.6 0h2.8V6.2a1.4 1.4 0 0 0-2.8 0V8z" />
                            : <path d="M5 8V6a3 3 0 0 1 6 0v1.2h-1.6V6.2a1.4 1.4 0 0 0-2.8 0V8H13v7H3V8h2z" />}
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger compact"
                        title="Retirer de la playlist"
                        aria-label="Retirer de la playlist"
                        disabled={!canEdit || item.isLocked}
                        onClick={() => setPendingRemove(item)}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l1 2h4v2H1V3h5l1-2zM3.5 6h9l-.6 9h-7.8L3.5 6z" /></svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <div className="kicker">MÉDIATHÈQUE</div>
          <input
            placeholder="Rechercher un clip…"
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            style={{ width: '100%', margin: '8px 0 10px' }}
          />
          <p className="muted">« + » ajoute le clip à la tranche sélectionnée.</p>
          <ul className="list">
            {clips.map((clip) => (
              <li key={clip.id}>
                <div className="playlist-row">
                  <div>
                    <strong>{clip.title}</strong>
                    <div className="muted">{clip.artist} · {clip.languageLabel}</div>
                    <div className="gold">{clip.originLabel}</div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn primary compact"
                    title="Ajouter à la playlist"
                    aria-label="Ajouter à la playlist"
                    disabled={!canEdit || !playlist}
                    onClick={() => {
                      if (!playlist) return
                      const added: ScheduleItem = {
                        clipId: clip.id,
                        position: playlist.items.length + 1,
                        isLocked: false,
                        title: clip.title,
                        artist: clip.artist,
                        origin: clip.originLabel,
                      }
                      return updatePlaylist([...playlist.items, added], `« ${clip.title} » ajouté à la tranche.`)
                    }}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1h2v6h6v2H9v6H7V9H1V7h6z" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {pendingRemove && playlist && (
        <ConfirmDialog
          kicker="CONFIRMER LE RETRAIT"
          title="Retirer ce clip de la playlist ?"
          message={`« ${pendingRemove.title} » de ${pendingRemove.artist} sera enlevé de cette tranche uniquement, pas de la médiathèque.`}
          confirmLabel="Retirer"
          onCancel={() => setPendingRemove(null)}
          onConfirm={async () => {
            const item = pendingRemove
            setPendingRemove(null)
            await updatePlaylist(
              playlist.items.filter((row) => row.position !== item.position),
              'Clip retiré de la tranche.',
            )
          }}
        />
      )}
    </>
  )
}
