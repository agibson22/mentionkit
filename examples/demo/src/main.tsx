import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Set initial theme before rendering to prevent flash
const savedTheme = localStorage.getItem("theme")
const initialTheme = savedTheme === "dark" || savedTheme === "light" 
  ? savedTheme 
  : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
document.documentElement.setAttribute("data-theme", initialTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
