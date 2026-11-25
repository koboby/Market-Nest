# Market Nest

A multi-tenant ecommerce SaaS that lets merchants create, customise, and publish beautiful online stores. This is a Shopify-style storefront platform — **not a POS or physical retail management system**.

## Product direction

- Public marketing site, signup, onboarding, and subscription plans.
- Private merchant workspaces for products, collections, orders, customers, discounts, domains, analytics, and store settings.
- Visual storefront editor with live preview, section-based page building, responsive controls, and reusable themes.
- Public hosted storefronts with custom subdomains and custom-domain support.
- Platform-owner admin for merchants, plans, subscriptions, payments, usage, and support.
- Tenant isolation enforced in PostgreSQL with Row Level Security.

## Planned stack

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL, Storage, and Edge Functions
- Paystack for recurring subscription billing and checkout payments
- Vercel deployment

## Local development

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase values after the dedicated Supabase project is provisioned.
4. Run `npm run dev`.

## Environment variables

See `.env.example`. Never commit service-role or secret keys. Only the Supabase publishable key belongs in a `NEXT_PUBLIC_` variable.

## Build phases

1. Foundation, brand system, public landing page, and app shell.
2. Supabase project, schema, tenant model, RLS, Auth, and Storage.
3. Merchant onboarding and store management.
4. Product catalogue, collections, media, and order workflows.
5. Visual theme editor and storefront renderer.
6. Checkout, Paystack integration, and subscription enforcement.
7. Domains, SEO, analytics, platform admin, testing, and deployment.

No POS, cash-register, or physical-shop checkout modules are in scope.
