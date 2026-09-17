# CART-001 validation

Expected behaviors for review:

- Cart button is visible in the storefront navbar with an item count.
- Opening a product modal allows adding an in-stock item to the cart.
- Cart supports multiple products and quantity +/- controls.
- Cart contents persist across refreshes via localStorage.
- Products with unknown prices remain orderable and are clearly marked for price confirmation.
- Cart creates one combined order message for Zalo, with copy-to-clipboard and phone fallback.
- No online payment flow is introduced.
- Mobile layout hides the phone pill first and keeps cart access visible.
