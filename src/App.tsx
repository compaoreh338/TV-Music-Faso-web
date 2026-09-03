import { useEffect, useState } from 'react'
import { api, getRootToken, setRootToken, setToken, type PageId, type Session } from './api'
import Login from './Login'
import DashboardPage from './DashboardPage'
import LibraryPage from './LibraryPage'
import ProgrammingPage from './ProgrammingPage'
import ExportPage from './ExportPage'
import ReportsPage from './ReportsPage'
import SecurityPage from './SecurityPage'
import ConstraintsPage from './ConstraintsPage'
import AccountPage from './AccountPage'
import UsersPage from './UsersPage'
import ConfirmDialog from './ConfirmDialog'

const TITLES: Record<PageId, string> = {
  dashboard: 'Tableau de bord',
  library: 'Médiathèque',
  hits: 'Hits',
  programming: 'Moteur de programmation',
  export: 'Export playout',
  reports: 'Historique et BBDA',
  security: 'Sécurité et audit',
  constraints: 'Contraintes techniques',
  users: 'Utilisateurs',
  account: 'Mon compte',
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('tvmusic.theme', theme)
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<PageId>('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('tvmusic.theme') === 'light' ? 'light' : 'dark')
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const goTo = (next: PageId) => {
    setError('')
    setPage(next)
    setMenuOpen(false)
  }

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    api.me()
      .then((next) => {
        setSession(next)
        setPage(next.canEditLibrary ? 'library' : 'dashboard')
      })
      .catch(() => setSession(null))
  }, [])

  if (!session) {
    return (
      <Login
        onSignedIn={(next) => {
          setToken(next.token)
          setSession(next)
          setPage(next.canEditLibrary ? 'library' : 'dashboard')
        }}
      />
    )
  }

  const items: { id: PageId; label: string; visible?: boolean }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'library', label: 'Médiathèque' },
    { id: 'hits', label: 'Hits' },
    { id: 'programming', label: 'Programmation' },
    { id: 'export', label: 'Export playout', visible: session.canExport },
    { id: 'reports', label: 'Historique BBDA' },
    { id: 'security', label: 'Sécurité / audit' },
    { id: 'constraints', label: 'Contraintes' },
    { id: 'users', label: 'Utilisateurs', visible: session.canManageUsers },
  ]

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <button
        type="button"
        className="nav-backdrop"
        aria-hidden={!menuOpen}
        tabIndex={-1}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar${menuOpen ? ' open' : ''}`} id="regie-menu">
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="flags" aria-hidden="true">
              <span className="flag" style={{ background: '#C41E3A' }} />
              <span className="flag" style={{ background: '#F0C14B' }} />
              <span className="flag" style={{ background: '#3CB371' }} />
            </div>
            <div>
              <div className="brand">TV-MUSIC FASO</div>
              <div className="muted" style={{ color: '#8e99a6', fontSize: 11 }}>Filinfo Group</div>
            </div>
          </div>
          <div className="kicker">RÉGIE</div>
        </div>

        <nav className="nav-list" aria-label="Menu régie">
          {items.filter((item) => item.visible !== false).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn${page === item.id ? ' active' : ''}`}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-account">
          <div style={{ fontWeight: 600, fontSize: 13 }}>{session.fullName} · {session.role}</div>
          <div className="muted" style={{ color: '#8e99a6', fontSize: 12, margin: '6px 0 8px' }}>
            {session.isImpersonating
              ? `Vue ${session.role} — via ${session.impersonatedBy ?? 'Direction'}`
              : session.consultationOnly ? 'Consultation seule' : 'Édition programmateur'}
          </div>
          {session.isImpersonating && (
            <button
              type="button"
              className="btn primary"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={async () => {
                const root = getRootToken()
                await api.logout().catch(() => undefined)
                if (!root) {
                  setToken(null)
                  setSession(null)
                  return
                }
                setToken(root)
                setRootToken(null)
                try {
                  const next = await api.me()
                  setSession(next)
                  setPage(next.canManageUsers ? 'users' : 'dashboard')
                } catch {
                  setToken(null)
                  setSession(null)
                }
              }}
            >
              Revenir à Direction
            </button>
          )}
          <button
            type="button"
            className={`nav-btn${page === 'account' ? ' active' : ''}`}
            onClick={() => goTo('account')}
          >
            Mon compte
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setConfirmLogout(true)}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="burger"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="regie-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="page-title">{TITLES[page]}</h1>
          <div className="top-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <div className="chip">
              <span className="dot" />
              <span className="muted">Objectif souveraineté 90 %</span>
            </div>
          </div>
        </header>
        <main className="page">
          {error && <p className="alert">{error}</p>}
          {page === 'dashboard' && <DashboardPage />}
          {page === 'library' && <LibraryPage canEdit={session.canEditLibrary} canValidate={session.canValidateClips} />}
          {page === 'hits' && <LibraryPage canEdit={session.canEditLibrary} canValidate={session.canValidateClips} hitsOnlyMode />}
          {page === 'programming' && <ProgrammingPage canEdit={session.canEditPlaylists} />}
          {page === 'export' && <ExportPage canExport={session.canExport} />}
          {page === 'reports' && <ReportsPage canExport={session.canExportBbda} />}
          {page === 'security' && <SecurityPage />}
          {page === 'constraints' && <ConstraintsPage />}
          {page === 'users' && session.canManageUsers && (
            <UsersPage
              session={session}
              onImpersonate={(next) => {
                setRootToken(session.token)
                setToken(next.token)
                setSession({ ...next, isImpersonating: true, impersonatedBy: session.fullName })
                setPage(next.canEditLibrary ? 'library' : 'dashboard')
              }}
            />
          )}
          {page === 'account' && (
            <AccountPage
              session={session}
              theme={theme}
              onTheme={setTheme}
              onSession={setSession}
            />
          )}
        </main>
      </div>
      {confirmLogout && (
        <ConfirmDialog
          kicker="CONFIRMER LA DÉCONNEXION"
          title="Se déconnecter de TV-Music Faso ?"
          message="Vous devrez saisir à nouveau vos identifiants pour revenir dans l’application."
          confirmLabel="Déconnexion"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={async () => {
            setConfirmLogout(false)
            setMenuOpen(false)
            const root = getRootToken()
            await api.logout().catch(() => undefined)
            if (root) {
              setToken(root)
              await api.logout().catch(() => undefined)
            }
            setRootToken(null)
            setToken(null)
            setSession(null)
          }}
        />
      )}
    </div>
  )
}
