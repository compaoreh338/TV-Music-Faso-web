import { useEffect, useState } from 'react'
import { api, type SecurityInfo } from './api'

export default function SecurityPage() {
  const [data, setData] = useState<SecurityInfo | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const load = () => api.security().then(setData).catch((err: Error) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  if (!data && !error) return <p className="muted">Chargement…</p>

  return (
    <>
      <div className="grid">
        <article className="card">
          <div className="kicker">SESSION</div>
          <h2>Compte actif</h2>
          <p>{data?.fullName}</p>
          <p className="muted">Rôle : {data?.role}</p>
          <p className="muted">Jeton : {data?.tokenPreview}</p>
          <p className="muted">Expire : {data?.expiresAt}</p>
        </article>
        <article className="card">
          <div className="kicker">SAUVEGARDE</div>
          <h2>Copie automatique</h2>
          <p className="muted">{data?.lastBackup ?? 'Aucune sauvegarde encore.'}</p>
          {data?.canManageBackup && (
            <button
              type="button"
              className="btn"
              onClick={async () => {
                setError('')
                try {
                  const result = await api.backup()
                  setStatus(result.path)
                  await load()
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              Sauvegarder maintenant
            </button>
          )}
          {status && <p className="gold">{status}</p>}
        </article>
      </div>
      <article className="card" style={{ marginTop: 16 }}>
        <p className="muted">{data?.transport}</p>
      </article>
      {error && <p className="alert">{error}</p>}
      <article className="card" style={{ marginTop: 16 }}>
        <div className="kicker">JOURNAL D&apos;AUDIT</div>
        <h2>Actions nominatives</h2>
        <table>
          <thead>
            <tr><th>Quand</th><th>Acteur</th><th>Action</th><th>Détail</th></tr>
          </thead>
          <tbody>
            {data?.entries.map((entry, index) => (
              <tr key={`${entry.at}-${index}`}>
                <td className="gold">{entry.at}</td>
                <td>{entry.actor}</td>
                <td>{entry.action}</td>
                <td className="muted">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  )
}
