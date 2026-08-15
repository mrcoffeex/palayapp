# PalayUP

Farm-to-buyer marketplace with prescribed pricing, order queues, and a role-based AI assistant. There is **no in-app payment** — buyers receive the farmer’s location and contact details and arrange pickup or delivery directly.

## Roles

| Role | Surface | What they do |
| --- | --- | --- |
| **Admin** | Web console | Track users, farmers, buyers, products, guide prices, orders, chat, notifications, and settings. Upload average market prices as a buying guide. |
| **Farmer (merchant)** | Mobile app | List produce, chat with buyers, and **manage a live order queue** with status tracking. |
| **Buyer** | Mobile app | Browse listings against admin guide prices, place orders, chat with farmers, and track status. |

## Brand

Dark green `#0B3D2E`, leaf green `#52B788`, pale green `#E8F6EE`, white.

## Database

MySQL on **port 3307** (DBngin-compatible). Connection lives in `server/.env`:

```
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=palayapp
```

On startup the API creates the `palayapp` database, tables, and demo seed if they do not exist yet.

## Run locally

```bash
cd palayapp
npm install
npm run install:all
npm run dev
```

- Web / apps: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:4000](http://localhost:4000)

### Open on other devices on the same network

The client and API listen on all network interfaces. After `npm run dev`, Vite prints a **Network** URL. On a phone or another computer on the same Wi‑Fi, open:

`http://<your-computer-ip>:5173`

The terminal also prints the API LAN address (`http://<your-computer-ip>:4000`). Use the Vite URL for the app — `/api` and `/uploads` are proxied automatically.

If another device cannot connect, allow incoming connections for Node/Vite in macOS Firewall (System Settings → Network → Firewall).

On a desktop browser, farmer and buyer views render inside a phone frame. On a phone, they fill the screen.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@palayapp.com` | `Admin@123` |
| Farmer | `rosa@palayapp.com` | `Farmer@123` |
| Buyer | `ana@palayapp.com` | `Buyer@123` |

Other farmers: `juan@`, `maria@`, `pedro@` (same farmer password). Other buyers: `carlo@`, `lisa@` (same buyer password).

## Order flow

`queued → confirmed → preparing → ready → completed`

Farmers reorder the queue and advance status. Admins can inspect and override. Buyers see a timeline plus the farmer’s phone and farm address.

## AI assistant

Each role has a floating **Assistant** trained on that role’s tasks (pricing guides, queue management, contacting farmers, platform stats). It answers from live app data — no API key required.
