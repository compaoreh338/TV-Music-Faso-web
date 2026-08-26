import { useState } from 'react'
import { api, downloadFile } from './api'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ExportPage({ canExport }: { canExport: boolean }) {
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

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
    <div style={{ maxWidth: 760 }}>
      <p className="muted">
        Les playlists sont générées à l&apos;avance puis envoyées au logiciel de playout.
        Une coupure du serveur de programmation n&apos;arrête pas la diffusion à l&apos;antenne.
      </p>
      <div className="field">
        <label htmlFor="export-date">Date de grille</label>
        <input id="export-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {!canExport && <p className="gold">L&apos;export playout est réservé au programmateur et au technicien.</p>}
      {error && <p className="alert">{error}</p>}
      {status && <p className="gold">{status}</p>}

      <article className="card">
        <div className="kicker">PLAYOUT</div>
        <h2>MovieJaySX</h2>
        <p className="muted">Fichier .mpl XML avec horaires, titres et chemins de fichiers.</p>
        <button type="button" className="btn" disabled={!canExport} onClick={() => exportFormat('mpl', `TVMusicFaso-${date.replaceAll('-', '')}.mpl`)}>
          Exporter MPL MovieJaySX
        </button>
      </article>
      <article className="card" style={{ marginTop: 16 }}>
        <div className="kicker">RÉGIE</div>
        <h2>vMix</h2>
        <p className="muted">XML d&apos;entrées vidéo et CSV de régie.</p>
        <div className="toolbar">
          <button type="button" className="btn ghost" disabled={!canExport} onClick={() => exportFormat('xml', `TVMusicFaso-${date.replaceAll('-', '')}.xml`)}>
            Exporter XML vMix
          </button>
          <button type="button" className="btn ghost" disabled={!canExport} onClick={() => exportFormat('csv', `TVMusicFaso-${date.replaceAll('-', '')}.csv`)}>
            Exporter CSV
          </button>
        </div>
      </article>
      <article className="card" style={{ marginTop: 16 }}>
        <div className="kicker">STREAM</div>
        <h2>OBS / serveurs de diffusion</h2>
        <p className="muted">Playlist M3U générique.</p>
        <button type="button" className="btn ghost" disabled={!canExport} onClick={() => exportFormat('m3u', `TVMusicFaso-${date.replaceAll('-', '')}.m3u`)}>
          Exporter M3U
        </button>
      </article>
    </div>
  )
}
