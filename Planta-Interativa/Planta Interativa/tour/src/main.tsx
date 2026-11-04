import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startUrlSync } from './state/store'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

startUrlSync()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
