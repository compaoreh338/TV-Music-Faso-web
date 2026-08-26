import { useEffect, useState } from 'react'
import { api, downloadFile, type BbdaReport } from './api'

export default function ReportsPage({ canExport }: { canExport: boolean }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<BbdaReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.bbda(year, month).then(setReport).catch((err: Error) => setError(err.message))
  }, [year, month])

  return (
    <>
      <article className="card">
        <div className="kicker">HISTORIQUE BBDA</div>
        <div className="field">
          <label htmlFor="month">Mois</label>
          <input
            id="month"
            type="month"
            value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setYear(y)
              setMonth(m)
            }}
          />
        </div>
        {report && (
          <p className="muted">{report.count} passage(s) · {report.sovereignty} % burkinabè</p>
        )}
        {canExport && (
          <button
            className="btn"
            type="button"
            onClick={() =>
              downloadFile(
                api.bbdaCsvUrl(year, month),
                `BBDA-${year}-${String(month).padStart(2, '0')}.csv`,
              ).catch((err: Error) => setError(err.message))
            }
          >
            Exporter CSV
          </button>
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
