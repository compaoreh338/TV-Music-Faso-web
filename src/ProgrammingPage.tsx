import { useEffect, useState } from 'react'
import { api, type Lookups, type Schedule } from './api'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ProgrammingPage({ canEdit }: { canEdit: boolean }) {
  const [date, setDate] = useState(today)
  const [thematic, setThematic] = useState(false)
  const [preset, setPreset] = useState('')
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [slot, setSlot] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.lookups().then((data) => {
      setLookups(data)
      setPreset(data.presets[0]?.name ?? '')
    }).catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    api.schedule(date)
      .then((next) => {
        setSchedule(next)
        setSlot((current) => next.playlists.find((item) => item.slot === current)?.slot ?? next.playlists[0]?.slot ?? '')
      })
      .catch((err: Error) => setError(err.message))
  }, [date])

  const playlist = schedule?.playlists.find((item) => item.slot === slot)

  return (
    <>
      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="row-check">
          <input type="checkbox" checked={thematic} onChange={(e) => setThematic(e.target.checked)} />
          Mode thématique
        </label>
        <select disabled={!thematic} value={preset} onChange={(e) => setPreset(e.target.value)}>
          {lookups?.presets.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
        </select>
        <button
          type="button"
          className="btn"
          disabled={!canEdit}
          onClick={async () => {
            setError('')
            try {
              const next = await api.generate(date, thematic, preset)
              setSchedule(next)
              setSlot(next.playlists[0]?.slot ?? '')
              setStatus(`Grille ${next.date} · souveraineté ${next.sovereignty} %`)
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        >
          Générer
        </button>
        <button
          type="button"
          className="btn"
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
          Valider la diffusion
        </button>
      </div>
      <p className="muted">Automatique = règles horaires · Thématique = spécial genre. Le cadenas survit à la génération.</p>
      {!canEdit && <p className="gold">Consultation seule : la génération est réservée aux programmateurs.</p>}
      {status && <p className="gold">{status}</p>}
      {error && <p className="alert">{error}</p>}

      <div className="split-3">
        <article className="card">
          <div className="kicker">TRANCHES HORAIRES</div>
          <p className="muted">{schedule?.playlists.reduce((sum, item) => sum + item.items.length, 0) ?? 0} clips programmés</p>
          <ul className="list">
            {schedule?.playlists.map((item) => (
              <li key={item.slot} className={item.slot === slot ? 'selected' : ''} onClick={() => setSlot(item.slot)}>
                <strong>{item.slotLabel}</strong>
                <div className="muted">{item.items.length} clips · {item.sovereignty} %</div>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <div className="kicker">PLAYLIST</div>
          {!playlist || playlist.items.length === 0 ? (
            <p className="muted">Aucune playlist pour cette date. Générez une grille.</p>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Titre</th><th>Origine</th><th></th></tr>
              </thead>
              <tbody>
                {playlist.items.map((item) => (
                  <tr key={`${playlist.slot}-${item.position}`}>
                    <td className="gold">{item.position}{item.isLocked ? ' 🔒' : ''}</td>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="muted">{item.artist}</div>
                    </td>
                    <td>{item.origin}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost"
                        disabled={!canEdit}
                        onClick={async () => {
                          const next = await api.lock(date, playlist.slot, item.position)
                          setSchedule(next)
                        }}
                      >
                        {item.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {schedule && <p className="muted">Souveraineté journée : {schedule.sovereignty} %</p>}
        </article>
      </div>
    </>
  )
}
