import { useEffect, useState } from 'react'
import { api, downloadFile, type BbdaQuery, type BbdaReport } from './api'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M7 1h2v8.2l2.4-2.4 1.4 1.4L8 13 3.2 8.2l1.4-1.4L7 9.2V1zM2 13h12v2H2z" />
    </svg>
  )
}

export default function ReportsPage({ canExport }: { canExport: boolean }) {
  const now = new Date()
  const [useMonth, setUseMonth] = useState(true)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [report, setReport] = useState<BbdaReport | null>(null)
  const [error, setError] = useState('')

  const query: BbdaQuery = useMonth ? { year, month } : { from, to }
  const fileStamp = useMonth
    ? `${year}-${pad(month)}`
    : from === to
      ? from
      : `${from}_${to}`

  useEffect(() => {
    api.bbda(query).then(setReport).catch((err: Error) => setError(err.message))
  }, [useMonth, year, month, from, to])

  return (
    <>
      <div className="toolbar library">
        <div className="toolbar-filters">
          <label className="row-check" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={useMonth}
              onChange={(e) => setUseMonth(e.target.checked)}
            />
            Mois
          </label>
          {useMonth ? (
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="bbda-month">Mois</label>
              <input
                id="bbda-month"
                type="month"
                value={`${year}-${pad(month)}`}
                onChange={(e) => {
                  const [nextYear, nextMonth] = e.target.value.split('-').map(Number)
                  setYear(nextYear)
                  setMonth(nextMonth)
                }}
              />
            </div>
          ) : (
            <>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="bbda-from">Du</label>
                <input id="bbda-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="bbda-to">Au</label>
                <input id="bbda-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
        </div>
        {canExport && (
          <div className="toolbar-actions">
            <button
              className="icon-btn primary"
              type="button"
              title="Exporter le rapport BBDA"
              aria-label="Exporter le rapport BBDA"
              onClick={() =>
                downloadFile(api.bbdaCsvUrl(query), `BBDA-${fileStamp}.csv`).catch((err: Error) =>
                  setError(err.message),
                )
              }
            >
              <DownloadIcon />
            </button>
          </div>
        )}
      </div>

      <article className="card">
        <div className="kicker">HISTORIQUE BBDA</div>
        {report && (
          <p className="muted">
            {report.period ? `${report.period} · ` : ''}
            {report.count} passage(s) · {report.sovereignty} % burkinabè
          </p>
        )}
      </article>
      {error && <p className="alert">{error}</p>}
      {report && report.entries.length > 0 && (
        <article className="card" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Heure</th><th>Tranche</th><th>Titre</th><th>Interprète</th><th>Origine</th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((entry, index) => (
                <tr key={`${entry.date}-${entry.start}-${index}`}>
                  <td>{entry.date}</td>
                  <td className="gold">{entry.start}</td>
                  <td>{entry.slot}</td>
                  <td>{entry.title}</td>
                  <td className="muted">{entry.artist}</td>
                  <td>{entry.origin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </>
  )
}
