import React from 'react'
import ReactDOM from 'react-dom/client'
import Storefront from './Storefront'
import Admin from './Admin'
import { installCartFeedback } from './cart-feedback'
import './index.css'
import './mobile-fixes.css'
import './typography-fixes.css'
import './admin-polish.css'
import './product-badges.css'
import './cart.css'
import './cart-feedback.css'

const root = document.getElementById('root')!
const screen = location.pathname.startsWith('/admin') ? <Admin /> : <Storefront />

if (!location.pathname.startsWith('/admin')) installCartFeedback()

ReactDOM.createRoot(root).render(<React.StrictMode>{screen}</React.StrictMode>)
