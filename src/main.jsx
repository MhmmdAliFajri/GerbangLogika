import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FlipFlopPage from './pages/FlipFlopPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/flipflop/:type" element={<FlipFlopPage />} />
        <Route path="/flipflop" element={<FlipFlopPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
