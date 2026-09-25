const TOKEN_KEY = 'tvmusic.token'
const ROOT_TOKEN_KEY = 'tvmusic.rootToken'

export type PageId =
  | 'dashboard'
  | 'library'
  | 'hits'
  | 'programming'
  | 'export'
  | 'reports'
  | 'security'
  | 'constraints'
  | 'users'
  | 'account'

export type Session = {
  id?: string
  token: string
  fullName: string
  userName: string
  role: string
  expiresAt: string
  canEditLibrary: boolean
  canEditPlaylists: boolean
  canExport: boolean
  canViewReports: boolean
  canExportBbda: boolean
  canManageBackup: boolean
  canValidateClips: boolean
  canManageUsers?: boolean
  consultationOnly: boolean
  isImpersonating?: boolean
  impersonatedBy?: string
}

export type Option = { value: string; label: string; enumValue?: string; code?: string }

export type Lookups = {
  genres: Option[]
  languages: Option[]
  themes: Option[]
  audiences: Option[]
  qualities: Option[]
  slots: Option[]
  presets: { name: string }[]
}

export const HIT_THRESHOLD = 4.5

export function isClipHit(clip: Pick<Clip, 'isHit' | 'isPremium'>): boolean {
  return clip.isPremium === true || clip.isHit === true
}

export function isClipPending(clip: Pick<Clip, 'validationStatus' | 'isValidated'>): boolean {
  if (clip.validationStatus) return clip.validationStatus === 'Pending'
  return clip.isValidated !== true
}

export type Clip = {
  id: string
  title: string
  artist: string
  year: number
  originPlace: string
  filmingLocation: string
  isBurkinabe: boolean
  quality: string
  format: string
  durationSeconds: number
  durationLabel: string
  genre: string
  genreLabel: string
  language: string
  languageName?: string
  languageLabel: string
  theme: string
  themeLabel: string
  audience: string
  audienceLabel: string
  impactScore: number
  impactLabel: string
  originLabel: string
  isPremium: boolean
  isHit: boolean
  isMorallyCompliant: boolean
  filePath: string
  committeeRating: number
  popularityScore: number
  socialScore: number
  validationStatus?: string
  validationLabel?: string
  isValidated?: boolean
}

export type ScheduleItem = {
  clipId: string
  position: number
  isLocked: boolean
  title: string
  artist: string
  origin: string
}

export type SchedulePlaylist = {
  slot: string
  slotLabel: string
  sovereignty: number
  items: ScheduleItem[]
}

export type Schedule = {
  date: string
  sovereignty: number
  playlists: SchedulePlaylist[]
}

export type Dashboard = {
  user: string
  role: string
  target: number
  library: {
    total: number
    burkinabe: number
    foreign: number
    premium: number
    sovereignty: number
    alert: boolean
  }
  today: {
    hasSchedule: boolean
    sovereignty: number
    alert: boolean
    slots: { slot: string; count: number; sovereignty: number }[]
  }
  languages: { label: string; count: number }[]
  genres: { label: string; count: number }[]
}

export type BbdaQuery =
  | { year: number; month: number }
  | { from: string; to: string }

export type BbdaReport = {
  year: number
  month: number
  from?: string
  to?: string
  period?: string
  count: number
  sovereignty: number
  canExport: boolean
  entries: {
    date: string
    start: string
    slot: string
    title: string
    artist: string
    duration: string
    origin: string
  }[]
}

export type SecurityInfo = {
  fullName: string
  role: string
  tokenPreview: string
  expiresAt: string
  lastBackup: string | null
  canManageBackup: boolean
  transport: string
  entries: { at: string; actor: string; role: string; action: string; details: string }[]
}

