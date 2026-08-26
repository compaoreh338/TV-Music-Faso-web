import { useState } from 'react'
import { api, downloadFile } from './api'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const TARGETS = [
  {
    id: 'moviejay',
    kicker: 'PLAYOUT',
    title: 'MovieJaySX',
    text: 'Fichier XML horodaté : titres, durées et chemins, prêt à l’import console.',
    actions: [{ format: 'mpl', ext: '.mpl', primary: true, label: 'Exporter MPL MovieJaySX' }],
  },
  {
    id: 'vmix',
    kicker: 'RÉGIE',
    title: 'vMix',
    text: 'XML d’entrées vidéo et CSV de régie pour le mélangeur.',
    actions: [
      { format: 'xml', ext: '.xml', primary: false, label: 'Exporter XML vMix' },
      { format: 'csv', ext: '.csv', primary: false, label: 'Exporter CSV vMix' },
    ],
  },
  {
    id: 'obs',
    kicker: 'STREAM',
    title: 'OBS',
    text: 'Playlist M3U générique pour OBS et les serveurs de diffusion.',
    actions: [{ format: 'm3u', ext: '.m3u', primary: false, label: 'Exporter M3U OBS' }],
  },
] as const

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M7 1h2v8.2l2.4-2.4 1.4 1.4L8 13 3.2 8.2l1.4-1.4L7 9.2V1zM2 13h12v2H2z" />
    </svg>
  )
}

export default function ExportPage({ canExport }: { canExport: boolean }) {
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const fileName = (ext: string) => `TVMusicFaso-${date.replaceAll('-', '')}${ext}`

  const exportFormat = async (format: string, filename: string) => {
    setError('')
    try {
      await downloadFile(api.exportUrl(format, date), filename)
      setStatus(`Export ${filename} téléchargé.`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="toolbar library">
        <div className="toolbar-filters">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="export-date">Date de grille</label>
            <input id="export-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <p className="muted">
        Les playlists partent vers l’outil de diffusion. Une coupure du serveur n’arrête pas l’antenne.
      </p>
      {!canExport && <p className="gold">L&apos;export playout est réservé au programmateur et au technicien.</p>}
      {error && <p className="alert">{error}</p>}

      <div className="export-board">
        {TARGETS.map((target) => (
          <article key={target.id} className="card export-card">
            <div>
              <div className="kicker">{target.kicker}</div>
              <h2 style={{ margin: '8px 0 0' }}>{target.title}</h2>
              <p className="muted">{target.text}</p>
            </div>
            <div className="export-card-actions">
              {target.actions.map((action) => (
                <div key={action.format} className="export-action">
                  <span className="format-chip">{action.ext}</span>
                  <button
                    type="button"
                    className={`icon-btn ${action.primary ? 'primary' : ''}`}
                    title={action.label}
                    aria-label={action.label}
                    disabled={!canExport}
                    onClick={() => exportFormat(action.format, fileName(action.ext))}
                  >
                    <DownloadIcon />
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="kicker">DERNIER EXPORT</div>
        <p className={status ? 'gold' : 'muted'} style={{ marginBottom: 0 }}>
          {status || 'Aucun fichier téléchargé pour le moment.'}
        </p>
      </article>
    </>
  )
}
