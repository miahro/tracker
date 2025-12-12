// web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import './styles/app.css'
import './styles/mapantLabels.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
