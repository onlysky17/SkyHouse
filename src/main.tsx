import React from 'react'
import ReactDOM from 'react-dom/client'
import Storefront from './Storefront'
import Admin from './Admin'
import TrackOrder from './TrackOrder'
import { installCartFeedback } from './cart-feedback'
import { installCartCustomerInfo } from './cart-customer-info'
import { installQuickShop } from './quick-shop'
import { installSalePricing } from './sale-pricing'
import { installSaleVisualPolish } from './sale-visual-polish'
import { installAdminOrders } from './admin-orders'
import { installAdminOrderOps } from './admin-order-ops'
import { installOrderTrackingLink } from './order-tracking-link'
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
import './admin-orders.css'
import './admin-order-settlement.css'
import './admin-order-ops.css'
import './track-order.css'

const root = document.getElementById('root')!
const isAdmin = location.pathname.startsWith('/admin')
const isTrack = location.pathname.startsWith('/track')
const screen = isAdmin ? <Admin /> : isTrack ? <TrackOrder /> : <Storefront />

installSalePricing()
installAdminOrders()
installAdminOrderOps()
installOrderTrackingLink()

if (!isAdmin && !isTrack) {
  installCartFeedback()
  installCartCustomerInfo()
  installQuickShop()
  installSaleVisualPolish()
}

ReactDOM.createRoot(root).render(<React.StrictMode>{screen}</React.StrictMode>)
