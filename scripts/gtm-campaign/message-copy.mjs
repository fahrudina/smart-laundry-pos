/**
 * GTM campaign copy — email + WhatsApp.
 *
 * ⚠️ DRAFT — REVIEW AND EDIT BEFORE ANY LIVE RUN.
 * This is a first pass written to match the warm, informal Indonesian tone
 * already used in src/integrations/whatsapp/templates.ts. Nothing gets sent
 * until you've read this file and are happy with the wording.
 *
 * Placeholders available: {{name}}, {{email}}
 */

export const emailSubject = '🚀 Sekarang Tersedia di Android + Mode Offline — Kabar Baru dari Smart Laundry POS';

export const emailText = `Halo {{name}} 👋

Terima kasih sudah mempercayai Smart Laundry POS untuk membantu mengelola usaha laundry Anda.

Kami ingin berbagi kabar baik: platform ini terus kami kembangkan supaya makin memudahkan operasional harian Anda — mulai dari pencatatan pesanan dan pembayaran, sampai notifikasi otomatis ke pelanggan lewat WhatsApp.

Beberapa hal yang bisa Anda coba sekarang:
- 📱 Sekarang tersedia juga sebagai aplikasi Android — install langsung di HP untuk akses lebih cepat
- 🔌 Mendukung mode offline — tetap bisa catat pesanan walau koneksi internet putus, data otomatis sinkron begitu online kembali
- Kelola pesanan dan pembayaran dari satu tempat
- Kirim notifikasi otomatis ke pelanggan (pesanan masuk, selesai, siap diambil)
- Pantau performa toko lewat dashboard

Kalau ada masukan, kendala, atau ide fitur yang Anda butuhkan, balas saja email ini — kami senang mendengar dari Anda.

Semoga usahanya makin lancar dan berkah selalu! 🙏😊

Salam hangat,
Tim Smart Laundry POS`;

export const emailHtml = `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
  <p>Halo {{name}} 👋</p>
  <p>Terima kasih sudah mempercayai <strong>Smart Laundry POS</strong> untuk membantu mengelola usaha laundry Anda.</p>
  <p>Kami ingin berbagi kabar baik: platform ini terus kami kembangkan supaya makin memudahkan operasional harian Anda — mulai dari pencatatan pesanan dan pembayaran, sampai notifikasi otomatis ke pelanggan lewat WhatsApp.</p>
  <p><strong>Beberapa hal yang bisa Anda coba sekarang:</strong></p>
  <ul>
    <li>📱 Sekarang tersedia juga sebagai aplikasi Android — install langsung di HP untuk akses lebih cepat</li>
    <li>🔌 Mendukung mode offline — tetap bisa catat pesanan walau koneksi internet putus, data otomatis sinkron begitu online kembali</li>
    <li>Kelola pesanan dan pembayaran dari satu tempat</li>
    <li>Kirim notifikasi otomatis ke pelanggan (pesanan masuk, selesai, siap diambil)</li>
    <li>Pantau performa toko lewat dashboard</li>
  </ul>
  <p>Kalau ada masukan, kendala, atau ide fitur yang Anda butuhkan, balas saja email ini — kami senang mendengar dari Anda.</p>
  <p>Semoga usahanya makin lancar dan berkah selalu! 🙏😊</p>
  <p>Salam hangat,<br/>Tim Smart Laundry POS</p>
</div>`;

export const whatsappMessage = `Halo {{name}} 👋

Ini tim Smart Laundry POS. Kami baru saja mengirim email ke {{email}} berisi kabar terbaru seputar platform yang Anda gunakan untuk usaha laundry.

Oh iya, sekarang Smart Laundry POS juga sudah tersedia sebagai aplikasi Android 📱 dan mendukung mode offline 🔌 — tetap bisa dipakai catat pesanan walau internet lagi putus.

Kalau belum sempat cek email, boleh diintip ya — ada info fitur yang mungkin bermanfaat buat operasional toko Anda 🧺✨

Semoga usahanya makin lancar dan selalu diberi kesehatan! 🙏😊

_Pesan ini dikirim otomatis dari Smart Laundry POS_`;
