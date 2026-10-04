import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installResizeShim } from './resize-shim'
import App from './App'

installResizeShim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
