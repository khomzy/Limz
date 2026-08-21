# Medicy

Medicy is a clinical and laboratory information platform developed by **Afrisoft**, a technology startup in Malawi. It provides separate TB, HIV, general clinical and laboratory workflows, with facility-level patient record isolation.

Production URL: [https://lab.afrisoft.space](https://lab.afrisoft.space)

## Local development

```bash
npm ci
npm run dev
```

Create a local `.env` file (never commit it):

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# Optional: lets staff enter a short username instead of a full work email.
VITE_MEDICY_USERNAME_DOMAIN=accounts.example.org
```

The frontend must receive only a Supabase publishable/anon key. Service-role, secret and Africa's Talking credentials belong in protected server-side configuration.

Without Supabase variables, the public website remains available but secure application login is disabled. No patient records or login credentials are embedded in the frontend.

## Supabase setup

1. Run `schema.sql` in the Supabase SQL editor.
2. Create users in Supabase Auth.
3. Assign authorization in each user's `app_metadata` with the Admin API/service role:

```json
{
  "role": "lab",
  "facility_id": "ZCH001",
  "facility_name": "Zingwangwa Community Hospital"
}
```

Allowed roles are `lab`, `tb`, `hiv` and `clinician`. Never put roles or facility authorization in `user_metadata`, because users can edit that metadata.

4. Deploy a protected Supabase Edge Function named `send-result-sms` if result SMS delivery is required. Store the Africa's Talking credentials as Edge Function secrets, not `VITE_` variables.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions repository secrets.

## Workflow boundaries

- `tb`: TB requests and TB history only.
- `hiv`: HIV viral load/EID requests and HIV history only.
- `clinician`: haematology and chemistry requests created by that user.
- `lab`: all diagnostic requests for the user's assigned facility, including status updates and result entry.

The database repeats these boundaries with Row Level Security; UI restrictions are not the security boundary.

## GitHub Pages and custom domain

The workflow in `.github/workflows/deploy.yml` builds the Vite application and publishes `dist` to GitHub Pages. `public/CNAME` sets the custom domain to `lab.afrisoft.space`.

At the DNS provider for `afrisoft.space`, add:

```text
Type: CNAME
Name: lab
Target: khomzy.github.io
```

After DNS resolves, enable **Enforce HTTPS** in GitHub → repository Settings → Pages. Remove any conflicting `lab` A, AAAA or CNAME record before adding this one.

## Verification

```bash
npm run build
npm run lint
```
