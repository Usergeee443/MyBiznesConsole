# Render ga deploy (Blueprint)

## 1. GitHub ga yuklash

```bash
git init
git add .
git commit -m "MyBiznes Console — Render deploy"
git remote add origin https://github.com/SIZNING_USERNAME/mybiznesconsole.git
git push -u origin main
```

## 2. Render Blueprint

1. [render.com](https://render.com) → **New** → **Blueprint**
2. GitHub repongizni ulang
3. `render.yaml` avtomatik aniqlanadi → **Apply**

## 3. Environment o'zgaruvchilar

Blueprint yaratishda so'raladi (yoki **Environment** bo'limida):

| O'zgaruvchi | Qiymat |
|-------------|--------|
| `TELEGRAM_BOT_TOKEN` | @BotFather token |
| `TELEGRAM_OWNER_ID` | @userinfobot ID |
| `TELEGRAM_WEBHOOK_SECRET` | Avtomatik (yoki o'zingiz) |

`DATABASE_PATH` va `RENDER_EXTERNAL_URL` avtomatik.

## 4. Telegram webhook

Deploy tugagach `postDeployCommand` webhook ni avtomatik o'rnatadi.

Qo'lda tekshirish:
```
https://SIZNING-SERVIS.onrender.com/api/telegram/setup
https://SIZNING-SERVIS.onrender.com/api/health
```

## 5. Tayyor

- **Veb:** `https://mybiznes-console.onrender.com`
- **Bot:** Telegramda `/start` — webhook orqali ishlaydi
- **Ma'lumotlar:** `/var/data/biznes.db` (doimiy disk, 1 GB)

## Muhim

- **Starter plan** kerak (disk uchun, ~$7/oy)
- Birinchi deploy 5–10 daqiqa davom etishi mumkin (`better-sqlite3` build)
- Lokal `npm run bot` faqat kompyuteringizda; productionda webhook ishlatiladi

## Muammo bo'lsa

- **Build xato:** Render loglarida `npm ci` ni tekshiring
- **Bot javob bermaydi:** `/api/telegram/setup` oching, keyin Telegramda `/start`
- **Ma'lumot yo'qoladi:** Disk `biznes-data` ulanganligini tekshiring
