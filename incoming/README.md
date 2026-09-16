# Product image import

Upload the generated file `SkyHouse_products_web.zip` into this folder with the exact name `incoming/SkyHouse_products_web.zip`.

GitHub Actions will extract 111 `product-XXX.webp` files into `public/images/`, switch the storefront from the old deployment URL to local Vercel assets, commit the result, and Vercel will auto-deploy from `main`.
