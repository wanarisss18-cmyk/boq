# Project Tracker

Web App ติดตามงานของทีม แทนการส่งไฟล์ Excel ผ่าน LINE — ข้อมูลอยู่ที่เดียว ทุกคน Login ด้วยบัญชีตัวเอง และทุกการแก้ไขถูกบันทึกและย้อนกลับได้

**Stack:** SvelteKit 3 (SSR + form actions) · Tailwind 4 · shadcn-svelte · Drizzle ORM · Cloudflare D1 · Cloudflare Pages

## เริ่มใช้งาน

```bash
npm install
npm run db:setup   # สร้างตาราง + นำเข้าข้อมูลจาก Excel ลง D1 จำลองในเครื่อง (.wrangler/)
npm run dev        # http://localhost:5173
```

แอปใช้ D1 ทั้งในเครื่องและบน Cloudflare (`import { env } from 'cloudflare:workers'` ใน `src/lib/server/db/index.ts`)
ตอน `npm run dev` adapter จะจำลอง D1 ให้จาก `wrangler.toml`

### บัญชีทดสอบ (สำหรับ dev เท่านั้น — ตั้งไว้ใน `scripts/seed.ts`)

| บัญชี | อีเมล | รหัสผ่าน | สิทธิ์ |
|---|---|---|---|
| System Admin | admin@example.com | admin1234 | Admin |
| วิภา (หัวหน้าทีม) | vipa@example.com | password1234 | Admin |
| พนักงานคนอื่น | อีเมลตามชีต "ทีมงาน" เช่น nattawut@example.com | password1234 | พนักงาน |

## สคริปต์

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run db:seed [-- file.xlsx]` | อ่าน Excel → `local.db` (ไฟล์พัก) → สร้าง `data/seed.sql` |
| `npm run d1:migrate:local` / `d1:seed:local` | สร้างตาราง / ลงข้อมูลใน D1 จำลองในเครื่อง |
| `npm run d1:migrate:remote` / `d1:seed:remote` | เหมือนกันแต่ลง D1 จริงบน Cloudflare (**seed จะลบข้อมูลเดิมทั้งหมด**) |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่ใน `drizzle/` หลังแก้ schema |
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

## Deploy (Cloudflare Pages)

- `wrangler.toml` กำหนดโฟลเดอร์ผลลัพธ์ (`.svelte-kit/cloudflare`) และ binding `DB` → D1 `boq-db`
- ตั้งค่า Pages: **Build command** `npm run build` · Node ใช้ 22 จากไฟล์ `.node-version`
- เมื่อแก้ schema: `npm run db:generate` แล้ว `npm run d1:migrate:remote`

> Node v26 ทำให้ `npm run build` segfault ใน Vite/rolldown — ให้ build ด้วย Node 22 (ทดสอบแล้วผ่าน)
