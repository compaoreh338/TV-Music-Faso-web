import { useEffect, useState } from 'react'
import { api, type Session } from './api'
import ConfirmDialog from './ConfirmDialog'

type DirectoryUser = {
  id: string
  fullName: string
  userName: string
  role: string
  isActive: boolean
}

export default function UsersPage({
  session,
  onImpersonate,
}: {
  session: Session
  onImpersonate: (next: Session) => void
}) {
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState<DirectoryUser | null>(null)

  useEffect(() => {
    api.users()
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <>
      <article className="card">
        <div className="kicker">ANNUAIRE</div>
        <h2 style={{ margin: '6px 0 8px' }}>Comptes</h2>
        <p className="muted">
          Un bouton œil permet à la Direction d’utiliser l’application avec les droits d’un autre compte.
        </p>
        {error && <p className="alert">{error}</p>}
        <ul className="list">
          {users.map((user) => (
            <li key={user.id}>
              <div className="playlist-row">
                <div>
                  <strong>{user.fullName}</strong>
                  <div className="muted">{user.userName}</div>
                  <div className="gold">{user.role} · {user.isActive ? 'Actif' : 'Inactif'}</div>
                </div>
                <button
                  type="button"
                  className="icon-btn ghost compact"
                  title="Voir comme cet utilisateur"
                  aria-label="Voir comme cet utilisateur"
                  disabled={!user.isActive || user.userName === session.userName}
                  onClick={() => setPending(user)}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3C3.5 3 1 8 1 8s2.5 5 7 5 7-5 7-5-2.5-5-7-5zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" /></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </article>

      {pending && (
        <ConfirmDialog
          kicker="EMPRUNT D’IDENTITÉ"
          title="Voir l’application comme cet utilisateur ?"
          message={`Vous allez utiliser TV-Music Faso avec les droits de ${pending.fullName} (${pending.role}). Un bouton « Revenir à Direction » permet d’arrêter à tout moment.`}
          confirmLabel="Voir comme"
          tone="primary"
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const target = pending
            setPending(null)
            setError('')
            try {
              onImpersonate(await api.impersonate(target.id))
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        />
      )}
    </>
  )
}
