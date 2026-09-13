# Spartan Advanced Research — clean rebuild v2

## What is now built
- Catalog, age gate, product details, cart, stock status
- Separate calculator screen
- Server-side cart verification: product, stock, quantity, price
- USPS live-rate integration scaffold using USPS API v3 OAuth
- Package weight calculation from product weights + packaging tare
- Permanent order storage: PostgreSQL when DATABASE_URL is set
- Unique order IDs and order statuses
- Server-generated PDF invoice
- Order confirmation page
- NOWPayments invoice/payment creation
- NOWPayments IPN signature verification + duplicate-event protection
- NOWPayments `is_fee_paid_by_user: true` and fixed-rate mode
- Resend merchant order email after a payment is marked Paid
- Basic policy-page placeholders

## IMPORTANT before live testing
1. Current vial shipping weight is set to the measured **6 g per vial** (about 0.2116 oz).
2. `PACKAGE_TARE_OZ` is set to **2.7514 oz (78 g)**: 58 g small box + 20 g temporary packing allowance.
   Replace this tare weight when the permanent mailer/packing setup is chosen.
3. Set USPS origin ZIP and USPS API credentials.
4. Verify `USPS_SHIPPING_OPTIONS_URL` against the current Shipping Options 3.0 documentation for your USPS account.
5. Create a PostgreSQL database and run `schema.sql`, then set `DATABASE_URL`.
6. Set Resend and NOWPayments environment variables.
7. Set SITE_URL to the deployed test URL.
8. Test in a non-live/test environment first.
9. Review/finalize shipping, privacy, terms, return/refund and research-use policies before launch.

## Fee design
The order total is merchandise + actual USPS shipping.
NOWPayments is requested with `is_fee_paid_by_user: true` and `is_fixed_rate: true`, so the payment provider can increase the crypto amount the customer sends to cover payment fees rather than reducing the order proceeds. Network fees vary and should never be hard-coded as a guessed percentage.


## Email + invoice behavior
- When NOWPayments first confirms a paid order, the merchant gets a complete order email.
- The customer also gets an order-confirmation email.
- The same server-generated PDF invoice is attached to both messages.
- The PDF contains the order number, products, strengths, quantities, prices, USPS shipping, grand total, and shipping address.
- Duplicate payment callbacks will not intentionally send the paid email twice.


## Private order-management dashboard
- Open `/admin.html` on the deployed site.
- Sign in with the password stored in the Vercel `ADMIN_PASSWORD` environment variable.
- `ADMIN_SESSION_SECRET` signs an 8-hour HttpOnly admin session cookie.
- The dashboard lists recent orders, totals, payment status, customer information, shipping address, products, and invoice access.
- Order status can be changed to Awaiting Payment, Paid, Processing, Shipped, Cancelled, Payment Failed, Refunded, or Partially Paid.
- Admin status changes are written to the order-status history table when PostgreSQL is configured.


## Permanent PostgreSQL database setup
The build is now ready for a permanent PostgreSQL database.

1. Create a PostgreSQL database with any compatible provider.
2. Add its connection string to Vercel as `DATABASE_URL`.
3. Set `ADMIN_PASSWORD` to the private password you want to use for `/admin.html`.
4. Generate a long random value for `ADMIN_SESSION_SECRET` and store it in Vercel.
5. Run `npm run db:migrate` once against the database to create the `orders`, `webhook_events`, and `order_status_history` tables.
6. After deployment, open `/api/db-health`. A successful connection returns `"ok": true`.

Do not put the real database password, admin password, or session secret into GitHub.


## Inventory management
- The private `/admin.html` page now includes inventory controls.
- Each product can be marked In Stock or Out of Stock.
- Quantity can be left blank for simple status-only tracking.
- Enter a whole-number quantity to enable exact stock checking at checkout.
- Checkout validates inventory before creating an order.
- PostgreSQL stores inventory permanently once `DATABASE_URL` is configured.


## Final pre-deployment safeguards added
- Checkout now uses a unique client request ID so repeated taps/retries reuse the same order instead of creating duplicates.
- New unpaid orders expire automatically after 2 hours.
- Customer order data and invoices require a private order access token.
- The customer payment endpoint also requires that token and refuses expired, cancelled, failed, refunded, or already-paid orders.
- `/track.html` lets a customer check order status using the order number plus checkout email.
- Admin orders now include a USPS tracking-number field and an `Expired` status.
- When an order is marked Shipped, the shipped timestamp and tracking number are retained.


## Final five improvements
1. Inventory quantities are deducted only after NOWPayments confirms the first successful Paid transition.
2. Marking an order Shipped sends the customer a shipping-status email and includes the saved USPS tracking number when present.
3. Admin orders now have a search box and status filter.
4. Customer-facing checkout, payment, tracking, and shipping errors use simple messages while technical details remain in server/browser logs.
5. Mobile navigation was simplified so Track Order and Calculator remain available but secondary to the core purchase flow.
