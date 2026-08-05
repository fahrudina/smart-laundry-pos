import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  Zap,
  Receipt,
  MessageSquare,
  BarChart3,
  Store,
  Gift,
  Megaphone,
  Smartphone,
  ClipboardList,
  Globe,
  Wifi,
  Download,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';
import { WhatsAppFloatingButton } from '@/components/ui/WhatsAppFloatingButton';
import './LandingPage.css';

const FONT_LINK_ID = 'tk-landing-fonts';

/** Fixed-name release asset that release-android.yml re-publishes on every
 * tagged build, so this URL never has to be updated for new versions. */
const ANDROID_APK_URL =
  'https://github.com/fahrudina/smart-laundry-pos/releases/latest/download/smart-laundry-pos-latest.apk';

/** lucide-react has no Android glyph, so this is the standard bugdroid head
 * outline (Material Design Icons, Apache-2.0) — lets the download button
 * read as "Android app" at a glance instead of the generic Smartphone icon. */
const AndroidIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.61 15.15C16.15 15.15 15.77 14.78 15.77 14.32S16.15 13.5 16.61 13.5H16.61C17.07 13.5 17.45 13.86 17.45 14.32C17.45 14.78 17.07 15.15 16.61 15.15M7.41 15.15C6.95 15.15 6.57 14.78 6.57 14.32C6.57 13.86 6.95 13.5 7.41 13.5H7.41C7.87 13.5 8.24 13.86 8.24 14.32C8.24 14.78 7.87 15.15 7.41 15.15M16.91 10.14L18.58 7.26C18.67 7.09 18.61 6.88 18.45 6.79C18.28 6.69 18.07 6.75 18 6.92L16.29 9.83C14.95 9.22 13.5 8.9 12 8.91C10.47 8.91 9 9.24 7.73 9.82L6.04 6.91C5.95 6.74 5.74 6.68 5.57 6.78C5.4 6.87 5.35 7.08 5.44 7.25L7.1 10.13C4.25 11.69 2.29 14.58 2 18H22C21.72 14.59 19.77 11.7 16.91 10.14H16.91Z" />
  </svg>
);

/** Loads the ticket-stub type pair only while the landing page is mounted,
 * so authenticated app sessions never pay for this download. */
