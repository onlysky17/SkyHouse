import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Admin from './Admin'
import { installProductImageFallback } from './product-image-fallback'
import './index.css'
import './mobile-fixes.css'
import './typography-fixes.css'

installProductImageFallback()

const root = document.getElementById('root')!
const screen = location.pathname.startsWith('/admin') ? <Admin /> : <App />

ReactDOM.createRoot(root).render(<React.StrictMode>{screen}</React.StrictMode>)
