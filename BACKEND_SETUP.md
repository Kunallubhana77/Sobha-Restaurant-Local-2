# Demo food-order backend: setup guide

Website mein ek **classroom demo** order flow hai. Order create karne par Vercel backend order ko Neon Postgres mein save karega. Staff dashboard par status badalne par Twilio se **SMS aur WhatsApp dono** ek fixed test number par bhejne ki koshish hogi. Yeh real restaurant order nahi hai: payment nahi hota aur khana prepare/deliver nahi hota. Sirf apna, consent diya hua test number configure karein; public order form recipient number nahi le sakta.

## Pehle yeh accounts chahiye

1. **Vercel** par website project.
2. **Neon Postgres** database.
3. **Twilio** account, API Key/Secret, SMS sender, aur WhatsApp Sandbox ya registered sender.

Real messages bhejne ke liye provider account/keys zaroori hain. Twilio/Meta fees, trial restrictions, account verification ya sender approvals lagu ho sakte hain. Koi bhi API key source code ya chat mein paste na karein.

## 1. Nayi website Vercel par deploy karein

Updated ZIP extract karke andar wala `Sobha-Restaurant-Local` project folder apne Vercel project par deploy karein. Agar purana project pehle se hai to usi project ko update karein. Vercel build settings yeh honi chahiye:

- Framework: `Vite`
- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build:static`
- Output directory: `dist/public`

Build mein Vercel Function `api/index.ts` bhi shamil hota hai. Static files se alag API server manually run karne ki zaroorat nahi.

## 2. Neon database jodein

Neon par Postgres project/database banayein, phir Vercel project ke **Settings → Environment Variables** mein Neon ka connection string `DATABASE_URL` naam se add karein. Ya Vercel Marketplace se Neon integration connect karke uska diya hua `DATABASE_URL` istemal karein. Is value ko `VITE_` prefix na dein.

Ek baar Neon SQL Editor kholkar ZIP ke `db/schema.sql` ki poori contents run karein. Yeh orders aur SMS/WhatsApp message attempts ki tables banayega.

## 3. Twilio sender aur test phone jodein

Twilio Console mein Account SID aur **API Key + API Secret** banayein. Vercel par ye values alag environment variables mein set hongi. SMS sender Twilio Console mein diya hua sender/registered Sender ID hoga.

WhatsApp ko pehle test karne ke liye Twilio WhatsApp Sandbox activate karke apne consented test phone se Twilio ke dikhaye `join <sandbox-code>` message ko Sandbox number par bhejein. `.env.example` mein diya `whatsapp:+14155238886` Twilio Sandbox ka common sender format hai; Twilio Console mein aapko jo sender diya gaya hai usi se match karein. Sandbox sirf testing ke liye hai; join ki hui session 3 din baad expire hoti hai. Sandbox ke bahar business-initiated messages ke liye approved WhatsApp templates ki zaroorat ho sakti hai. [Twilio Sandbox guide](https://www.twilio.com/docs/whatsapp/sandbox)

**India SMS:** Twilio ke vartamaan India niyamon ke mutabik domestic SMS ke liye company aur Sender ID ki DLT registration zaroori hoti hai. International route ki sender ID/deliverability alag hoti hai. Apne Twilio account ke liye exact route aur approvals Console/support se confirm karein. [Twilio India SMS guidelines](https://www.twilio.com/en-us/guidelines/in/sms)

## 4. Vercel Environment Variables bhar kar redeploy karein

Vercel project → **Settings → Environment Variables** mein yeh values Production environment ke liye add karein. Preview/Development par test karna ho to wahan bhi add karein.

| Variable | Kya bharna hai |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_PASSWORD` | Staff dashboard ke liye lamba, random password |
| `DEMO_ORDER_CODE` | Order form ke liye apna private classroom demo code; sirf demo dikhane walon ko batayein |
| `DEMO_RECIPIENT` | `+91` ke saath aapka consented test number; isi fixed number par dono channels jayenge |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_API_KEY` | Twilio API Key SID |
| `TWILIO_API_SECRET` | Usi API Key ka secret |
| `TWILIO_SMS_FROM` | Twilio ka SMS sender/approved Sender ID |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender, jaise Sandbox ke liye `whatsapp:+14155238886` |

`DATABASE_URL`, API secrets, password aur phone number **source code mein ya public `VITE_` variables mein mat daalein**. Environment variables save karne ke baad project ko redeploy karein, taaki Function unhe load kar sake.

## 5. Demo kaise chalayein

1. Website ka `Order online — demo` button ya `#order-demo` section kholein. Menu/rupee amounts sample hain, actual Sobha menu prices nahi.
2. `DEMO_ORDER_CODE` se match karta code, fictional naam/pata aur sample dishes use karke demo order submit karein.
3. Staff dashboard `/?staff=1` kholein aur `ADMIN_PASSWORD` se sign in karein.
4. Order ko ek-ek karke `Preparing food`, `On the way`, `Arrived`, phir `Delivered` par le jaayein. Har successful status save par backend Twilio ko SMS aur WhatsApp dono bhejne ki request karta hai.

Dashboard ka `Accepted by provider` status ka matlab Twilio ne request accept ki; yeh phone par message deliver/read hone ki guarantee nahi. Provider error ho to dashboard/API failure dikhayega; app jhootha success nahi dikhayegi.

## Local computer par backend test karna

`pnpm dev:static` sirf front-end preview chalata hai. Local API test ke liye Vercel CLI login/link aur `.env.local` mein upar ki valid settings chahiye; phir project root mein `pnpm.cmd dev:vercel` chalayein. `.env.local` ko ZIP/share/Git mein na daalein; `.gitignore` mein ignore hota hai.

## Official references

- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js) · [Vercel Functions quickstart](https://vercel.com/docs/functions/quickstart)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver) · [Neon/Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
- [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource) · [WhatsApp pricing](https://www.twilio.com/en-us/whatsapp/pricing)


## Vercel Drop ke baare mein

Signed-in Vercel account se framework project folder drop karke Vercel se framework build karaya ja sakta hai; kisi existing project par updated folder drop karne ke liye account zaroori hai. Root `api/index.ts` Vercel ke documented shared Fetch-handler pattern par bana hai. Isliye frontend aur backend isi project ke ek `/api` function se baat karte hain. [Vercel Drop](https://vercel.com/docs/drop) · [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
