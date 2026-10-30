# Project Tracker

Web App ติดตามงานของทีม แทนการส่งไฟล์ Excel ผ่าน LINE — ข้อมูลอยู่ที่เดียว ทุกคน Login ด้วยบัญชีตัวเอง และทุกการแก้ไขถูกบันทึกและย้อนกลับได้

**Stack:** SvelteKit 3 (SSR + form actions) · Tailwind 4 · shadcn-svelte · Drizzle ORM · SQLite (libsql) → Cloudflare D1 · Cloudflare Pages

## เริ่มใช้งาน

```bash
npm install
npm run db:setup   # สร้างตาราง + นำเข้าข้อมูลจาก data/project_tracking_sample.xlsx
npm run dev        # http://localhost:5173
```

### บัญชีทดสอบ (สำหรับ dev เท่านั้น — ตั้งไว้ใน `scripts/seed.ts`)

| บัญชี | อีเมล | รหัสผ่าน | สิทธิ์ |
|---|---|---|---|
| System Admin | admin@example.com | admin1234 | Admin |
| วิภา (หัวหน้าทีม) | vipa@example.com | password1234 | Admin |
| พนักงานคนอื่น | อีเมลตามชีต "ทีมงาน" เช่น nattawut@example.com | password1234 | พนักงาน |

## สคริปต์

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run db:push` | สร้าง/อัปเดตตารางตาม schema |
| `npm run db:seed [-- file.xlsx]` | **ลบข้อมูลเดิมทั้งหมด** แล้วนำเข้าจาก Excel |
| `npm run db:generate` | สร้างไฟล์ SQL migration ใน `drizzle/` (ใช้กับ D1) |
| `npm run db:studio` | เปิด Drizzle Studio ดูข้อมูลในฐานข้อมูล |
| `npm run check` | ตรวจ type |

## สิทธิ์การใช้งาน

| | Admin | พนักงาน |
|---|---|---|
| Dashboard / Kanban / โปรเจกต์ / ประวัติ | ดูได้ทั้งหมด | ดูได้ทั้งหมด |
| แก้งาน | ทุกฟิลด์ ทุกงาน | เฉพาะงานของตัวเอง: สถานะ, %, ชั่วโมงจริง, หมายเหตุ |
| สร้าง/ลบ โปรเจกต์และงาน | ✓ | – |
| จัดการพนักงาน (เพิ่ม/แก้/ปิดใช้งาน/ลบ/รีเซ็ตรหัส) | ✓ | – |
| ย้อนกลับการแก้ไข | ทุกรายการ | เฉพาะงานตัวเอง ในฟิลด์ที่ตัวเองแก้ได้ |

## การนำเข้า Excel

| ชีต | นำเข้าเป็น |
|---|---|
| ทีมงาน | `users` — ตำแหน่ง "หัวหน้าทีม" ได้สิทธิ์ Admin |
| งานทั้งหมด → คอลัมน์ "ลูกค้า / โครงการ" | `projects` |
| งานทั้งหมด | `tasks` |
| ภาพรวม | ไม่นำเข้า — Dashboard คำนวณสดจากฐานข้อมูลแทน |

สถานะใน Excel มี 5 แบบ แอปใช้ 3 แบบ: ยังไม่เริ่ม → To do · กำลังดำเนินการ / รอตรวจ / ระงับ → Doing · เสร็จแล้ว → Done
(งานที่เคยเป็น "รอตรวจ" หรือ "ระงับ" จะมีป้าย `[รอตรวจ]` / `[ระงับ]` นำหน้าหมายเหตุ)
"เกินกำหนด" = ยังไม่ Done และเลยกำหนดส่งแล้ว เทียบกับวันนี้ตามเวลาไทย

## ย้ายไป Cloudflare D1 / Pages

1. `npx wrangler d1 create pm-db` แล้วเพิ่ม binding `DB` ใน `wrangler.toml`
2. `npm run db:generate` แล้ว `npx wrangler d1 migrations apply pm-db --remote`
3. ใน `src/lib/server/db/index.ts` เปลี่ยนจาก libsql เป็น `drizzle(platform.env.DB, { schema })` จาก `drizzle-orm/d1`
   (ส่ง `event.platform` เข้าไปผ่าน `hooks.server.ts`) — schema และ query อื่นใช้ได้เหมือนเดิม
4. รหัสผ่านใช้ PBKDF2 ผ่าน Web Crypto จึงรันบน Workers ได้เลย

> หมายเหตุ: บนเครื่องนี้ (Node v26) `npm run build` segfault ระหว่าง bundle ฝั่ง client ใน native code ของ Vite/rolldown
> ส่วน `npm run dev` ทำงานปกติ แนะนำให้ build ด้วย Node LTS (เช่น 22) — ยังไม่ได้ทดสอบ build บน Node เวอร์ชันนั้น
