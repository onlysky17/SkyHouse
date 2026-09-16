# Supabase setup for SkyHouse

No Supabase secret is stored in this repository.

## One-time setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Authentication → Users**, create the admin account that will be used at `/admin`.
4. In Vercel project `sky-house`, add these environment variables for Production and Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Redeploy once after adding the environment variables.

After that, product changes made in `/admin` are stored in Supabase and do not require a code deployment.

The public storefront is still using the current embedded catalog until the data migration step is completed. This avoids switching the live store before the Supabase data is verified.
