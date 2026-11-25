# Market Nest

A multi-tenant ecommerce SaaS that lets merchants create, customise, and publish beautiful online stores. This is a Shopify-style storefront platform — **not a POS or physical retail management system**.

## Product direction

- Public marketing site, signup, onboarding, and subscription plans.
- Private merchant workspaces for products, collections, customers, orders, domains, analytics, and store settings.
- Visual storefront editor with section-based page building, live preview, responsive controls, reusable themes, and publishing.
- Public hosted storefronts at `/s/<store-slug>`, with custom subdomains and custom-domain support planned.
- Platform-owner admin for merchants, plans, subscriptions, payments, usage, and support.
- Tenant isolation enforced in PostgreSQL with Row Level Security.
- Image uploads are converted to WebP and must be **strictly smaller than 100 KB**. Supabase Storage independently rejects files at or above 99,999 bytes.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Paystack for recurring subscription billing and shopper checkout (planned)
- Vercel deployment

## Local development

1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local`.
3. Run `npm install`.
4. Run `npm run dev`.

The example environment already points to the dedicated Market Nest Supabase project. The publishable key is intended for browser use. Never add a Supabase secret/service-role key to a `NEXT_PUBLIC_*` variable or commit one to Git.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`

GitHub Actions runs these checks on pushes and pull requests to `main`.

## Current build status

- Marketing homepage and responsive brand system.
- Supabase Auth client/server setup and session refresh proxy.
- Merchant signup and sign-in screens.
- Merchant dashboard, store creation, and store workspace.
- Product and collection creation/management screens.
- Image-to-WebP compression helper and private Storage upload pipeline.
- Store page editor with live preview, section editing/reordering, theme colour controls, draft saving, and publishing.
- Public storefront renderer for published stores and active products.
- Database migrations for merchant data, tenant RLS, storage access, and public storefront access.

## Remaining product phases

1. Product editing, variants, stock controls, collection assignment, and customer/order models.
2. Full drag-and-drop editor, more templates, responsive section settings, and custom domains.
3. Cart, checkout, Paystack payments, and recurring subscription enforcement.
4. Merchant analytics, platform-owner admin, support tools, and audit logs.
5. End-to-end testing, auth redirect configuration, Vercel deployment, and production hardening.

No POS, cash-register, or physical-shop checkout modules are in scope.
