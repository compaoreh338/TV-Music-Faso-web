import { useEffect, useState } from 'react'
import { api, type Constraints } from './api'

export default function ConstraintsPage() {
  const [data, setData] = useState<Constraints | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.constraints().then(setData).catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <p className="alert">{error}</p>
  if (!data) return <p className="muted">Chargement…</p>

  return (
    <div className="constraints-board">
      <article className="card">
        <div className="kicker">COUCHE DONNÉES</div>
        <h2 style={{ margin: '8px 0 0' }}>Stockage actif</h2>
        <p className="gold" style={{ fontSize: 20 }}>{data.platform}</p>
        <p>{data.details}</p>
        <p className="muted">Stock actuel : {data.clipCount} clips</p>
        <p className="muted">SQLite n&apos;est plus utilisé. La base unique est PostgreSQL (Docker : tvmusicfaso).</p>
      </article>
      {data.rows.map((row) => (
        <article className="card" key={row.title}>
          <strong>{row.title}</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{row.guarantee}</p>
        </article>
      ))}
      <article className="card">
        <div className="kicker">RÈGLES PAR TRANCHE</div>
        {data.slots.map((slot) => <p key={slot} style={{ margin: '8px 0' }}>{slot}</p>)}
      </article>
    </div>
  )
}
