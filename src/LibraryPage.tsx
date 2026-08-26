import { useEffect, useRef, useState } from 'react'
import { api, downloadFile, emptyClip, type Clip, type Lookups } from './api'

const FORMATS = ['MP4', 'MOV', 'MKV', 'AVI']

export default function LibraryPage({ canEdit }: { canEdit: boolean }) {
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [selected, setSelected] = useState<Clip | null>(null)
  const [draft, setDraft] = useState<Clip | null>(null)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState('')
  const [burkinabeOnly, setBurkinabeOnly] = useState(false)
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Clip | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const load = () =>
    api.clips(query, genre, language, burkinabeOnly)
      .then((rows) => {
        setClips(rows)
        setSelected((current) => rows.find((row) => row.id === current?.id) ?? null)
      })
      .catch((err: Error) => setError(err.message))

  useEffect(() => {
    api.lookups().then(setLookups).catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [query, genre, language, burkinabeOnly])

  useEffect(() => {
    if (!editing) setDraft(selected)
  }, [selected, editing])

  const form = editing ? draft : selected

  const patch = (partial: Partial<Clip>) => {
    if (!draft) return
    setDraft({ ...draft, ...partial })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setError('')
    try {
      await api.deleteClip(pendingDelete.id)
      setPendingDelete(null)
      setEditing(false)
      setPanelOpen(false)
      setSelected(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="toolbar library">
        <div className="toolbar-filters">
          <input placeholder="Rechercher titre ou artiste…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Genre</option>
            {lookups?.genres.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Langue</option>
            {lookups?.languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <label className="row-check">
            <input type="checkbox" checked={burkinabeOnly} onChange={(e) => setBurkinabeOnly(e.target.checked)} />
            Burkinabè
          </label>
          <button type="button" className="btn ghost" onClick={() => { setQuery(''); setGenre(''); setLanguage(''); setBurkinabeOnly(false) }}>
            Réinitialiser
          </button>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="icon-btn primary"
            title="Nouveau clip"
            aria-label="Nouveau clip"
            disabled={!canEdit}
            onClick={() => {
              const created = emptyClip()
              setSelected(created)
              setDraft(created)
              setEditing(true)
              setPanelOpen(true)
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1h2v6h6v2H9v6H7V9H1V7h6z" /></svg>
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              setError('')
              try {
                const imported = await api.importClipsCsv(await file.text())
                await load()
                setError('')
                if (imported.imported === 0) {
                  setError('Aucun clip importé. Vérifiez le format CSV.')
                }
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          />
          <button
            type="button"
            className="icon-btn"
            title="Importer CSV"
            aria-label="Importer CSV"
            disabled={!canEdit}
            onClick={() => importRef.current?.click()}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v9M5 7l3 4 3-4M2 13h12v2H2z" /></svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Exporter CSV"
            aria-label="Exporter CSV"
            onClick={() =>
              downloadFile(api.clipsCsvUrl(), 'mediatheque-tv-music-faso.csv').catch((err: Error) =>
                setError(err.message),
              )
            }
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11V2M5 5l3-4 3 4M2 13h12v2H2z" /></svg>
          </button>
        </div>
      </div>

      {!canEdit && (
        <p className="gold">Consultation seule : l&apos;édition de la médiathèque est réservée aux programmateurs.</p>
      )}
      {error && <p className="alert">{error}</p>}

      <div className={panelOpen ? 'split' : 'split catalog-only'}>
        <article className="card">
          <div className="kicker">CATALOGUE</div>
          <p className="muted">{clips.length} clip(s)</p>
          <ul className="list">
            {clips.map((clip) => (
              <li key={clip.id} className={selected?.id === clip.id && panelOpen ? 'selected' : ''}>
                <strong>{clip.title}</strong>
                <div className="muted">{clip.artist} · {clip.languageLabel} · {clip.genreLabel}</div>
                <div className="gold">{clip.originLabel}</div>
                <div className="list-actions">
                  <button
                    type="button"
                    className="icon-btn ghost compact"
                    title="Voir"
                    aria-label="Voir"
                    onClick={() => { setSelected(clip); setDraft(clip); setEditing(false); setPanelOpen(true) }}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3C3.5 3 1 8 1 8s2.5 5 7 5 7-5 7-5-2.5-5-7-5zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" /></svg>
                  </button>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        className="icon-btn ghost compact"
                        title="Éditer"
                        aria-label="Éditer"
                        onClick={() => { setSelected(clip); setDraft(clip); setEditing(true); setPanelOpen(true) }}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5V14h2.5L12.2 6.3 9.7 3.8 2 11.5zm11.1-6.1 1.5-1.5c.4-.4.4-1.1 0-1.5L13.6 1.4c-.4-.4-1.1-.4-1.5 0L10.6 2.9l2.5 2.5z" /></svg>
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger compact"
                        title="Supprimer"
                        aria-label="Supprimer"
                        onClick={() => setPendingDelete(clip)}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l1 2h4v2H1V3h5l1-2zM3.5 6h9l-.6 9h-7.8L3.5 6z" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>

        {panelOpen && (
        <article className="card">
          {!form ? (
            <p className="muted">Sélectionnez un clip du catalogue, ou créez-en un.</p>
          ) : (
            <>
              <div className="fiche-head">
                <div>
                  <div className="kicker">FICHE CLIP</div>
                  <h2 style={{ margin: '6px 0 0' }}>Métadonnées de diffusion</h2>
                </div>
                <div className="fiche-actions">
                  {canEdit && !editing && (
                    <button type="button" className="icon-btn primary" title="Éditer" aria-label="Éditer" onClick={() => { setDraft(form); setEditing(true) }}>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5V14h2.5L12.2 6.3 9.7 3.8 2 11.5zm11.1-6.1 1.5-1.5c.4-.4.4-1.1 0-1.5L13.6 1.4c-.4-.4-1.1-.4-1.5 0L10.6 2.9l2.5 2.5z" /></svg>
                    </button>
                  )}
                  {canEdit && editing && (
                    <>
                      <button
                        type="button"
                        className="icon-btn primary"
                        title="Enregistrer"
                        aria-label="Enregistrer"
                        onClick={async () => {
                          setError('')
                          try {
                            const saved = form.id ? await api.updateClip(form) : await api.createClip(form)
                            setEditing(false)
                            setSelected(saved)
                            await load()
                          } catch (err) {
                            setError((err as Error).message)
                          }
                        }}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h9l3 3v9H2V2zm2 0h6v4H4V2zm0 7h8v4H4V9z" /></svg>
                      </button>
                      <button type="button" className="icon-btn ghost" title="Annuler" aria-label="Annuler" onClick={() => { setEditing(false); setDraft(selected) }}>
                        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
                      </button>
                    </>
                  )}
                  {canEdit && form.id && (
                    <button type="button" className="icon-btn danger" title="Supprimer" aria-label="Supprimer" onClick={() => setPendingDelete(form)}>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l1 2h4v2H1V3h5l1-2zM3.5 6h9l-.6 9h-7.8L3.5 6z" /></svg>
                    </button>
                  )}
                  <button type="button" className="icon-btn ghost" title="Fermer" aria-label="Fermer la fiche" onClick={() => { setEditing(false); setPanelOpen(false) }}>
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
                  </button>
                </div>
              </div>

              <fieldset disabled={!canEdit || !editing} style={{ border: 0, padding: 0 }}>
                <div className="field"><label>Titre</label><input value={form.title} onChange={(e) => patch({ title: e.target.value })} /></div>
                <div className="field"><label>Artiste</label><input value={form.artist} onChange={(e) => patch({ artist: e.target.value })} /></div>
                <div className="field"><label>Origine / lieu</label><input value={form.originPlace} onChange={(e) => patch({ originPlace: e.target.value })} /></div>
                <div className="field"><label>Lieu de tournage</label><input value={form.filmingLocation} onChange={(e) => patch({ filmingLocation: e.target.value })} /></div>
                <div className="field"><label>Fichier vidéo</label><input value={form.filePath} onChange={(e) => patch({ filePath: e.target.value })} /></div>
                <div className="field"><label>Année</label><input type="number" value={form.year} onChange={(e) => patch({ year: Number(e.target.value) })} /></div>
                <div className="field"><label>Durée (secondes)</label><input type="number" value={form.durationSeconds} onChange={(e) => patch({ durationSeconds: Number(e.target.value) })} /></div>
                <div className="kicker">DONNÉES TECHNIQUES</div>
                <div className="field">
                  <label>Qualité</label>
                  <select value={form.quality} onChange={(e) => patch({ quality: e.target.value })}>
                    {lookups?.qualities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Format</label>
                  <select value={form.format} onChange={(e) => patch({ format: e.target.value })}>
                    {FORMATS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="kicker">MÉTADONNÉES ARTISTIQUES</div>
                <div className="field">
                  <label>Genre</label>
                  <select value={form.genre} onChange={(e) => patch({ genre: e.target.value })}>
                    {lookups?.genres.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Langue</label>
                  <select value={form.language} onChange={(e) => patch({ language: e.target.value })}>
                    {lookups?.languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Thème</label>
                  <select value={form.theme} onChange={(e) => patch({ theme: e.target.value })}>
                    {lookups?.themes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Audience</label>
                  <select value={form.audience} onChange={(e) => patch({ audience: e.target.value })}>
                    {lookups?.audiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="kicker">SCORE D&apos;IMPACT (HIT SI ≥ 4,5)</div>
                <div className="field"><label>Note du comité (1–5)</label><input type="number" step="0.1" value={form.committeeRating} onChange={(e) => patch({ committeeRating: Number(e.target.value) })} /></div>
                <div className="field"><label>Popularité (1–5)</label><input type="number" step="0.1" value={form.popularityScore} onChange={(e) => patch({ popularityScore: Number(e.target.value) })} /></div>
                <div className="field"><label>Réseaux sociaux (1–5)</label><input type="number" step="0.1" value={form.socialScore} onChange={(e) => patch({ socialScore: Number(e.target.value) })} /></div>
                <p className="gold">{form.impactLabel}</p>
                <label className="row-check"><input type="checkbox" checked={form.isBurkinabe} onChange={(e) => patch({ isBurkinabe: e.target.checked })} /> Clip burkinabè</label>
                <label className="row-check"><input type="checkbox" checked={form.isPremium} onChange={(e) => patch({ isPremium: e.target.checked })} /> Premium / Hit</label>
                <label className="row-check"><input type="checkbox" checked={form.isMorallyCompliant} onChange={(e) => patch({ isMorallyCompliant: e.target.checked })} /> Conforme moralement</label>
              </fieldset>
            </>
          )}
        </article>
        )}
      </div>
      <p className="muted">Stock : {clips.length} clips dans la médiathèque</p>

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-clip-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kicker">CONFIRMER LA SUPPRESSION</div>
            <h2 id="delete-clip-title" style={{ margin: '8px 0 0' }}>Supprimer ce clip de la médiathèque ?</h2>
            <p className="muted">« {pendingDelete.title} » sera retiré définitivement du catalogue.</p>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setPendingDelete(null)}>Annuler</button>
              <button type="button" className="btn danger" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
