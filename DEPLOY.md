# Deploy Mommy & Me

## Production environment variables

Add these variables in your hosting dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the same values that work locally.

## Vercel steps

1. Push this project to GitHub.
2. Go to Vercel and click `Add New Project`.
3. Import the GitHub repository.
4. In Project Settings, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Keep the default install command as `npm install`.
6. Keep the build command as `npm run build`.
7. Keep the output directory as `dist/public`.
8. Click `Deploy`.

`vercel.json` is already included to make the Vite SPA route correctly.

## Netlify steps

1. Push this project to GitHub.
2. Go to Netlify and create a new site from Git.
3. Set build command to `npm run build`.
4. Set publish directory to `dist/public`.
5. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy the site.

`public/_redirects` is already included so client-side routes resolve to `index.html`.

## Notes

- Do not commit `.env.local`.
- Supabase auth and data access run entirely from the client, so the `VITE_` prefix is required for production builds.
- If you change the production domain later, update your Supabase Auth URL settings if needed.
