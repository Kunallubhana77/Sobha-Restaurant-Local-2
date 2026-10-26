# Sobha Restaurant — Local Website

Yeh Sobha Restaurant website ka source-code package hai. Is folder mein source code, dependency lockfile, local images, Windows start helper aur Vercel deployment settings shamil hain. `node_modules` ZIP mein nahin hai; pehli baar dependencies install karni hongi.

## Windows par sabse aasaan tareeqa

1. ZIP extract karein.
2. Node.js 22 LTS install karein: [nodejs.org](https://nodejs.org/). Install ke baad VS Code/terminal band karke dobara kholen.
3. `Sobha-Restaurant-Local` folder kholkar `start-local-windows.bat` double-click karein. Agar `pnpm` nahin mila, neeche diya install command pehle chalayein.
4. Browser mein [http://localhost:3000](http://localhost:3000) kholen.
5. Server band karne ke liye Command Prompt mein `Ctrl+C` dabayen.

## Vercel par deploy karna — bina Git/terminal

1. ZIP extract karke uske andar ka `Sobha-Restaurant-Local` folder dhoondhein. Isi folder ke andar `vercel.json` aur `package.json` hone chahiye.
2. Apne Vercel account mein sign in karke [vercel.com/drop](https://vercel.com/drop) kholen.
3. **Choose folder** select karke `Sobha-Restaurant-Local` folder upload karein. ZIP ke bahar wala parent folder nahi, andar wala project folder chunein.
4. Project name/team chunein aur **Deploy** dabayein. Deploy successful hone par live URL milega. Yeh seedha production par publish hota hai.

`vercel.json` Vite framework, install command, `pnpm build:static` build command aur `dist/public` output folder set karta hai. Agar Vercel ye settings maange, Framework `Vite`, Install `pnpm install --frozen-lockfile`, Build `pnpm build:static`, aur Output Directory `dist/public` darj karein.

Baad mein website update karne ke liye updated project folder ko Vercel Drop par dobara upload karein, ya project ko Git repository se connect karke automatic deployments set karein.

## Food-order backend aur real SMS/WhatsApp

Site mein sample food order aur staff status dashboard hai. Real SMS aur WhatsApp tabhi jayenge jab Vercel mein Neon database aur Twilio credentials sahi add karke project redeploy hoga. Setup ke liye [`BACKEND_SETUP.md`](BACKEND_SETUP.md) follow karein. API keys, database URL, test phone aur staff password chat/source code mein share na karein.

`pnpm.cmd dev:static` sirf front-end preview hai; isse Vercel API/backend run nahi hota. Local backend test karne ke liye valid `.env.local`, Vercel CLI login/link, phir `pnpm.cmd dev:vercel` chahiye.

## PowerShell se chalana

PowerShell mein `npm.ps1` ya `pnpm.ps1` execution policy se block ho sakte hain. Policy badalne ki zaroorat nahin—commands mein `.cmd` istemal karein.

Agar `pnpm` install nahin hai:

```powershell
npm.cmd install --global pnpm@10.18.0
```

Phir project folder mein:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev:static
```

Browser mein `http://localhost:3000` kholen.

## Agar port 3000 unavailable ho

PowerShell mein port 3001 par chalayein:

```powershell
pnpm.cmd exec vite --host 127.0.0.1 --port 3001 --strictPort
```

Phir `http://localhost:3001` kholen.

## Build commands

```powershell
pnpm.cmd check
pnpm.cmd build:static
```

Build output `dist/public/` mein banta hai.

## Zaroori notes

- Food aur restaurant ki chhe images ZIP ke `client/public/images/` folder mein hain; dekhne ke liye Manus login ki zaroorat nahin.
- Fonts Google Fonts se online load hote hain; internet na ho to system fallback fonts use honge.
- Restaurant ka exact address/contact details abhi source mein nahin hain, isliye map placeholder dikhega.
- Reservation form filhaal demo hai; koi booking submit ya confirm nahin hoti.
- Aapke message mein actual menu items aur unke prices ki list nahin aayi; menu mein sample dishes aur `₹—` placeholders hain. List bhejenge to update ki ja sakti hai.
