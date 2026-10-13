# 🎯 Game Edukasi AR: Tembak Tangan

Game pembelajaran interaktif berbasis Augmented Reality (AR) dan kecerdasan visual menggunakan **MediaPipe Hands** untuk mendeteksi gestur tangan secara *real-time* melalui webcam.

Dirancang khusus untuk materi pelajaran **Bahasa Indonesia Kelas 8 SMP** (Topik: *Teks Iklan, Slogan, dan Poster*).

---

## 🚀 Fitur Utama

- 👆 **Kontrol Bidik Murni (Index Finger Pointer)**: Arahkan sasaran (*crosshair*) cukup dengan meluruskan jari telunjuk ke layar. Dilengkapi algoritma **Lerp (Linear Interpolation)** untuk pergerakan stabil tanpa getaran (*no jitter*).
- 🔫 **Mekanik Tembak Responsif**: Status siap (*ready*) saat ibu jari terangkat. Tembak instan (*BANG!*) cukup dengan menurunkan ibu jari ke bawah atau mengepalkan tangan sedikit. Angkat kembali ibu jari untuk *reload*.
- 👥 **Mode Permainan**:
  - **1 Pemain (Solo)**: Berlatih mandiri menjawab soal target dengan skor, nyawa (3 hati), dan timer mundur.
  - **2 Pemain (Duel / Split-Screen)**: Layar terbagi 2 dengan webcam transparan efek kaca bening, pemain bersaing menjawab soal acak secara adil.
- 📝 **Bank Soal & Pengaturan**: Tambah/edit soal kuis, atur timer per soal, atur skor per jawaban, serta fitur **Impor & Ekspor Soal ke format Microsoft Excel (.xlsx)** beserta templatenya.
- 🎵 **Sintesis Audio & Efek Visual**: Efek ledakan, getaran layar, dan suara tembakan/jawaban menggunakan Web Audio API mandiri tanpa ketergantungan file eksternal.
- 🔐 **Sistem Aktivasi**:
  - `TBKTG` : Membuka **Versi Penuh** (Mode 1 Pemain, Duel 2 Pemain, Bank Soal, dan Pengaturan).
  - `GRATIS` : Membuka **Mode Demo** (Hanya 1 Pemain).

---

## 🛠️ Teknologi yang Digunakan

- **React 19** & **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **MediaPipe Hands** (Deteksi 21 titik sendi tangan secara *real-time*)
- **Lucide React** (Ikon antarmuka)
- **SheetJS (xlsx)** (Impor & ekspor file template Excel)
- **Canvas Confetti** (Animasi selebrasi kemenangan)

---

## 💻 Panduan Menjalankan Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih tinggi
- Kamera / Webcam yang berfungsi baik

### Langkah-langkah:
1. **Clone repository ini**:
   ```bash
   git clone https://github.com/USERNAME_ANDA/NAMA_REPOSITORY.git
   cd NAMA_REPOSITORY
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```

4. **Buka di Browser**:
   Buka URL `http://localhost:3000` di Google Chrome, Microsoft Edge, atau browser modern lainnya. Berikan izin (*Allow*) akses kamera ketika diminta.

---

## 📤 Panduan Push ke Repository GitHub

Jika Anda mengunduh source code ini dan ingin mengunggahnya ke GitHub Anda sendiri:

1. Buat repository baru di [GitHub](https://github.com/new) (misal: `game-edukasi-tembak-tangan`).
2. Buka terminal di folder proyek ini, lalu jalankan:
   ```bash
   git init
   git add .
   git commit -m "feat: Game Edukasi AR Tembak Tangan v1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPOSITORY.git
   git push -u origin main
   ```

---

## 🌐 Deploy Gratis ke GitHub Pages

Proyek ini telah dikonfigurasi untuk mencegah kendala **tampilan blank (layar putih/kosong)** saat diaktifkan di GitHub Pages. Anda dapat memilih salah satu dari 2 metode di bawah:

### Metode 1: Menggunakan GitHub Actions (Sangat Disarankan ⭐)
1. Buka repository Anda di GitHub.
2. Masuk ke tab **Settings** > **Pages**.
3. Di bagian **Build and deployment** > **Source**, pilih **GitHub Actions** (bukan "Deploy from a branch").
4. Lakukan *push* ke branch `main`. Workflow `.github/workflows/deploy.yml` akan otomatis mem-build dan merilis game.

### Metode 2: Menggunakan Folder `/docs` (Langsung Aktif Tanpa Actions)
Jika Anda menggunakan opsi **"Deploy from a branch"**:
1. Jalankan `npm run build` di lokal (folder `docs/` sudah otomatis dibuatkan).
2. Push folder `docs/` ke GitHub:
   ```bash
   git add docs/
   git commit -m "build: perbarui rilis web di docs"
   git push origin main
   ```
3. Di GitHub: **Settings** > **Pages** > **Build and deployment**:
   - **Source**: Pilih **Deploy from a branch**
   - **Branch**: Pilih **main**
   - **Folder**: Pilih **/docs** (⚠️ *Jangan pilih /root karena browser tidak bisa menjalankan file .tsx mentah*)
   - Klik **Save**.

### 💡 Solusi Jika Sempat Mengalami Tampilan Blank di GitHub Pages:
- **Penyebab 1: Sumber Pages diset ke `/root`**: Ubah ke **GitHub Actions** atau ke folder **/docs**.
- **Penyebab 2: Masalah Cache Browser**: Tekan `Ctrl + F5` (atau `Cmd + Shift + R` di Mac) untuk membersihkan cache aset lama.
- **Penyebab 3: URL Tanpa Garis Miring**: Pastikan URL diakhiri dengan garis miring `/` (misal: `https://username.github.io/repo/`). Sistem kami telah menambahkan script *auto-redirect* otomatis untuk menangani ini.
- **Penyebab 4: Izin Kamera Webcam**: Pastikan memberi izin saat browser meminta akses kamera (*Allow Webcam*). Web harus diakses via protokol **HTTPS**.

---

## 📜 Lisensi
Dilisensikan di bawah [MIT License](LICENSE).
