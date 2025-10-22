
# Property Offer Outreach (Next.js)

A lightweight system to import owner leads, calculate offers, generate PDF letters, and send email offers via SendGrid.

## Quick Start

1) **Clone & install**
```bash
npm install
```

2) **Environment**
Copy `.env.example` to `.env.local` and fill in values.

3) **Run locally**
```bash
npm run dev
```
Open http://localhost:3000

4) **Deploy**
- Push to GitHub and import into **Vercel** (Node 18+).
- Add the environment variables from `.env.example` to Vercel Project Settings → Environment Variables.
- Set build command `next build` and output directory `.next` (default).

## CSV Columns
- owner_name, email, mailing_address, property_address, apn, beds, baths, sqft, year_built, last_sale_date, last_sale_price, est_value, offer_basis, repairs_est, channel, status, notes

## Offer Formula
Default: `(est_value * offer_basis) - repairs_est` (rounded to whole dollars).

## Endpoints
- `POST /api/generate-offer` → compute an offer
- `POST /api/send` → send emails via SendGrid
- `POST /api/pdfs` → zip of PDF letters

## Legal
Provide truthful outreach, include your address in emails, honor opt-outs, and comply with CAN-SPAM/TCPA and any state rules. This project stores no server-side DB by default; extend to a database for production.
