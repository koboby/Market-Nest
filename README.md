# Market Nest

Market Nest is a multi-tenant ecommerce SaaS that lets merchants subscribe to a plan, build a beautiful online store, and sell products online. It is a hosted storefront platform — **not a POS or physical retail management system**.

## Product capabilities

- Public marketing homepage, merchant authentication, onboarding and store workspace.
- Product catalogue with editing, inventory, SKU, and product variants.
- Collections for organising the storefront catalogue.
- Visual storefront editor with section editing, drag-and-drop ordering, desktop/mobile preview, theme colours, draft saving and publishing.
- Hosted storefronts at `/s/<store-slug>`, with shopping bag and customer checkout.
- Paystack shopper payments with signed webhooks, server-side verification, paid-order processing and stock updates.
- Merchant orders, customers, analytics, billing, settings, media library and custom-domain workspaces.
- Platform-owner area for creating monthly subscription plans and linking Paystack recurring plan codes.
- Tenant isolation enforced with PostgreSQL Row Level Security.
- Every uploaded image is converted to WebP and must be strictly smaller than 100 KB. Supabase Storage enforces a 99,999-byte ceiling and accepts WebP only.

## Stack

- Next.js App Router, React and TypeScript
- Supabase Auth, PostgreSQL, Storage and Row Level Security
- Paystack for shopper payments and recurring merchant subscriptions
- Vercel deployment and optional Vercel domain provisioning

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

The example environment points at the dedicated Market Nest Supabase project. The publishable key is safe for browser use when RLS is enabled. Never expose the Supabase service-role key or Paystack secret key through a `NEXT_PUBLIC_*` variable or commit a real secret to Git.

## Required deployment environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only; required for secure checkout, webhook processing and platform administration.
- `PAYSTACK_SECRET_KEY` — server only; use a Paystack test key for initial testing.
- `PLATFORM_ADMIN_EMAILS` — comma-separated allowlist of platform-owner login emails.
- `NEXT_PUBLIC_APP_URL` — canonical deployed application URL.
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and optional `VERCEL_TEAM_ID` — only required for automatic custom-domain provisioning.

## Paystack configuration

1. Configure a monthly plan in Market Nest's `/platform` admin area. This creates the recurring plan in Paystack and stores its plan code.
2. Set the Paystack webhook URL to `https://YOUR_DOMAIN/api/paystack/webhook`.
3. Enable the subscription events and `charge.success` events in Paystack.
4. Use test-mode credentials and test transactions before enabling live payments.

Paystack subscription plans must exist at Paystack before merchants can subscribe. Paystack manages recurring billing and emits events such as `subscription.create`, `charge.success`, `invoice.payment_failed`, and cancellation events. See [Paystack subscriptions](https://paystack.com/docs/payments/subscriptions/) and [webhooks](https://paystack.com/docs/payments/webhooks/).

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`

GitHub Actions runs these checks on pushes and pull requests to `main`.

## Current implementation status

- Marketing site, authentication, merchant dashboard and store creation.
- Products, collections, product editing, stock, SKU and variants.
- WebP compression pipeline and private image storage with a strict sub-100-KB upload limit.
- Visual page editor, responsive preview, section ordering, theme settings and publishing.
- Public storefront, shopping bag, delivery details and Paystack checkout.
- Orders, customers, payment events, stock decrement after confirmed payment and revenue analytics.
- Merchant subscription schema, Paystack plan creation, recurring checkout and webhook lifecycle handling.
- Platform plan management, store settings, media library and custom-domain provisioning hooks.
- CI workflow and Supabase security/performance advisor checks.

## Still requires external configuration and live testing

- Add the server-only Supabase service-role key and Paystack secret key to the deployment environment.
- Add the platform owner email(s) to `PLATFORM_ADMIN_EMAILS`.
- Create the Paystack recurring plans from `/platform`, then configure the Paystack webhook URL.
- Configure Vercel environment variables and domain provisioning credentials if custom domains are needed.
- Verify Supabase Auth Site URL and allowed redirect URLs for the deployed domains.
- Run the GitHub Actions checks and complete real Paystack test-mode checkout/subscription cycles.
- Complete deeper end-to-end testing, shipping rates, discounts, refunds, email notifications, and custom domain DNS verification.

No POS, cash-register, or physical-shop checkout modules are in scope.

## Manual acceptance checklist

Use Paystack test mode and a test deployment before enabling live payments.

1. Sign up, confirm the email, and sign in.
2. Create a store and open its workspace.
3. Add a collection, create a product, assign it to that collection, and add a product variant.
4. Upload a large JPG or PNG and confirm the resulting WebP file is below 99,999 bytes.
5. Publish the store and open `/s/<store-slug>` in a private browser session.
6. Add a base product and a variant to the bag, complete the delivery form, and test a Paystack checkout.
7. Confirm the signed webhook changes the order to paid, updates customer totals, and decrements the correct product or variant inventory exactly once.
8. Create a monthly plan in `/platform`, subscribe a test merchant, and verify renewal/failure/cancellation webhook handling.
9. Add a test custom domain in Vercel, configure its DNS, verify it, and open the published store on that hostname.
10. Test merchant isolation with two separate accounts and confirm neither can read or edit the other's store data.
