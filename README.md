# v4ray — Smart Config Selector (Web MVP)

یک ابزار وب برای **تست و رتبه‌بندی کانفیگ‌های VPN** (بدون اتصال). کاربر یک دکمه می‌زند →
سیستم کانفیگ‌ها را تست می‌کند → لیست کانفیگ‌های سالم و کم‌پینگ، مرتب‌شده از بهترین به بدترین
نمایش داده می‌شود → کاربر کانفیگ را کپی / QR / دانلود می‌کند.

دقیقاً طبق اصل محصول: «یک دکمه بزن → لیست بهترین کانفیگ‌های سالم و کم‌پینگ رو بگیر». هیچ
اتصالی از مرورگر برقرار نمی‌شود.

## معماری

```
Frontend (React + TS + Zustand + Tailwind + qrcode.react)
   │  REST (/api/scan) + WebSocket (/ws) — پیشرفت زنده
   ▼
Backend  (Node.js + Express + ws)
   Fetch Sources → Parse → Dedup → Validate → Test → Score → Rank
   ▼
تست: اتصال TCP واقعی + سنجش Latency (Xray core در صورت حضور، وگرنه TCP fallback)
```

- تست همیشه سمت **Backend** انجام می‌شود (مرورگر به socket خام دسترسی ندارد).
- Xray Core در صورت موجود بودن به‌عنوان موتور تست استفاده می‌شود؛ در غیاب آن، تست با
  اتصال TCP واقعی و اندازه‌گیری RTT انجام می‌شود.
- **Scoring**: `Latency × 70% + Success × 30%`
- پروتکل‌ها: VLESS, VMess, Trojan, Shadowsocks, Hysteria2

## اجرا

```bash
npm install

# development (backend روی 8787 + frontend روی 5173، با proxy)
npm run dev

# production build
npm run build

# فقط backend
npm start
```

پس از `npm run dev` مرورگر را در `http://localhost:5173` باز کنید.

## صفحات

1. **Home** — دکمه «Find Best Configs» + خلاصه آخرین اسکن
2. **Testing** — پیشرفت زنده از طریق WebSocket
3. **Result** — لیست رتبه‌بندی‌شده (Top N) با Copy / QR / Download + فیلتر Protocol و سورت
4. **Settings** — Timeout، تعداد کانفیگ، Top N، فیلتر Protocol

سورس‌ها: `server/sources.ts` (URL های خام GitHub).
