import { useState } from 'react'
import { api, type Session } from './api'

export default function Login({
  onSignedIn,
  theme,
  onTheme,
}: {
  onSignedIn: (session: Session) => void
  theme: 'dark' | 'light'
  onTheme: (theme: 'dark' | 'light') => void
}) {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="login">
      <button
        type="button"
        className="btn ghost login-theme"
        onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      </button>
      <form
        className="card login-card"
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          try {
            onSignedIn(await api.login(userName, password))
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Identifiants incorrects ou API injoignable (HTTPS).')
          }
        }}
      >
        <div className="kicker">FILINFO GROUP · RÉGIE</div>
        <h1>Connexion</h1>
        <p className="muted">Saisissez votre identifiant nominatif pour accéder à la régie.</p>
        <div className="field">
          <label htmlFor="user">Identifiant</label>
          <input id="user" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="pass">Mot de passe</label>
          <input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p className="alert">{error}</p>}
        <button className="btn" type="submit">Se connecter</button>
      </form>
    </div>
  )
}
