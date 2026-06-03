# Render Web Service — production deploy

**Tavsiya:** Render da `MYSQL_*` o'zgaruvchilarini to'ldiring — ma'lumotlar uzoq muddatli MySQL serverda saqlanadi (redeploy da yo'qolmaydi).

MySQL bo'lmasa: vaqtinchalik SQLite (`data/biznes.db`) — bepul rejimda redeploy da ma'lumotlar yo'qolishi mumkin.

---

## 1. GitHub ga yuklash

```bash
git add .
git commit -m "Render deploy — disk siz"
git push origin main
```

---

## 2. Render da Web Service

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. GitHub repongizni ulang
3. Sozlamalar:

| Maydon | Qiymat |
|--------|--------|
| **Name** | `mybiznes-console` |
| **Region** | Frankfurt |
| **Runtime** | Node |
| **Instance Type** | **Free** |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

**Disk qo'shmang** — kerak emas.

---

## 3. Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.19.0` |
| `NPM_CONFIG_BUILD_FROM_SOURCE` | `true` |
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `TELEGRAM_OWNER_ID` | @userinfobot ID |
| `TELEGRAM_WEBHOOK_SECRET` | ixtiyoriy maxfiy so'z |

MySQL ishlatmoqchi bo'lsangiz (sizning server):

| Key | Value |
|-----|-------|
| `MYSQL_HOST` | `146.103.126.207` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_USER` | `phpmyadmin` |
| `MYSQL_PASSWORD` | server paroli |
| `MYSQL_DATABASE` | `mybiznesconsole` |
| `MYSQL_SSL` | `false` (yoki hosting talabiga ko'ra `true`) |

**Muhim:** `DATABASE_PATH` **qo'shmang** yoki o'chiring.  
Agar oldin `/var/data/biznes.db` qo'ygan bo'lsangiz — **o'chirib tashlang**.

**MySQL yoqilganda** (`MYSQL_*` to'ldirilsa): jadvallar avtomatik yaratiladi va seed ma'lumotlar yoziladi. `/api/health` da `database: "mysql"` ko'rinadi.

**MySQL yoqilmaganida:** DB `data/biznes.db` (SQLite, Render da vaqtinchalik).

---

## 4. Deploy

**Manual Deploy** → **Deploy latest commit**

URL: `https://mybiznes-console.onrender.com`

---

## 5. Telegram webhook

Deploy tugagach brauzerda:
```
https://SIZNING-SERVIS.onrender.com/api/telegram/setup
```

Telegramda `/start`.

---

## Bepul rejim cheklovlari

| Cheklov | Tushuntirish |
|---------|--------------|
| Uxlab qoladi | 15 daqiqa faolsizlikdan keyin to'xtaydi, birinchi so'rov sekin |
| Ma'lumotlar | Redeploy da yangi DB (disk yo'q) |
| Resurs | CPU/RAM cheklangan |

Keyinroq ma'lumotlarni doimiy saqlash uchun Render **Disk** ($) yoki Oracle Cloud (bepul VPS) ishlatish mumkin.

---

## Muammolar

### Build xato (`@tailwindcss/postcss`)
Build paketlari `dependencies` da — push qiling va qayta deploy.

### Build xato (`mkdir '/var/data'`)
`DATABASE_PATH` ni Environment dan **o'chiring**. Yangi kodni push qiling.

### Build xato (`better-sqlite3`)
`NPM_CONFIG_BUILD_FROM_SOURCE=true` va `NODE_VERSION=20.19.0`

### Bot javob bermaydi
`/api/telegram/setup` oching, keyin `/start`

### Ma'lumotlar yo'qoladi
Bepul rejimda normal — redeploy yangi DB yaratadi. Doimiy saqlash uchun keyinroq disk qo'shing.

### MySQL ulanishni tekshirish
`/api/health` javobida:
- `mysql: "ok"` bo'lsa ulanish bor
- `database: "mysql"` ko'rinsa tizim MySQL ni ko'ryapti
