import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startUrlSync, tourStore } from './state/store'
import { PROPERTIES } from './data/properties'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

startUrlSync()

// Casca padrão do painel (painel/casca.js, injetada pelo link-server): expõe o que a casca precisa acionar.
declare global { interface Window { LC_APP?: { store: typeof tourStore; properties: typeof PROPERTIES } } }
window.LC_APP = { store: tourStore, properties: PROPERTIES }

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
