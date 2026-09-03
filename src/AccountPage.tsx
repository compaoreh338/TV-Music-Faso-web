import { useState } from 'react'
import { api, type Session } from './api'

export default function AccountPage({
  session,
  theme,
  onTheme,
  onSession,
}: {
  session: Session
  theme: 'dark' | 'light'
  onTheme: (theme: 'dark' | 'light') => void
  onSession: (session: Session) => void
}) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(session.fullName)
  const [userName, setUserName] = useState(session.userName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  return (
    <div style={{ maxWidth: 880 }}>
      <article className="card">
        <div className="kicker">COMPTE CONNECTÉ</div>
        <h2>{session.fullName} · {session.role}</h2>
        <p className="muted">Rôle : {session.role} — ce rôle ne peut pas être modifié ici.</p>
      </article>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card">
          <div className="kicker">PROFIL</div>
          <h2>Informations personnelles</h2>
          <fieldset disabled={!editing} style={{ border: 0, padding: 0 }}>
            <div className="field">
              <label>Nom affiché</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label>Identifiant de connexion</label>
              <input value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
          </fieldset>
          {!editing ? (
            <button type="button" className="icon-btn primary" title="Éditer" aria-label="Éditer" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5V14h2.5L12.2 6.3 9.7 3.8 2 11.5zm11.1-6.1 1.5-1.5c.4-.4.4-1.1 0-1.5L13.6 1.4c-.4-.4-1.1-.4-1.5 0L10.6 2.9l2.5 2.5z" /></svg>
            </button>
          ) : (
            <div className="toolbar">
              <button
                type="button"
                className="icon-btn primary"
                title="Enregistrer"
                aria-label="Enregistrer"
                onClick={async () => {
                  setError('')
                  try {
                    const result = await api.updateProfile(fullName, userName)
                    onSession({ ...result.session, token: session.token })
                    setMessage(result.message)
                    setEditing(false)
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
                title="Annuler"
                aria-label="Annuler"
                onClick={() => {
                  setFullName(session.fullName)
                  setUserName(session.userName)
                  setEditing(false)
                }}
              >
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
              </button>
            </div>
          )}
        </article>

        <article className="card">
          <div className="kicker">MOT DE PASSE</div>
          <h2>Changer le secret</h2>
          <div className="field">
            <label>Mot de passe actuel</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Confirmation</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={async () => {
              setError('')
              if (newPassword !== confirmPassword) {
                setError('La confirmation ne correspond pas.')
                return
              }
              try {
                const result = await api.changePassword(currentPassword, newPassword)
                setMessage(result.message)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            Mettre à jour le mot de passe
          </button>
        </article>
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="kicker">APPARENCE</div>
        <h2>Thème de l&apos;interface</h2>
        <p className="muted">Le choix est enregistré dans ce navigateur.</p>
        <div className="toolbar">
          <button type="button" className={theme === 'dark' ? 'btn' : 'btn ghost'} onClick={() => onTheme('dark')}>
            Mode sombre
          </button>
          <button type="button" className={theme === 'light' ? 'btn' : 'btn ghost'} onClick={() => onTheme('light')}>
            Mode clair
          </button>
        </div>
      </article>
      {message && <p className="gold">{message}</p>}
      {error && <p className="alert">{error}</p>}
    </div>
  )
}
