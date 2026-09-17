import React from 'react'
import ReactDOM from 'react-dom/client'
import Storefront from './Storefront'
import Admin from './Admin'
import { installCartFeedback } from './cart-feedback'
import { installCartCustomerInfo } from './cart-customer-info'
import { installQuickShop } from './quick-shop'
import { installSalePricing } from './sale-pricing'
import './index.css'
import './mobile-fixes.css'
import './typography-fixes.css'
import './admin-polish.css'
import './product-badges.css'
import './cart.css'
import './cart-feedback.css'
import './cart-customer-info.css'
import './quick-shop.css'
import './sale-pricing.css'

const root = document.getElementById('root')!
const screen = location.pathname.startsWith('/admin') ? <Admin /> : <Storefront />

installSalePricing()

if (!location.pathname.startsWith('/admin')) {
  installCartFeedback()
  installCartCustomerInfo()
  installQuickShop()
}

ReactDOM.createRoot(root).render(<React.StrictMode>{screen}</React.StrictMode>)