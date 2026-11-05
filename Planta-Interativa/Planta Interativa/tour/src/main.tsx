import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startUrlSync, tourStore } from './state/store'
import { PROPERTIES } from './data/properties'
import { EMBED, voltarAoMapa } from './lib/embed'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

startUrlSync()

// Dentro do mapa o foco fica neste iframe: Esc (fora de janelas abertas) devolve o cliente ao mapa.
if (EMBED) window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) voltarAoMapa() })

// Casca padrão do painel (painel/casca.js, injetada pelo link-server): expõe o que a casca precisa acionar.
declare global { interface Window { LC_APP?: { store: typeof tourStore; properties: typeof PROPERTIES } } }
window.LC_APP = { store: tourStore, properties: PROPERTIES }

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
