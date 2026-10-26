# Sobha Restaurant — ToDo

## Visual identity, immersive landing page, and navigation
- Create a website for Sobha Restaurant that closely reproduces the supplied website’s design and overall experience, section layout, and interaction patterns. Reference: https://www.qissa.co.uk/. Adapt the restaurant branding to Sobha Restaurant.
- Build a branded landing page for Sobha Restaurant with an immersive hero section and prominent reservation call to action.
- Build a responsive header with desktop navigation, mobile menu behavior, and smooth navigation between key sections.
- Implement responsive interactions and motion inspired by the reference, including hover states, scroll reveals, transitions, and polished mobile behavior.

## Restaurant story and menu
- Build story and concept sections that introduce Sobha Restaurant through editorial text and image-led layouts.
- Present the menu with clearly organized food and drink categories, item names, descriptions, and prices. Real Sobha menu and prices are pending from the user; do not present invented operational details as verified facts.

## Restaurant atmosphere, images, and galleries
- Include atmospheric image sections and galleries that reproduce the reference site’s layered, premium restaurant experience.

## Reservation experience
- Include a reservation section with date, time, party-size, and guest-detail inputs plus clear confirmation feedback.
- Do not imply a booking has been delivered to or confirmed by the restaurant unless a real booking integration is supplied. The current blueprint selected the guest-facing reservation experience; automated guest confirmations and restaurant booking alerts were not selected.

## Location and visit information
- Include opening hours, address, telephone, email, and practical visit information.
- Embed an interactive Google Map for Sobha Restaurant so guests can view its exact location, explore the surrounding area, and launch directions. The exact address is pending from the user; do not place an invented marker/location.

## Footer and brand consistency
- Include a footer with social links, essential navigation, legal links, and consistent Sobha Restaurant branding.

## Pending content supplied by user
- Exact street address (required for the map and directions), phone number, email address, opening hours, Sobha menu and prices, and booking URL or confirmed reservation process are pending. Use clearly identifiable editable placeholders until supplied.


## Demo food ordering and database backend
- Add a food-order flow to the Sobha website using clearly labelled sample/demo menu items and sample prices, so visitors can submit a demo order with customer name, delivery address, selected items and quantities.
- Save each demo order persistently through a Vercel backend function and database; calculate totals on the server from the sample menu rather than trusting browser-submitted prices.
- Keep the experience demo-only: do not take payment, claim that food will be prepared/delivered, or contact a customer-supplied phone number. Show that a fixed test recipient will receive the real demo notifications.

## Private order management and delivery statuses
- Provide a private staff order dashboard protected by a server-side password configured outside the source code; the dashboard lists demo orders and their details.
- Let staff advance an order through the explicit statuses `Order received`, `Preparing food`, `On the way`, `Arrived`, and `Delivered`, in that sequence.
- Persist each status change and show whether message delivery succeeded or failed; never claim a notification was sent when the provider is missing or rejects it.

## Real SMS and WhatsApp demo notifications
- When a demo order is placed, send the order details by both SMS and WhatsApp to one fixed demo recipient configured in server environment variables; never accept the message recipient from a public order form.
- When staff changes a demo order’s status, automatically send the matching status update by both SMS and WhatsApp to that same fixed recipient.
- Keep Twilio account credentials, the demo phone number, database connection string and staff password on the server only; do not embed these secrets in browser code or the ZIP’s source.
- Record each provider result or failure with the related demo order and channel. If credentials are absent, report that notifications are not configured rather than pretending messages were delivered.

## Vercel deployment and setup guidance
- Deploy the website and its backend endpoints as one Vercel project; use a persistent PostgreSQL database and document the one-time database setup, the required Vercel environment-variable names, Twilio sender/Sandbox setup, and redeployment step.
- Make clear that automatic real SMS/WhatsApp delivery requires the user’s own provider account, credentials, consented test phone, applicable sender approvals, and any provider charges; do not attempt to send messages without those prerequisites.
