# Medium Clone API (Backend) - DevOps & Operational Guide

Repositori ini menyimpan infrastruktur Backend Golang dengan arsitektur Clean Architecture untuk sistem Medium Clone. Dokumen ini menjabarkan instruksi eksekusi lokal dan prosedur pengujian.

## 1. Environment Variables (`.env`)
Salin kerangka (template) di bawah ini lalu tempatkan ke dalam sebuah file bernama `.env` di dalam folder `backend/`:

```env
# Database Credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=medium_user
DB_PASSWORD=medium_password
DB_NAME=medium_clone

# Redis Connection (Opsional saat ini)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Config (Wajib!)
PORT=8080
JWT_SECRET=super_secret_jwt_key_ubah_ini_di_production
```

> **Catatan**: Aplikasi menggunakan prinsip *Fail-Fast*. Jika `JWT_SECRET` tidak ada saat aplikasi menyala, *server* otomatis menolak hidup (panik `log.Fatalf`).

## 2. Menyalakan Infrastruktur Database (Docker Compose)
Untuk menjalankan PostgreSQL dan Redis lokal sebagai Daemon (Background):
1. Buka terminal di direktori induk (root di mana file `docker-compose.yml` berada).
2. Jalankan perintah eksklusif:
   ```bash
   docker-compose up -d db redis
   ```
3. Docker akan mengunduh _images_ dan meluncurkan *Database* di port `5432`.

## 3. Menjalankan Unit Testing & Coverage
Infrastruktur servis Golang kita sudah sepenuhnya dilapisi modul Unit Testing berbasis `httptest` dan `sqlmock`. 
Ke direktori `backend/` dan jalankan:

- **Satu kali test keseluruhan**:
  ```bash
  go test -v ./...
  ```
- **Mengukur Persentase Cakupan (*Coverage*)**:
  ```bash
  go test -v -coverprofile=coverage.out ./...
  go tool cover -html=coverage.out
  ```
  *(Perintah baris kedua bermaksud akan membuka browser yang menyorot persis algoritma logic mana yang belum terjangkau).*

## 4. Melakukan Build Lokal (Kompilasi)
Apabila Anda sekadar ingin mem-build kode *Go* mentah-mentah ke rupa *.exe* / *binary*:
```bash
cd backend
go build -o medium_api cmd/api/main.go

# Menjalankan binary-nya langsung:
./medium_api
```

## 5. Menjalankan Backend Sepenuhnya via Docker
Jika lebih nyaman menggunakan _containerization_ murni tanpa harus menginstal Golang:
1. Pastikan isi parameter `CMD` di `backend/Dockerfile` aslinya (yang mulanya berbunyi `tail -f /dev/null`) sudah diubah menunjuk ekseksekusi Go:
   ```dockerfile
   # (Hapus CMD tail tersebut, dan gunakan yang ini:)
   RUN CGO_ENABLED=0 GOOS=linux go build -o /api cmd/api/main.go
   EXPOSE 8080
   CMD ["/api"]
   ```
2. Dari direktori akar (root):
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## 6. Panduan Setup Postman & Token (Cookies)
Backend menggunakan standar keamanan tinggi berupa penyisipan JSON Web Token langsung di tubuh respons Cookie berbasis **HttpOnly** dan **SameSite=Strict** guna memusnahkan eksploitasi jenis *XSS attack*. Otomatisasi pada Postman:
1. Hit/Kirim endpoint **Auth > Login**.
2. Bila akun ditemukan (Kredensial OK), Postman **secara otomatis** akan menangkap set *Headers* `Set-Cookie` dan mengarsipkan ke kotak brankas *Cookies* miliknya.
3. Saat Anda mengarahkan kursor/hit endpoint berlabel *Protected* (seperti `POST /api/stories`), Postman akan dengan sendirinya menempelkan token cookie itu secara mandiri di belakang layar.
4. Anda dapat melihat Cookies yang tertangkap dengan mengeklik tab teks **"Cookies"** kecil berwarna abu-abu yang ada di bawah tombol *Send* Postman Anda.
