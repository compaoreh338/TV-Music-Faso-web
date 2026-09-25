import { useEffect, useState } from 'react'
import { api, type Dashboard } from './api'

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard().then(setData).catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <p className="alert">{error}</p>
  if (!data) return <p className="muted">Chargement…</p>

  return (
    <>
      {data.library.alert && (
        <p className="alert">Alerte souveraineté : le stock est sous {data.target} % de musique burkinabè.</p>
      )}
      {data.today.alert && (
        <p className="alert">Alerte grille du jour : {data.today.sovereignty} % — sous l&apos;objectif de {data.target} %.</p>
      )}

      <div className="grid grid-kpis">
        <article className="card">
          <div className="kicker">CLIPS</div>
          <div className="metric">{data.library.total}</div>
          <div className="muted">Stock médiathèque</div>
        </article>
        <article className="card">
          <div className="kicker">BURKINABÈ</div>
          <div className="metric ok">{data.library.burkinabe}</div>
          <div className="muted">Origine nationale</div>
        </article>
        <article className="card">
          <div className="kicker">ÉTRANGERS</div>
          <div className="metric">{data.library.foreign}</div>
          <div className="muted">Hors quota prioritaire</div>
        </article>
        <article className="card">
          <div className="kicker">PREMIUM</div>
          <div className="metric gold">{data.library.premium}</div>
          <div className="muted">Hits à fort impact</div>
        </article>
      </div>

      <div className="grid grid-pair" style={{ marginTop: 16 }}>
        <article className="card">
          <div className="kicker">STOCK MÉDIATHÈQUE</div>
          <div className={`metric ${data.library.alert ? 'danger' : 'ok'}`}>{data.library.sovereignty} %</div>
          <div className="muted">Objectif {data.target} %</div>
        </article>
        <article className="card">
          <div className="kicker">GRILLE DU JOUR</div>
          <div className={`metric ${data.today.alert ? 'danger' : 'gold'}`}>
            {data.today.hasSchedule ? `${data.today.sovereignty} %` : '—'}
          </div>
          <div className="muted">
            {data.today.hasSchedule
              ? `${data.today.slots.length} tranche(s) générées`
              : 'Générez une grille depuis Programmation.'}
          </div>
        </article>
      </div>

      {data.today.slots.length > 0 && (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="kicker">TRANCHES</div>
          <table>
            <thead>
              <tr><th>Tranche</th><th>Clips</th><th>Souveraineté</th></tr>
            </thead>
            <tbody>
              {data.today.slots.map((slot) => (
                <tr key={slot.slot}>
                  <td>{slot.slot}</td>
                  <td>{slot.count}</td>
                  <td className={slot.sovereignty < data.target ? 'danger' : 'ok'}>{slot.sovereignty} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      <div className="grid grid-pair" style={{ marginTop: 16 }}>
        <article className="card">
          <div className="kicker">LANGUES</div>
          {data.languages.map((row) => (
            <p key={row.label}>{row.label} <strong className="gold">{row.count}</strong></p>
          ))}
        </article>
        <article className="card">
          <div className="kicker">GENRES</div>
          {data.genres.map((row) => (
            <p key={row.label}>{row.label} <strong className="gold">{row.count}</strong></p>
          ))}
        </article>
      </div>
    </>
  )
}
