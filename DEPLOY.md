# Render Web Service — deploy qo'llanmasi

Blueprint kerak emas. Quyidagi qadamlarni Render Dashboard da bajaring.

---

## 1. GitHub ga yuklash

```bash
cd /Users/nurmuhammad/Desktop/mybiznesconsole
git add .
git commit -m "Render Web Service deploy"
git push origin main
```

> `.env` fayl GitHub ga **kirmasligi** kerak (`.gitignore` da bor).

---

## 2. Render da Web Service yaratish

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. GitHub repongizni ulang → `mybiznesconsole` ni tanlang
3. Quyidagi sozlamalarni kiriting:

| Maydon | Qiymat |
|--------|--------|
| **Name** | `mybiznes-console` |
| **Region** | Frankfurt (yoki yaqin) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Starter** (disk uchun kerak) |

4. **Advanced** → **Health Check Path**: `/api/health`

5. **Create Web Service** — hali deploy qilmang, avval disk va env qo'shing.

---

## 3. Doimiy disk (SQLite uchun)

Servis yaratilgach:

1. Chap menyu → **Disks** → **Add Disk**
2. Sozlamalar:

| Maydon | Qiymat |
|--------|--------|
| **Name** | `biznes-data` |
| **Mount Path** | `/var/data` |
| **Size** | 1 GB |

3. **Save** — servis qayta deploy bo'ladi.

---

## 4. Environment Variables

**Environment** bo'limiga qo'shing:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.19.0` |
| `DATABASE_PATH` | `/var/data/biznes.db` |
| `NPM_CONFIG_BUILD_FROM_SOURCE` | `true` |
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `TELEGRAM_OWNER_ID` | @userinfobot dan ID |
| `TELEGRAM_WEBHOOK_SECRET` | Ixtiyoriy maxfiy so'z (masalan: `my_secret_abc123`) |

`RENDER_EXTERNAL_URL` Render **avtomatik** qo'yadi — qo'lda kiritish shart emas.

---

## 5. Deploy

**Manual Deploy** → **Deploy latest commit** (yoki avtomatik boshlanadi).

Birinchi build **5–15 daqiqa** davom etishi mumkin (`better-sqlite3` compile).

Deploy **Live** bo'lgach URL:  
`https://mybiznes-console.onrender.com`

---

## 6. Telegram webhook

Brauzerda oching (o'z URL ingiz bilan):

```
https://mybiznes-console.onrender.com/api/telegram/setup
```

Javobda `"ok": true` bo'lsa — bot tayyor.

Telegramda botingizga `/start` yuboring.

---

## 7. Tekshirish

| URL | Kutilgan natija |
|-----|-----------------|
| `/api/health` | `{"ok":true,"service":"mybiznes-console"}` |
| `/` | Bosh sahifa ochiladi |
| `/api/telegram/setup` | Webhook o'rnatilgan |

---

## Xarajat

- **Starter Web Service:** ~$7/oy
- **Disk 1 GB:** ~$0.25/oy
- **Jami:** taxminan **$7–8/oy**

Renderda Node web servis uchun bepul plan yo'q.

---

## Muammolar

### Build xato (`better-sqlite3`)
- `NPM_CONFIG_BUILD_FROM_SOURCE=true` qo'shilganini tekshiring
- `NODE_VERSION=20.19.0` bo'lsin

### Sahifa ochilmaydi
- Logs → **Deploy** tabini ko'ring
- `npm start` Start Command da ekanini tekshiring

### Bot javob bermaydi
1. `TELEGRAM_BOT_TOKEN` va `TELEGRAM_OWNER_ID` to'g'riligini tekshiring
2. `/api/telegram/setup` ni qayta oching
3. Telegramda `/start`

### Ma'lumotlar yo'qoladi
- Disk mount: `/var/data`
- `DATABASE_PATH=/var/data/biznes.db`
- Disk **Disks** bo'limida ulangan bo'lsin

### Servis uxlab qoladi (Starter)
- Birinchi so'rov 30–60 soniya kutishi mumkin
- Doimiy ish uchun yuqori plan yoki boshqa hosting kerak

---

## Blueprint haqida

Repoda `render.yaml` bor — **Web Service orqali deploy qilsangiz uni e'tiborsiz qoldiring**. Keyinroq Blueprint ga o'tish mumkin.
