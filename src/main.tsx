import React from 'react'
import ReactDOM from 'react-dom/client'
import Storefront from './Storefront'
import Admin from './Admin'
import './index.css'
import './mobile-fixes.css'
import './typography-fixes.css'
import './admin-polish.css'

const root = document.getElementById('root')!
const screen = location.pathname.startsWith('/admin') ? <Admin /> : <Storefront />

ReactDOM.createRoot(root).render(<React.StrictMode>{screen}</React.StrictMode>)
