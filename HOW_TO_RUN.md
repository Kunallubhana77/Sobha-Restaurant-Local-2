# Sobha Restaurant Demo - Chalane Ke Steps

Is project ko chalane ke liye sirf **Node.js** chahiye (bina kisi external database ya paid API ke pura project locally chalega).

---

## 1. Prerequisites (Pehle Ye Check Karein)
- Apke computer mein **Node.js (v18 ya v20+)** install hona chahiye.
- Agar install nahi hai to yahan se download karke install karein:
  👉 https://nodejs.org/ (LTS version)

---

## 2. Project Run Karne Ka Tarika

### Tarika A: 1-Click Launch (Sabse Aasan)
- **Windows Users:**
  Sirf `start-local-windows.bat` file par **Double-Click** karein!
  (Ye apne aap pnpm aur dependencies install karke website start kar dega).

- **Mac / Linux Users:**
  Terminal mein project folder ke andar ye command chalayein:
  ```bash
  ./start-local-mac.sh
  ```

---

### Tarika B: Terminal / Command Prompt Se Run Karna
Agar manually chalana chahte hain:

1. Terminal ya Command Prompt kholein aur project folder mein jayein:
   ```bash
   cd "Sobha-Restaurant-Local 2"
   ```

2. Agar pnpm install nahi hai to install karein:
   ```bash
   npm install -g pnpm
   ```

3. Dependencies install karein:
   ```bash
   pnpm install
   ```

4. Server start karein:
   ```bash
   pnpm dev
   ```

5. Browser kholein aur link open karein:
   👉 **http://localhost:3000**

---

## 3. Important Passwords & Demo Details

- **Website URL:** http://localhost:3000
- **Demo Order Code (Food Order karne ke liye):** `SobhaDemo2026!`
- **Staff Dashboard Password:** `AdminSobha2026!`
  (URL: http://localhost:3000/staff)

---

## 4. Features jo isme include hain:
1. **Table Reservation with Live Waiting Timer:**
   - Table book karne ke baad 45-second ka real-time animated countdown chalta hai.
   - Time khatam hone par audio chime aur "Table Ready" alert aata hai.
   - Quick test karne ke liye "⚡ Fast-Forward" button bhi diya hua hai.
   - Duplicate Booking Protection: Ek hi user same time aur date par double table book nahi kar sakta.

2. **Food Order Tracker:**
   - Food order karne par real-time 4-step pipeline dikhai deti hai (Received -> Preparing -> On the Way -> Delivered).
   - Saara data automatically server par `data/orders.json` mein save hota hai.

3. **100% Local:** Koi paid API ya database setup nahi chahiye. Sab kuch local files mein run hota hai.
