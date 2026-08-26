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
            <button type="button" className="btn" onClick={() => setEditing(true)}>Éditer</button>
          ) : (
            <div className="toolbar">
              <button
                type="button"
                className="btn"
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
                Enregistrer
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setFullName(session.fullName)
                  setUserName(session.userName)
                  setEditing(false)
                }}
              >
                Annuler
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
