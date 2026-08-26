import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('tvmusic.theme') === 'light' ? 'light' : 'dark',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
