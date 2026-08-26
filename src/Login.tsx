import { useState } from 'react'
import { api, type Session } from './api'

export default function Login({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [userName, setUserName] = useState('sara.programmateur')
  const [password, setPassword] = useState('ProgFaso2026!')
  const [error, setError] = useState('')

  return (
    <div className="login">
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
        <h1>Connexion web</h1>
        <p className="muted">Mêmes menus que le desktop. Ouvrez http://localhost:5173 — l’API reste en HTTPS.</p>
        <div className="field">
          <label htmlFor="user">Identifiant</label>
          <input id="user" value={userName} onChange={(e) => setUserName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pass">Mot de passe</label>
          <input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="alert">{error}</p>}
        <button className="btn" type="submit">Entrer</button>
        <p className="muted">sara.programmateur · ProgFaso2026!</p>
      </form>
    </div>
  )
}
