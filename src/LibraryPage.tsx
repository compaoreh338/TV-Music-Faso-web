import { useEffect, useState } from 'react'
import { api, emptyClip, type Clip, type Lookups } from './api'

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

  const load = () =>
    api.clips(query, genre, language, burkinabeOnly)
      .then((rows) => {
        setClips(rows)
        setSelected((current) => rows.find((row) => row.id === current?.id) ?? rows[0] ?? null)
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

  return (
    <>
      <div className="toolbar">
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
        <button
          type="button"
          className="btn"
          disabled={!canEdit}
          onClick={() => {
            const created = emptyClip()
            setSelected(created)
            setDraft(created)
            setEditing(true)
          }}
        >
          Nouveau clip
        </button>
      </div>

      {!canEdit && (
        <p className="gold">Consultation seule : l&apos;édition de la médiathèque est réservée aux programmateurs.</p>
      )}
      {error && <p className="alert">{error}</p>}

      <div className="split">
        <article className="card">
          <div className="kicker">CATALOGUE</div>
          <p className="muted">{clips.length} clip(s)</p>
          <ul className="list">
            {clips.map((clip) => (
              <li
                key={clip.id}
                className={selected?.id === clip.id ? 'selected' : ''}
                onClick={() => { setEditing(false); setSelected(clip) }}
              >
                <strong>{clip.title}</strong>
                <div className="muted">{clip.artist} · {clip.languageLabel} · {clip.genreLabel}</div>
                <div className="gold">{clip.originLabel}</div>
                {canEdit && (
                  <div className="list-actions">
                    <button type="button" className="btn ghost" onClick={(e) => { e.stopPropagation(); setSelected(clip); setDraft(clip); setEditing(true) }}>Éditer</button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm(`Supprimer « ${clip.title} » ?`)) return
                        await api.deleteClip(clip.id)
                        setEditing(false)
                        await load()
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <div className="kicker">FICHE CLIP</div>
          {!form ? (
            <p className="muted">Sélectionnez un clip du catalogue, ou créez-en un.</p>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>Métadonnées de diffusion</h2>
              {canEdit && !editing && (
                <div className="toolbar">
                  <button type="button" className="btn" onClick={() => { setDraft(form); setEditing(true) }}>Éditer</button>
                </div>
              )}
              {canEdit && editing && (
                <div className="toolbar">
                  <button
                    type="button"
                    className="btn"
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
                    Enregistrer
                  </button>
                  <button type="button" className="btn ghost" onClick={() => { setEditing(false); setDraft(selected) }}>Annuler</button>
                </div>
              )}

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
      </div>
      <p className="muted">Stock : {clips.length} clips dans la médiathèque</p>
    </>
  )
}
