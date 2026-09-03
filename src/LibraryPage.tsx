import { useEffect, useRef, useState } from 'react'
import { api, downloadFile, emptyClip, isClipHit, isClipPending, type Clip, type Lookups } from './api'
import ConfirmDialog from './ConfirmDialog'

const FORMATS = ['MP4', 'MOV', 'MKV', 'AVI']

export default function LibraryPage({
  canEdit,
  canValidate = false,
  hitsOnlyMode = false,
}: {
  canEdit: boolean
  canValidate?: boolean
  hitsOnlyMode?: boolean
}) {
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [selected, setSelected] = useState<Clip | null>(null)
  const [draft, setDraft] = useState<Clip | null>(null)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState('')
  const [burkinabeOnly, setBurkinabeOnly] = useState(false)
  const [hitsOnly, setHitsOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newLanguage, setNewLanguage] = useState('')
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Clip | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaError, setMediaError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const load = () =>
    api.clips(query, genre, language, burkinabeOnly)
      .then((rows) => {
        const filtered = (hitsOnlyMode || hitsOnly) ? rows.filter(isClipHit) : rows
        setClips(filtered)
        setSelected((current) => filtered.find((row) => row.id === current?.id) ?? null)
        setSelectedIds((current) => current.filter((id) => filtered.some((row) => row.id === id && isClipPending(row))))
      })
      .catch((err: Error) => setError(err.message))

  useEffect(() => {
    api.lookups().then(setLookups).catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [query, genre, language, burkinabeOnly, hitsOnly, hitsOnlyMode])

  useEffect(() => {
    if (!editing) setDraft(selected)
  }, [selected, editing])

  useEffect(() => {
    let objectUrl = ''
    const id = selected?.id
    if (!id) {
      setMediaUrl('')
      setMediaError('')
      return
    }

    setMediaError('')
    api.clipMedia(id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setMediaUrl(objectUrl)
      })
      .catch((err: Error) => {
        setMediaUrl('')
        setMediaError(err.message)
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selected?.id])

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

  const pendingClips = clips.filter(isClipPending)
  const allPendingSelected = pendingClips.length > 0 && pendingClips.every((clip) => selectedIds.includes(clip.id))

  const toggleSelected = (clip: Clip, checked: boolean) => {
    if (!isClipPending(clip)) return
    setSelectedIds((current) => checked ? [...new Set([...current, clip.id])] : current.filter((id) => id !== clip.id))
  }

  const applyBulk = async (action: 'validate' | 'reject') => {
    if (selectedIds.length === 0) return
    setError('')
    try {
      for (const id of selectedIds) {
        if (action === 'validate') await api.validateClip(id)
        else await api.rejectClip(id)
      }
      setSelectedIds([])
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
          {!hitsOnlyMode && (
            <label className="row-check" title="Afficher uniquement les clips Hit (Premium / Hit, ou score d'impact ≥ 4,5)">
              <input type="checkbox" checked={hitsOnly} onChange={(e) => setHitsOnly(e.target.checked)} />
              Hits
            </label>
          )}
          <button type="button" className="btn ghost" onClick={() => { setQuery(''); setGenre(''); setLanguage(''); setBurkinabeOnly(false); setHitsOnly(false) }}>
            Réinitialiser
          </button>
        </div>
        <div className="toolbar-actions">
          {!hitsOnlyMode && (
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
          )}
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

      {hitsOnlyMode && (
        <p className="gold">Onglet Hits : titres Premium / Hit (case cochée) ou score d’impact ≥ 4,5. Vous pouvez les consulter, les modifier et les valider ici.</p>
      )}
      {!canEdit && !hitsOnlyMode && (
        <p className="gold">Consultation seule : l&apos;édition de la médiathèque est réservée aux programmateurs.</p>
      )}
      {error && <p className="alert">{error}</p>}

      <div className={panelOpen ? 'split' : 'split catalog-only'}>
        <article className="card">
          <div className="kicker">{hitsOnlyMode ? 'HITS' : 'CATALOGUE'}</div>
          <p className="muted">{clips.length} {hitsOnlyMode ? 'hit(s)' : 'clip(s)'}</p>
          {canValidate && (
            <div className="bulk-bar">
              <label className="row-check">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  disabled={pendingClips.length === 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? pendingClips.map((clip) => clip.id) : [])}
                />
                Tout cocher (à valider)
              </label>
              <span className="muted">{selectedIds.length} sélectionné(s)</span>
              <button
                type="button"
                className="icon-btn primary"
                title="Valider la sélection"
                aria-label="Valider la sélection"
                disabled={selectedIds.length === 0}
                onClick={() => applyBulk('validate')}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8.2 5.6 13 15 2.4 13.5 1 5.6 10 2.4 6.7z" /></svg>
              </button>
              <button
                type="button"
                className="icon-btn danger"
                title="Refuser la sélection"
                aria-label="Refuser la sélection"
                disabled={selectedIds.length === 0}
                onClick={() => applyBulk('reject')}
              >
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
              </button>
            </div>
          )}
          <ul className="list">
            {clips.map((clip) => (
              <li key={clip.id} className={selected?.id === clip.id && panelOpen ? 'selected' : ''}>
                <div className="list-row-head">
                  {canValidate && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(clip.id)}
                      disabled={!isClipPending(clip)}
                      title="Sélectionner pour validation groupée"
                      onChange={(e) => toggleSelected(clip, e.target.checked)}
                    />
                  )}
                  {isClipHit(clip) ? (
                    <span className="hit-badge" title={clip.impactLabel} aria-label={clip.impactLabel}>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 9.8 5.9l5 .3-3.8 2.8 1.4 4.8L8 11.5 3.6 13.8 5 9l-3.8-2.8 5-.3z" /></svg>
                    </span>
                  ) : (
                    <span className="hit-badge hit-badge--empty" aria-hidden="true" />
                  )}
                  <strong>{clip.title}</strong>
                </div>
                <div className="muted">{clip.artist} · {clip.languageLabel} · {clip.genreLabel}</div>
                <div className="gold">{clip.validationLabel || clip.originLabel}</div>
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
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8.2 5.6 13 15 2.4 13.5 1 5.6 10 2.4 6.7z" /></svg>
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

              <div className="kicker">LECTEUR</div>
              <p className="gold">Visionnez le clip avant de valider.</p>
              {mediaUrl ? (
                <video
                  key={mediaUrl}
                  controls
                  src={mediaUrl}
                  style={{ width: '100%', maxHeight: 280, background: '#05080C', borderRadius: 10 }}
                />
              ) : (
                <p className="muted">{mediaError || 'Aucun fichier vidéo lisible pour cette fiche.'}</p>
              )}

              {canValidate && form.id && isClipPending(form) && !editing && (
                <div className="bulk-bar" style={{ marginBottom: 12 }}>
                  <button
                    type="button"
                    className="icon-btn primary"
                    title="Valider pour la programmation"
                    aria-label="Valider pour la programmation"
                    onClick={async () => {
                      setError('')
                      try {
                        const saved = await api.validateClip(form.id)
                        setSelected(saved)
                        await load()
                      } catch (err) {
                        setError((err as Error).message)
                      }
                    }}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8.2 5.6 13 15 2.4 13.5 1 5.6 10 2.4 6.7z" /></svg>
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Refuser"
                    aria-label="Refuser"
                    onClick={async () => {
                      setError('')
                      try {
                        const saved = await api.rejectClip(form.id)
                        setSelected(saved)
                        await load()
                      } catch (err) {
                        setError((err as Error).message)
                      }
                    }}
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2.4 6 5.2 10.8.4 12 1.6 7.2 6.4 12 11.2 10.8 12.4 6 7.6 1.2 12.4 0 11.2 4.8 6.4 0 1.6z" /></svg>
                  </button>
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
                  <select
                    value={form.languageName || form.languageLabel || form.language}
                    onChange={(e) => {
                      const option = lookups?.languages.find((item) => item.value === e.target.value)
                      patch({
                        language: option?.enumValue || 'Autre',
                        languageName: e.target.value,
                        languageLabel: e.target.value,
                      })
                    }}
                  >
                    {lookups?.languages.map((item) => <option key={item.code || item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  {canEdit && editing && (
                    <div className="row-check" style={{ marginTop: 8, gap: 8 }}>
                      <input
                        placeholder="Langue absente ? Ajoutez-la"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                      />
                      <button
                        type="button"
                        className="icon-btn ghost"
                        title="Ajouter la langue"
                        aria-label="Ajouter la langue"
                        onClick={async () => {
                          const label = newLanguage.trim()
                          if (label.length < 2) return
                          setError('')
                          try {
                            const added = await api.addLanguage(label)
                            const next = await api.lookups()
                            setLookups(next)
                            patch({
                              language: added.enumValue,
                              languageName: added.label,
                              languageLabel: added.label,
                            })
                            setNewLanguage('')
                          } catch (err) {
                            setError((err as Error).message)
                          }
                        }}
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1h2v6h6v2H9v6H7V9H1V7h6z" /></svg>
                      </button>
                    </div>
                  )}
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
                <label className="row-check">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => patch({
                      isPremium: e.target.checked,
                      isHit: e.target.checked || form.impactScore >= 4.5,
                      impactLabel: (e.target.checked || form.impactScore >= 4.5)
                        ? `Hit ${form.impactScore.toFixed(1)}`
                        : `Score ${form.impactScore.toFixed(1)}`,
                    })}
                  />
                  Premium / Hit
                </label>
                <label className="row-check"><input type="checkbox" checked={form.isMorallyCompliant} onChange={(e) => patch({ isMorallyCompliant: e.target.checked })} /> Conforme moralement</label>
              </fieldset>
            </>
          )}
        </article>
        )}
      </div>
      <p className="muted">Stock : {clips.length} clips dans la médiathèque</p>

      {pendingDelete && (
        <ConfirmDialog
          kicker="CONFIRMER LA SUPPRESSION"
          title="Supprimer ce clip de la médiathèque ?"
          message={`« ${pendingDelete.title} » sera retiré définitivement du catalogue.`}
          confirmLabel="Supprimer"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}
