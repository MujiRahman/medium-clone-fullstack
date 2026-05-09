PRODUCT REQUIREMENTS DOCUMENT (PRD) - MASTER VERSION
Project Name: Medium Clone (Enterprise Grade)
Platform: Web Application
Architecture: Client-Server (Decoupled Frontend & Backend)

1. TECH STACK SPECIFICATIONS (LATEST VERSIONS)
Frontend Environment:

Framework: Next.js 16 (Strictly App Router, Turbopack, React 19).

Language: TypeScript (Strict mode).

Styling: Tailwind CSS + Radix UI (untuk komponen accessible / a11y).

State Management: Zustand (Client state) & SWR / React Query (Server state).

Rich Text Editor: TipTap (Headless, dirender ke JSON/HTML).

Backend Environment:

Language: Go (Golang) 1.26.

Framework: Gin-Gonic atau Fiber.

Authentication: JWT (Stateless, disimpan di HttpOnly, Secure, SameSite=Strict Cookies).

Database & Caching:

Primary: PostgreSQL.

Caching: Redis (Rate limiting, session, real-time claps).

2. SYSTEM ARCHITECTURE & DATA FLOW
Decoupled System: Frontend (Next.js) dan Backend (Go) berjalan sebagai dua servis yang sepenuhnya terpisah. Backend murni bertindak sebagai REST API yang memproduksi dan mengonsumsi JSON.

Rendering Strategy: Frontend bertanggung jawab penuh atas UI/UX. Pengambilan data publik (seperti Home Page) memanfaatkan Server Components dan Parallel Fetching di Next.js untuk meminimalkan waktu load dan memaksimalkan SEO.

Authentication Flow: Menggunakan pola Stateless JWT. Setelah login berhasil, Backend men-set token langsung ke HttpOnly Cookies. Frontend tidak pernah menyimpan token di localStorage.

3. PAGE ROUTING & UI REQUIREMENTS (SITEMAP)
/ (Home Page / Feed): Menampilkan daftar artikel terbaru/trending. Wajib implementasi Infinite Scroll dengan Server-Side Rendering awal.

/register & /login (Auth Pages): Form autentikasi dengan validasi Client-Side (Zod/Yup) dan Server-Side.

/new-story (Drafting / Editor Page): Protected Route. Implementasi TipTap editor dengan fitur auto-save secara periodik (disimpan sebagai status: draft).

/[username] (User Profile): Menampilkan detail user (Avatar, Bio) dan daftar artikel yang dipublikasikan oleh user tersebut.

/[username]/[slug] (Story Detail Page): Halaman baca artikel utuh. Terdapat interaksi: Tombol Clap, Share, dan daftar Komentar.

/search (Search Page): Halaman pencarian global (Artikel atau User).

4. HIGH-LEVEL DATABASE SCHEMA (PostgreSQL)
Implementasi menggunakan Go ORM (seperti GORM) atau SQL raw:

users: id (UUID, PK), username (Unique, Index), email (Unique), password_hash, bio, created_at, updated_at.

stories: id (UUID, PK), author_id (FK to users), title, slug (Unique, Index), content (JSONB/Text), status (Enum: 'draft', 'published'), published_at.

claps: id (UUID, PK), user_id (FK), story_id (FK), count (Int, max 50).

comments: id (UUID, PK), story_id (FK), user_id (FK), body (Text), created_at.

5. API ROUTING (VERSIONLESS & BACKWARD COMPATIBLE)
Semua endpoint tidak menggunakan prefix versi (/v1/). Struktur balikan (response) di masa depan harus bersifat aditif agar kompatibel dengan frontend versi lama.

Auth: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout

Users: GET /api/users/:username, PUT /api/users/:username

Stories:

GET /api/stories (Feed/List dengan paginasi & filter)

GET /api/stories/:slug (Detail artikel)

POST /api/stories (Create draft)

PUT /api/stories/:id (Update/Publish)

POST /api/stories/:id/clap (Clap action)

6. SEO, PERFORMANCE & ACCESSIBILITY (A11Y)
SEO & Metadata (Next.js 16):

Gunakan generateMetadata untuk Dynamic Metadata (Title, Description).

Implementasi Open Graph (OG) dan Twitter Cards.

Wajib generate JSON-LD Schema.org (tipe Article & Person) di halaman membaca untuk Google Rich Snippets.

Otomatisasi sitemap.xml dan robots.txt dinamis.

Performance (Core Web Vitals):

Optimasi gambar wajib menggunakan next/image (WebP/AVIF auto-format, lazy loading).

Prefetching cerdas saat kursor hover ke tautan menggunakan <Link> Next.js.

Accessibility (a11y):

HTML Semantik yang ketat (<main>, <article>, dll).

Hirarki Heading yang benar (H1 hanya satu per halaman).

Wajib memiliki keyboard navigability dan atribut aria-label untuk komponen interaktif.

7. SOFTWARE ENGINEERING STANDARDS
Clean Architecture (Backend): Pisahkan kode menjadi Handler/Controller -> Service/Usecase -> Repository. Gunakan Dependency Injection.

Unit Testing (100% Coverage Target for Core Logic):

Go: Gunakan testing package, testify, dan sqlmock. Wajib tes API dan Service.

Next.js: Gunakan Jest dan React Testing Library (RTL) untuk komponen UI (terutama Editor & interaksi).

Security Guidelines:

Sanitasi XSS pada output HTML dari TipTap.

Backend wajib menggunakan Prepared Statements (cegah SQL Injection).

Implementasi Rate Limiting via Redis di middleware Go.

Error Handling & Logging:

Struktur JSON error seragam (misal: {"error": true, "message": "...", "code": 404}).

Gunakan structured logging (slog atau zap) di Go.

8. CI/CD & GITHUB DEPLOYMENT
Otomatisasi menggunakan GitHub Actions:

PR Pipeline: Run Linter (ESLint & golangci-lint), Run Security Audit, Run Unit Tests (Frontend & Backend). Gagal di tahap ini memblokir proses Merge.

Deployment Pipeline: Membangun Docker Images baru saat merge ke main, mendorong ke Container Registry, dan memicu re-deployment otomatis.