export type Constraints = {
  platform: string
  details: string
  clipCount: number
  slots: string[]
  rows: { title: string; guarantee: string }[]
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

export function getRootToken(): string | null {
  return sessionStorage.getItem(ROOT_TOKEN_KEY)
}

export function setRootToken(token: string | null) {
  if (token) sessionStorage.setItem(ROOT_TOKEN_KEY, token)
  else sessionStorage.removeItem(ROOT_TOKEN_KEY)
}

export function emptyClip(): Clip {
  return {
    id: '',
    title: '',
    artist: '',
    year: new Date().getFullYear(),
    originPlace: 'Burkina Faso',
    filmingLocation: 'Ouagadougou',
    isBurkinabe: true,
    quality: 'Hd',
    format: 'MP4',
    durationSeconds: 180,
    durationLabel: '03:00',
    genre: 'AfroPop',
    genreLabel: 'Afro-pop',
    language: 'Moore',
    languageName: 'Mooré',
    languageLabel: 'Mooré',
    theme: 'Amour',
    themeLabel: 'Amour',
    audience: 'Famille',
    audienceLabel: 'Famille',
    impactScore: 3,
    impactLabel: 'Score 3.0',
    originLabel: 'Burkinabè',
    isPremium: false,
    isHit: false,
    isMorallyCompliant: true,
    filePath: '',
    committeeRating: 3,
    popularityScore: 3,
    socialScore: 3,
    validationStatus: 'Pending',
    validationLabel: 'À valider',
    isValidated: false,
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed || trimmed.startsWith('<')) {
    throw new Error(
      'L’API a renvoyé une page HTML au lieu du JSON. Ouvrez https://localhost:5173 et laissez l’API sur le port 7245.',
    )
  }
  try {
    return JSON.parse(trimmed) as T
  } catch {
    throw new Error('Réponse API invalide.')
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(path, { ...init, headers })
  if (response.status === 401) {
    setToken(null)
    throw new Error('Session expirée. Reconnectez-vous.')
  }
  if (!response.ok) {
    let message = response.status === 403 ? 'Accès refusé pour ce rôle.' : `Erreur ${response.status}`
    try {
      const body = await parseJson<{ message?: string }>(response)
      if (body.message) message = body.message
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTML')) {
        throw err
      }
    }
    throw new Error(message)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return parseJson<T>(response)
}

function bbdaParams(query: BbdaQuery) {
  if ('from' in query) {
    return `from=${query.from}&to=${query.to}`
  }
  return `year=${query.year}&month=${query.month}`
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken()
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Aucune grille pour cette date.' : `Erreur ${response.status}`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const api = {
  login: (userName: string, password: string) =>
    request<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userName, password }),
    }),
  me: () => request<Session>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  dashboard: () => request<Dashboard>('/api/dashboard'),
  lookups: () => request<Lookups>('/api/lookups'),
  addLanguage: (label: string) =>
    request<{ label: string; enumValue: string; code: string }>('/api/languages', {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),
  clips: (q = '', genre = '', language = '', burkinabeOnly = false) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (genre) params.set('genre', genre)
    if (language) params.set('language', language)
    if (burkinabeOnly) params.set('burkinabeOnly', 'true')
    return request<Clip[]>(`/api/clips?${params}`)
  },
  clipMedia: async (id: string) => {
    const token = getToken()
    const response = await fetch(`/api/clips/${id}/media`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Fichier vidéo introuvable.' : `Erreur ${response.status}`)
    }
    return response.blob()
  },
  createClip: (clip: Clip) =>
    request<Clip>('/api/clips', { method: 'POST', body: JSON.stringify(clip) }),
  updateClip: (clip: Clip) =>
    request<Clip>(`/api/clips/${clip.id}`, { method: 'PUT', body: JSON.stringify(clip) }),
  deleteClip: (id: string) => request<void>(`/api/clips/${id}`, { method: 'DELETE' }),
  validateClip: (id: string) => request<Clip>(`/api/clips/${id}/validate`, { method: 'PUT' }),
  rejectClip: (id: string, note = '') =>
    request<Clip>(`/api/clips/${id}/reject`, { method: 'PUT', body: JSON.stringify({ note }) }),
  clipsCsvUrl: () => '/api/clips.csv',
  importClipsCsv: (csv: string) =>
    request<{ imported: number }>('/api/clips/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: csv,
    }),
  schedule: (date: string) => request<Schedule>(`/api/schedules?date=${date}`),
  generate: (date: string, thematic: boolean, preset: string) =>
    request<Schedule>('/api/schedules/generate', {
      method: 'POST',
      body: JSON.stringify({ date, thematic, preset }),
    }),
  saveSchedule: (schedule: Schedule) =>
    request<Schedule>('/api/schedules', {
      method: 'PUT',
      body: JSON.stringify({
        date: schedule.date,
        playlists: schedule.playlists.map((playlist) => ({
          slot: playlist.slot,
          items: playlist.items.map((item) => ({
            clipId: item.clipId,
            isLocked: item.isLocked,
          })),
        })),
      }),
    }),
  lock: (date: string, slot: string, position: number) =>
    request<Schedule>('/api/schedules/lock', {
      method: 'POST',
      body: JSON.stringify({ date, slot, position }),
    }),
  validateBroadcast: (date: string) =>
    request<{ recorded: number }>('/api/broadcasts/validate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),
  bbda: (query: BbdaQuery) =>
    request<BbdaReport>(`/api/reports/bbda?${bbdaParams(query)}`),
  bbdaCsvUrl: (query: BbdaQuery) =>
    `/api/reports/bbda.csv?${bbdaParams(query)}`,
  bbdaPdfUrl: (query: BbdaQuery) =>
    `/api/reports/bbda.pdf?${bbdaParams(query)}`,
  exportUrl: (format: string, date: string) => `/api/export/${format}?date=${date}`,
  security: () => request<SecurityInfo>('/api/security'),
  backup: () => request<{ path: string }>('/api/backup', { method: 'POST' }),
  constraints: () => request<Constraints>('/api/constraints'),
  updateProfile: (fullName: string, userName: string) =>
    request<{ message: string; session: Session }>('/api/account/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, userName }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/account/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  users: () =>
    request<{ id: string; fullName: string; userName: string; role: string; isActive: boolean }[]>('/api/users'),
  impersonate: (id: string) =>
    request<Session>(`/api/users/${id}/impersonate`, { method: 'POST' }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/users/${id}`, { method: 'DELETE' }),
}