const useLandingFonts = () => {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const features = [
  {
    serial: '0231',
    icon: Zap,
    title: 'Input Order Super Cepat',
    description: 'Timbang, pilih layanan, cetak — antrian pagi tidak lagi menumpuk di meja kasir.',
  },
  {
    serial: '0454',
    icon: Receipt,
    title: 'Struk & e-Struk Otomatis',
    description: 'Setiap transaksi keluar dengan nota rapi, lengkap dengan berat dan rincian harga.',
  },
  {
    serial: '0512',
    icon: MessageSquare,
    title: 'Notifikasi WhatsApp Real-time',
    description: 'Pelanggan tahu persis kapan cucian siap diambil, tanpa mereka harus telepon dulu.',
  },
  {
    serial: '0687',
    icon: BarChart3,
    title: 'Dashboard Omzet & Laporan Harian',
    description: 'Uang masuk, kinerja outlet, dan jam sibuk terbaca dalam satu layar.',
  },
  {
    serial: '0733',
    icon: Store,
    title: 'Multi-outlet & Multi-kasir',
    description: 'Buka cabang kedua, ketiga, keempat — datanya tetap satu sistem, bukan satu buku per toko.',
  },
  {
    serial: '0810',
    icon: Gift,
    title: 'Smart Point untuk Pelanggan Loyal',
    description: 'Poin terkumpul otomatis tiap transaksi, jadi alasan pelanggan balik ke toko kamu lagi.',
  },
  {
    serial: '0902',
    icon: Megaphone,
    title: 'Broadcast Promo ke Pelanggan',
    description: 'Kirim info promo ke seluruh daftar pelanggan lewat WhatsApp, sekali klik.',
  },
];

const benefits = [
  'Dukungan manajemen multi-toko',
  'Pelacakan pesanan real-time',
  'Kalkulasi harga otomatis',
  'Sistem notifikasi pelanggan',
  'Manajemen inventori',
  'Pelaporan keuangan',
  'Tools manajemen staff',
  'Dukungan mode offline',
];

const comparisonRows: {
  feature: string;
  smart: 'yes';
  qasir: 'yes' | 'no' | 'partial';
  pawoon: 'yes' | 'no' | 'partial';
  majoo: 'yes' | 'no' | 'partial';
  note?: { qasir?: string; pawoon?: string; majoo?: string };
}[] = [
  {
    feature: 'Dioptimalkan untuk bisnis laundry',
    smart: 'yes',
    qasir: 'no',
    pawoon: 'no',
    majoo: 'no',
    note: { qasir: 'POS umum', pawoon: 'POS umum', majoo: 'POS umum' },
  },
  { feature: 'Input laundry cepat (per kg / item)', smart: 'yes', qasir: 'no', pawoon: 'no', majoo: 'no' },
  {
    feature: 'Struk + e-struk laundry',
    smart: 'yes',
    qasir: 'partial',
    pawoon: 'partial',
    majoo: 'partial',
    note: { qasir: 'Dasar', pawoon: 'Dasar', majoo: 'Dasar' },
  },
  {
    feature: 'Loyalty khusus laundry (Smart Point)',
    smart: 'yes',
    qasir: 'no',
    pawoon: 'no',
    majoo: 'yes',
    note: { majoo: 'Poin umum' },
  },
  { feature: 'Notifikasi WhatsApp otomatis', smart: 'yes', qasir: 'no', pawoon: 'no', majoo: 'no' },
  {
    feature: 'Broadcast promo pelanggan',
    smart: 'yes',
    qasir: 'partial',
    pawoon: 'partial',
    majoo: 'partial',
    note: { qasir: 'Manual', pawoon: 'Manual', majoo: 'Terbatas' },
  },
  { feature: 'Multi-outlet laundry', smart: 'yes', qasir: 'partial', pawoon: 'yes', majoo: 'yes' },
  { feature: 'Tracking status cucian', smart: 'yes', qasir: 'no', pawoon: 'no', majoo: 'no' },
  { feature: 'Antrean & label laundry', smart: 'yes', qasir: 'no', pawoon: 'no', majoo: 'no' },
  {
    feature: 'Harga ramah UMKM',
    smart: 'yes',
    qasir: 'yes',
    pawoon: 'no',
    majoo: 'no',
    note: { pawoon: 'Lebih mahal', majoo: 'Lebih mahal' },
  },
];

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Apakah Smart Laundry POS gratis digunakan?',
    answer:
      'Ya. Smart Laundry POS bisa langsung dipakai gratis tanpa kartu kredit dan tanpa kontrak jangka panjang. Setup awal toko hanya butuh sekitar 5 menit.',
  },
  {
    question: 'Apakah bisa dipakai tanpa koneksi internet?',
    answer:
      'Bisa. Smart Laundry POS mendukung mode offline sehingga input pesanan tetap jalan saat sinyal internet di toko sedang tidak stabil, lalu data tersinkron otomatis saat koneksi kembali.',
  },
  {
    question: 'Apakah mendukung laundry kiloan, satuan, dan kombinasi?',
    answer:
      'Mendukung ketiganya. Layanan kiloan dihitung dari berat (kg), layanan satuan dihitung per item (misalnya sepatu atau bed cover), dan layanan kombinasi menggabungkan berat sekaligus jumlah item dalam satu pesanan.',
  },
  {
    question: 'Bisakah dipakai untuk lebih dari satu cabang atau outlet laundry?',
    answer:
      'Bisa. Smart Laundry POS mendukung multi-outlet dan multi-kasir dalam satu sistem yang sama, jadi pemilik usaha bisa memantau semua cabang tanpa perlu buku catatan terpisah per toko.',
  },
  {
    question: 'Apakah pelanggan dapat notifikasi otomatis saat cucian selesai?',
    answer:
      'Ya. Pesanan yang statusnya berubah menjadi siap diambil bisa mengirim notifikasi WhatsApp otomatis ke pelanggan, sehingga mereka tidak perlu menelepon toko untuk menanyakan progres cucian.',
  },
  {
    question: 'Apa bedanya Smart Laundry POS dengan aplikasi kasir umum seperti Qasir, Pawoon, atau Majoo?',
    answer:
      'Aplikasi kasir umum dibuat untuk toko kelontong atau restoran lalu dipaksakan untuk laundry. Smart Laundry POS dibangun khusus untuk alur kerja laundry: timbang, hitung harga per kg/unit otomatis, lacak status cucian, dan kirim notifikasi WhatsApp — fitur yang biasanya tidak ada di POS umum.',
  },
  {
    question: 'Apakah Smart Laundry POS punya sistem poin loyalitas pelanggan?',
    answer:
      'Punya. Fitur Smart Point mengumpulkan poin secara otomatis untuk transaksi yang sudah lunas, jika pemilik toko mengaktifkan fitur ini di menu pengaturan (nonaktif secara default).',
  },
  {
    question: 'Perlu instal aplikasi khusus atau bisa langsung dipakai dari HP?',
    answer:
      'Tidak perlu unduh dari app store. Smart Laundry POS berjalan di browser dan bisa dipasang sebagai aplikasi (PWA) langsung dari layar utama HP, tablet, atau komputer — mendukung Android, iOS, Windows, dan Mac.',
  },
];

