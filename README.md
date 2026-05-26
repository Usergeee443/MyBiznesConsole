# MyBiznes Console

Nurmuxammad uchun shaxsiy biznes va moliya boshqaruv tizimi.

## Bizneslar

- **Nur&Garden** — oziq-ovqat mahsulotlari (savdo, mijoz, qarz, analitika)
- **Osco Holding** — Wedy (pauzada) va ArenaTop (stadion bron, kunlik statistika)
- **Shaxsiy moliya** — xarajatlar, jamg'armalar, boshqa daromad

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda oching: [http://localhost:3000](http://localhost:3000)

Ma'lumotlar `data/biznes.db` faylida saqlanadi (SQLite).

## Telegram bot

1. [@BotFather](https://t.me/BotFather) dan bot yarating va token oling
2. [@userinfobot](https://t.me/userinfobot) dan o'z Telegram ID ingizni oling
3. `.env.local` fayl yarating:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_OWNER_ID=your_telegram_user_id
```

4. **Lokal (polling):**
```bash
npm run bot
```

5. **Production (webhook):** server ishga tushgach:
```
GET https://your-domain.com/api/telegram/setup
```

Botda `/start` yuboring — barcha funksiyalar tugmalar orqali ishlaydi.

## Render deploy

Batafsil: [DEPLOY.md](./DEPLOY.md)

```bash
# Render Dashboard → New → Blueprint → GitHub repo
# render.yaml avtomatik ishlaydi
```

## Bo'limlar

| Sahifa | Vazifa |
|--------|--------|
| Bosh sahifa | Umumiy balans, kartalar, so'nggi tranzaksiyalar |
| Nur&Garden | Mahsulot, mijoz, savdo, qarz, analitika |
| Osco | ArenaTop kunlik statistika va grafiklar |
| Moliya | Daromad/xarajat, biznes va shaxsiy hisoblar |
| Jamg'armalar | Oylik % ajratish (xavfsizlik, xarid, o'yin, biznes) |

## Tez xarajat

Har qaysi sahifada o'ng pastdagi **qizil minus (-)** tugmasi — taksi, ovqat va boshqa shaxsiy xarajatlarni tez yozish.

## ArenaTop

Har kuni "Bugungi statistika" orqali stadion, foydalanuvchi va bron sonini kiriting. Har bron uchun avtomatik **2 890 so'm** komissiya hisoblanadi.

## Jamg'armalar

Har oy "Ajratish" tugmasi bilan daromaddan foiz ajratiladi:
- Xavfsizlik: 10%
- Katta xaridlar: 15%
- O'yin-kulgi: 5%
- Biznes rivojlantirish: 10%