const Mark: React.FC<{ value: 'yes' | 'no' | 'partial'; note?: string }> = ({ value, note }) => {
  if (value === 'yes') return <span className="tk-check">✓</span>;
  if (value === 'no')
    return (
      <span className="tk-cross">
        ✕{note ? <span className="block text-[0.65rem] font-normal normal-case tk-mono text-[var(--tk-graphite-soft)]">{note}</span> : null}
      </span>
    );
  return (
    <span className="tk-partial">
      ~{note ? <span className="block text-[0.65rem] font-normal normal-case tk-mono text-[var(--tk-graphite-soft)]">{note}</span> : null}
    </span>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  useLandingFonts();
  // index.html already ships these as the default (matches this page), but this
  // keeps them pinned to "/" when the SPA navigates back here from /login or /install.
  usePageMeta({
    title: 'Smart Laundry POS - Sistem Kasir Modern untuk Laundry Indonesia',
    description:
      'Sistem Point of Sale (POS) modern untuk bisnis laundry di Indonesia. Kelola pesanan, pelanggan, dan pembayaran dengan mudah. Aplikasi mobile, cloud-based, dan bisa diinstall seperti aplikasi native.',
    path: '/',
  });

  return (
    <div className="tk-page min-h-screen pb-24 sm:pb-0">
      {/* SEO/OG meta tags live in index.html (React 18 does not hoist tags rendered here) */}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--tk-line)] bg-[rgba(245,240,228,0.95)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1 gap-2 sm:gap-3">
              <div className="w-9 h-9 flex-shrink-0 border-2 border-[var(--tk-ink)] rounded-sm flex items-center justify-center tk-mono font-bold text-[var(--tk-ink)] text-sm">
                SL
              </div>
              <div className="min-w-0">
                <span className="block text-base sm:text-lg font-bold text-[var(--tk-graphite)] truncate">
                  Smart Laundry POS
                </span>
                <p className="text-[0.7rem] tk-mono tracking-wide text-[var(--tk-graphite-soft)] hidden sm:block">
                  SISTEM KASIR LAUNDRY
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <PWAInstallButton className="!bg-transparent !border-[var(--tk-line)] !text-[var(--tk-ink)] hover:!bg-[var(--tk-paper-soft)]" />
              <button
                onClick={() => navigate('/install')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--tk-line)] rounded-sm text-[var(--tk-ink-soft)] hover:bg-[var(--tk-paper-soft)] transition-colors"
              >
                <Download className="h-4 w-4" />
                Install Manual
              </button>
              <a
                href={ANDROID_APK_URL}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm border border-[var(--tk-line)] text-[var(--tk-ink-soft)] hover:bg-[var(--tk-paper-soft)] transition-colors"
              >
                <AndroidIcon className="h-4 w-4" />
                Download Android
              </a>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 sm:px-5 py-2 text-sm sm:text-base font-semibold rounded-sm bg-[var(--tk-ink)] text-[var(--tk-paper)] hover:bg-[var(--tk-graphite)] transition-colors"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="tk-hero-ticket rounded-sm overflow-hidden">
            <div className="tk-hero-barcode" />
            <div className="flex items-center justify-between px-6 sm:px-10 py-3 border-b border-dashed border-[var(--tk-line)] tk-mono text-xs sm:text-sm text-[var(--tk-graphite-soft)] tracking-widest uppercase">
              <span>Nota Laundry — Aplikasi Kasir</span>
              <span>No. 00142</span>
            </div>

            <div className="px-6 sm:px-10 py-10 sm:py-14">
              <span className="tk-eyebrow mb-6">Untuk Laundry Kiloan &amp; Satuan</span>

              <h1 className="text-[2.1rem] leading-[1.12] sm:text-5xl sm:leading-[1.1] lg:text-6xl font-bold text-[var(--tk-graphite)] mb-6 max-w-3xl">
                Kasir laundry yang jalan secepat antrian pagi.
              </h1>
              <p className="text-lg sm:text-xl text-[var(--tk-ink-soft)] mb-3 max-w-2xl">
                Smart Laundry POS mencatat berat, harga, dan status cucian dari input sampai diambil
                pelanggan — bukan aplikasi kasir umum yang dipaksa-paskan untuk laundry.
              </p>
              <p className="text-base sm:text-lg text-[var(--tk-graphite-soft)] mb-8 max-w-2xl">
                Tanpa nota tulis tangan yang gampang hilang. Tanpa hitung manual di kalkulator.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-3 mb-9 tk-mono text-sm">
                <div>
                  <div className="text-[var(--tk-graphite-soft)] text-xs tracking-widest uppercase">Berat</div>
                  <div className="font-bold text-[var(--tk-graphite)] text-lg">2.4 KG</div>
                </div>
                <div>
                  <div className="text-[var(--tk-graphite-soft)] text-xs tracking-widest uppercase">Total</div>
                  <div className="font-bold text-[var(--tk-graphite)] text-lg">Rp 24.000</div>
                </div>
                <div className="flex items-end">
                  <span className="tk-stamp">Siap Diambil</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/login?tab=signup')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 text-base sm:text-lg font-bold rounded-sm bg-[var(--tk-ink)] text-[var(--tk-paper)] hover:bg-[var(--tk-graphite)] transition-colors"
                >
                  Ambil Tiket Gratis
                  <ArrowRight className="h-5 w-5" />
                </button>
                <a
                  href="#fitur"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 text-base sm:text-lg font-semibold rounded-sm border border-[var(--tk-ink)] text-[var(--tk-ink)] hover:bg-[rgba(35,50,74,0.05)] transition-colors"
                >
                  Lihat Cara Kerja
                </a>
              </div>
            </div>
          </div>

          <p className="text-center mt-6 text-sm sm:text-base text-[var(--tk-graphite-soft)] tk-mono">
            GRATIS DIPAKAI &middot; TANPA KARTU KREDIT &middot; SIAP PAKAI DALAM 5 MENIT
          </p>
        </div>
      </section>

      <div className="tk-perforation" />

      {/* App Screenshots */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="tk-eyebrow mb-5">Tampilan Asli</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-4">
              Dari meja kasir ke genggaman tangan
            </h2>
            <p className="text-lg text-[var(--tk-ink-soft)] max-w-2xl mx-auto">
              Dari ringkasan toko sampai bikin pesanan baru, semua langsung dari HP kasir.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Mobile View - dashboard */}
            <div className="tk-stub rounded-sm">
              <div className="tk-stub__num">No. 0021</div>
              <div className="flex items-center gap-2 mb-5">
                <Smartphone className="h-5 w-5 text-[var(--tk-ink)]" />
                <h3 className="text-lg font-bold text-[var(--tk-graphite)]">Ringkasan Toko</h3>
              </div>
              <div className="relative bg-[var(--tk-paper-soft)] overflow-hidden border-8 border-[var(--tk-graphite)] rounded-2xl aspect-[9/19] max-h-[420px] mx-auto">
                <img
                  src="/screenshots/mobile-1.png"
                  alt="Dashboard Smart Laundry POS di HP"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-[var(--tk-graphite-soft)] p-8">
                          <p class="text-center text-base font-medium">Aplikasi POS Mobile</p>
                          <p class="text-center text-sm mt-2">Kelola pesanan dari smartphone Anda</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center tk-mono">
                <div>
                  <Zap className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Cepat</div>
                </div>
                <div>
                  <Smartphone className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Ramah Sentuh</div>
                </div>
                <div>
                  <Wifi className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Mode Offline</div>
                </div>
              </div>
            </div>

            {/* Mobile View - create order */}
            <div className="tk-stub rounded-sm">
              <div className="tk-stub__num">No. 0022</div>
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList className="h-5 w-5 text-[var(--tk-ink)]" />
                <h3 className="text-lg font-bold text-[var(--tk-graphite)]">Buat Pesanan</h3>
              </div>
              <div className="relative bg-[var(--tk-paper-soft)] overflow-hidden border-8 border-[var(--tk-graphite)] rounded-2xl aspect-[9/19] max-h-[420px] mx-auto">
                <img
                  src="/screenshots/mobile-2.png"
                  alt="Layar pilih layanan saat membuat pesanan baru"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-[var(--tk-graphite-soft)] p-8">
                          <p class="text-center text-lg font-medium">Buat Pesanan Baru</p>
                          <p class="text-center text-sm mt-2">Pilih layanan langsung dari smartphone</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center tk-mono">
                <div>
                  <BarChart3 className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Kalkulasi Otomatis</div>
                </div>
                <div>
                  <Zap className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Estimasi Selesai</div>
                </div>
                <div>
                  <Receipt className="h-4 w-4 mx-auto mb-1 text-[var(--tk-ink)]" />
                  <div className="text-xs text-[var(--tk-graphite-soft)]">Siap Cetak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 text-center">
            <p className="text-base text-[var(--tk-ink-soft)] mb-5">
              Berfungsi sempurna di smartphone, tablet, dan komputer desktop
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 tk-mono text-sm text-[var(--tk-graphite-soft)] uppercase tracking-wide">
              <span>iOS &amp; Android</span>
              <span aria-hidden="true" className="text-[var(--tk-line)]">/</span>
              <span>Windows &amp; Mac</span>
              <span aria-hidden="true" className="text-[var(--tk-line)]">/</span>
              <span>Chrome · Safari · Firefox</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tk-perforation" />

      {/* Features */}
      <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="tk-eyebrow mb-5">Isi Tiketnya</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-4">
              Apa yang kamu dapat dari setiap transaksi
            </h2>
            <p className="text-lg text-[var(--tk-ink-soft)] max-w-2xl mx-auto">
              Tujuh hal yang biasanya hilang di antara buku catatan dan grup WhatsApp toko.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.serial} className="tk-stub rounded-sm">
                  <div className="tk-stub__num">No. {feature.serial}</div>
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--tk-ink)] flex items-center justify-center mb-5 text-[var(--tk-ink)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--tk-graphite)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--tk-ink-soft)]">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 tk-ink-band rounded-sm p-8 sm:p-10 text-center">
            <p className="text-xl sm:text-2xl font-bold mb-1">
              &ldquo;Bukan sekadar aplikasi kasir — ini sistem pencatatan laundry dari ambil sampai bayar.&rdquo;
            </p>
          </div>
        </div>
      </section>

      <div className="tk-perforation" />

      {/* Comparison ledger */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="tk-eyebrow mb-5">Dibanding Aplikasi Kasir Umum</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-4">
              Kenapa bukan aplikasi kasir biasa?
            </h2>
            <p className="text-lg text-[var(--tk-ink-soft)] max-w-2xl mx-auto mb-2">
              Perbandingan jujur dengan Qasir, Pawoon, dan Majoo — tiga aplikasi kasir umum yang paling
              sering dipakai UMKM Indonesia.
            </p>
            <p className="text-sm text-[var(--tk-graphite-soft)] md:hidden tk-mono">
              Geser tabel untuk melihat lebih banyak &rarr;
            </p>
          </div>

          <div className="tk-ledger overflow-x-auto rounded-sm -mx-4 sm:mx-0">
            <div className="min-w-[640px] sm:min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="tk-ink-band tk-mono text-xs sm:text-sm uppercase tracking-wide">
                    <th className="px-4 sm:px-6 py-4 font-semibold">Fitur</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-center">Smart Laundry POS</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-center">Qasir</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-center">Pawoon</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-center">Majoo</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-[var(--tk-line)] last:border-0">
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base font-medium text-[var(--tk-graphite)] border-r border-[var(--tk-line)]">
                        {row.feature}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center border-r border-[var(--tk-line)] bg-[rgba(46,107,76,0.05)]">
                        <Mark value={row.smart} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center border-r border-[var(--tk-line)]">
                        <Mark value={row.qasir} note={row.note?.qasir} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center border-r border-[var(--tk-line)]">
                        <Mark value={row.pawoon} note={row.note?.pawoon} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <Mark value={row.majoo} note={row.note?.majoo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#fffdf8] border border-[var(--tk-line)] border-l-4 border-l-[var(--tk-carbon-deep)] rounded-sm p-6">
              <p className="font-bold text-[var(--tk-graphite)] mb-2">Aplikasi kasir umum tidak mengerti alur laundry.</p>
              <p className="text-[var(--tk-ink-soft)]">
                Dibuat untuk toko kelontong atau resto, lalu dipaksakan untuk mencatat berat, layanan, dan status cucian.
              </p>
            </div>
            <div className="bg-[#fffdf8] border border-[var(--tk-line)] border-l-4 border-l-[var(--tk-paid)] rounded-sm p-6">
              <p className="font-bold text-[var(--tk-graphite)] mb-2">Smart Laundry POS dibangun untuk ekosistem laundry.</p>
              <p className="text-[var(--tk-ink-soft)]">
                Setiap fitur mengikuti alur kerja nyata: timbang, catat, notifikasi, ambil, bayar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emotional hook — ink band */}
      <section className="tk-ink-band py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="tk-eyebrow tk-eyebrow--light mb-8">Sebelum Kamu Lanjut</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            Kamu sudah kerja keras bangun usaha laundry ini.
          </h2>
          <div className="space-y-3 text-lg sm:text-xl mb-10 opacity-90">
            <p>Sudah keluar modal beli mesin cuci dan setrika.</p>
            <p>Sudah latih pegawai supaya cucian rapi dan tepat waktu.</p>
          </div>
          <div className="border-t border-b border-dashed border-white/25 py-8 mb-10">
            <p className="text-xl sm:text-2xl font-bold mb-3">
              Tinggal satu hal yang belum rapi: catatannya.
            </p>
            <p className="text-lg text-[var(--tk-carbon)]">
              Jangan biarkan nota tulis tangan menahan bisnis yang sudah kamu bangun susah payah.
            </p>
          </div>
          <button
            onClick={() => navigate('/login?tab=signup')}
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-sm bg-[var(--tk-paper)] text-[var(--tk-ink)] hover:bg-white transition-colors"
          >
            Mulai Transformasi Sekarang
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="tk-eyebrow mb-6">Solusi Lengkap</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-5">
                Mengapa memilih Smart Laundry POS?
              </h2>
              <p className="text-lg text-[var(--tk-ink-soft)] mb-8">
                Dibuat khusus untuk bisnis laundry Indonesia dengan metode pembayaran lokal, harga dalam
                Rupiah, dan fitur-fitur yang penting untuk operasional harian Anda.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <span className="tk-mono text-[var(--tk-paid)] font-bold">✓</span>
                    <span className="text-[var(--tk-graphite)]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tk-boarding rounded-sm p-8 sm:p-10">
              <Smartphone className="h-10 w-10 mb-4 text-[var(--tk-carbon)]" />
              <h3 className="text-2xl font-bold mb-2">Install sebagai Aplikasi Mobile</h3>
              <p className="opacity-80 mb-6">
                Dapatkan pengalaman mobile lengkap dengan dukungan offline dan akses instan dari layar utama.
              </p>
              <div className="space-y-3 tk-mono text-sm">
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 flex-shrink-0" />
                  <span>Bekerja offline saat diperlukan</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 flex-shrink-0" />
                  <span>Performa super cepat</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span>Akses dari mana saja</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="tk-perforation" />

      {/* FAQ — content mirrors the FAQPage JSON-LD in index.html, keep them in sync */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="tk-eyebrow mb-5">Pertanyaan yang Sering Diajukan</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-4">
              Yang biasanya ditanyakan pemilik laundry
            </h2>
            <p className="text-lg text-[var(--tk-ink-soft)] max-w-2xl mx-auto">
              Jawaban singkat sebelum kamu memutuskan pindah dari nota tulis tangan.
            </p>
          </div>

          <div className="space-y-5">
            {faqs.map((faq) => (
              <div key={faq.question} className="tk-stub rounded-sm">
                <h3 className="text-lg font-bold text-[var(--tk-graphite)] mb-2">{faq.question}</h3>
                <p className="text-[var(--tk-ink-soft)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-[#fffdf8] border border-[var(--tk-line)] rounded-sm p-8 sm:p-14">
          <span className="tk-eyebrow mb-6">Penawaran untuk Pemilik Toko Baru</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--tk-graphite)] mb-6 leading-tight">
            Siap modernisasi bisnis laundry Anda?
          </h2>
          <p className="text-lg text-[var(--tk-ink-soft)] mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan bisnis laundry yang sudah menggunakan Smart Laundry POS untuk meningkatkan
            efisiensi dan kepuasan pelanggan.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            <div className="tk-stub rounded-sm !p-5">
              <div className="tk-stub__num">A</div>
              <p className="font-bold text-[var(--tk-graphite)] mb-1">Mulai gratis</p>
              <p className="text-sm text-[var(--tk-graphite-soft)]">Tidak perlu kartu kredit</p>
            </div>
            <div className="tk-stub rounded-sm !p-5">
              <div className="tk-stub__num">B</div>
              <p className="font-bold text-[var(--tk-graphite)] mb-1">Set-up 5 menit</p>
              <p className="text-sm text-[var(--tk-graphite-soft)]">Rasakan bedanya hari ini</p>
            </div>
            <div className="tk-stub rounded-sm !p-5">
              <div className="tk-stub__num">C</div>
              <p className="font-bold text-[var(--tk-graphite)] mb-1">Langsung mulai</p>
              <p className="text-sm text-[var(--tk-graphite-soft)]">Tanpa kontrak jangka panjang</p>
            </div>
          </div>

          <div className="tk-tear pt-8">
            <button
              onClick={() => navigate('/login?tab=signup')}
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 text-lg font-bold rounded-sm bg-[var(--tk-ink)] text-[var(--tk-paper)] hover:bg-[var(--tk-graphite)] transition-colors"
            >
              Ambil Tiket Gratis Sekarang
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-5 text-sm tk-mono uppercase tracking-wide text-[var(--tk-graphite-soft)]">
              Tanpa biaya setup &middot; Tanpa kontrak &middot; Langsung mulai
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tk-ink-band py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 border-2 border-[var(--tk-paper)] rounded-sm flex items-center justify-center tk-mono font-bold text-sm">
                  SL
                </div>
                <span className="text-lg font-bold">Smart Laundry POS</span>
              </div>
              <p className="opacity-75 mb-6 max-w-md">
                Sistem point of sale modern yang dirancang khusus untuk bisnis laundry. Sederhanakan
                operasional, tingkatkan efisiensi, dan kembangkan bisnis Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <PWAInstallButton
                  variant="outline"
                  className="!bg-transparent !border-white/25 !text-[var(--tk-paper)] hover:!bg-white/10"
                />
                <button
                  onClick={() => navigate('/install')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-white/25 rounded-sm hover:bg-white/10 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Install Guide
                </button>
                <a
                  href={ANDROID_APK_URL}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-white/25 rounded-sm hover:bg-white/10 transition-colors"
                >
                  <AndroidIcon className="h-4 w-4" />
                  Download APK Android
                </a>
              </div>
              <div className="opacity-80 text-sm">
                <p className="mb-1">
                  <strong className="opacity-100">Kontak:</strong>{' '}
                  <a
                    href="mailto:fahrudinjaya@gmail.com"
                    className="underline decoration-white/30 hover:decoration-white"
                  >
                    fahrudinjaya@gmail.com
                  </a>
                </p>
                <p>Untuk pertanyaan, dukungan teknis, atau demo produk</p>
              </div>
            </div>

            <div>
              <h3 className="tk-mono text-xs uppercase tracking-widest mb-4 opacity-70">Fitur</h3>
              <ul className="space-y-2 opacity-80 text-sm">
                <li>Manajemen Pesanan</li>
                <li>Database Pelanggan</li>
                <li>Proses Pembayaran</li>
                <li>Laporan &amp; Analitik</li>
                <li>Dukungan Multi-toko</li>
              </ul>
            </div>

            <div>
              <h3 className="tk-mono text-xs uppercase tracking-widest mb-4 opacity-70">Dukungan</h3>
              <ul className="space-y-2 opacity-80 text-sm">
                <li>Dokumentasi</li>
                <li>Tutorial Video</li>
                <li>Customer Support</li>
                <li>Request Fitur</li>
                <li>Status Sistem</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 mt-10 pt-8 text-center opacity-70 text-sm">
            <p>&copy; 2025 Smart Laundry POS. Dibuat untuk bisnis laundry Indonesia.</p>
            <p className="mt-2">
              Kontak:{' '}
              <a href="mailto:fahrudinjaya@gmail.com" className="underline decoration-white/30 hover:decoration-white">
                fahrudinjaya@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgba(245,240,228,0.95)] backdrop-blur-sm border-t border-[var(--tk-line)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => navigate('/login?tab=signup')}
          className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--tk-ink)] text-[var(--tk-paper)] py-4 text-base font-bold"
        >
          Ambil Tiket Gratis
          <ArrowUpRight className="h-5 w-5" />
        </button>
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton
        phoneNumber="6281280272326"
        message="Halo, saya tertarik dengan Smart Laundry POS dan ingin bertanya lebih lanjut!"
        position="bottom-right"
      />
    </div>
  );
};
