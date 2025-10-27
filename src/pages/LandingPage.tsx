import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Cloud, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Clock, 
  CreditCard,
  Star,
  CheckCircle,
  ArrowRight,
  Download,
  Globe,
  Wifi,
  Monitor
} from 'lucide-react';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';
import { WhatsAppFloatingButton } from '@/components/ui/WhatsAppFloatingButton';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Desain Mobile-First",
      description: "Dioptimalkan untuk smartphone dan tablet dengan antarmuka yang mudah disentuh"
    },
    {
      icon: <Cloud className="h-6 w-6" />,
      title: "Berbasis Cloud",
      description: "Akses data Anda kapan saja, di mana saja dengan sinkronisasi real-time"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Aman & Terpercaya",
      description: "Keamanan tingkat enterprise dengan backup otomatis"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Super Cepat",
      description: "Pemrosesan pesanan cepat dan pembuatan struk instan"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Manajemen Pelanggan",
      description: "Database pelanggan lengkap dengan pelacakan riwayat pesanan"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Dashboard Analitik",
      description: "Laporan detail dan wawasan untuk pertumbuhan bisnis"
    }
  ];

  const benefits = [
    "Dukungan manajemen multi-toko",
    "Pelacakan pesanan real-time",
    "Kalkulasi harga otomatis",
    "Sistem notifikasi pelanggan",
    "Manajemen inventori",
    "Pelaporan keuangan",
    "Tools manajemen staff",
    "Dukungan mode offline"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* SEO Meta Tags */}
      <title>Smart Laundry POS - Sistem Kasir Modern untuk Laundry Indonesia</title>
      <meta name="description" content="Sistem Point of Sale (POS) modern untuk bisnis laundry di Indonesia. Kelola pesanan, pelanggan, dan pembayaran dengan mudah. Aplikasi mobile, cloud-based, dan bisa diinstall seperti aplikasi native." />
      <meta name="keywords" content="sistem kasir laundry, POS laundry Indonesia, aplikasi laundry, manajemen laundry, kasir digital laundry, software laundry" />
      <meta name="author" content="Smart Laundry POS" />
      <meta property="og:title" content="Smart Laundry POS - Sistem Kasir Modern untuk Laundry Indonesia" />
      <meta property="og:description" content="Kelola bisnis laundry Anda dengan sistem POS modern. Mobile-friendly, cloud-based, dan mudah digunakan." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://smart-laundry-pos.vercel.app" />
      <meta property="og:image" content="/favicon-512.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Smart Laundry POS - Sistem Kasir Modern untuk Laundry" />
      <meta name="twitter:description" content="Sistem POS terbaik untuk bisnis laundry di Indonesia" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Laundry POS</h1>
                <p className="text-xs text-gray-500">Sistem Kasir Laundry Profesional</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <PWAInstallButton />
              <Button 
                variant="outline"
                onClick={() => navigate('/install')}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Install Manual
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Masuk
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Aplikasi Web Progresif
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sistem POS Modern untuk
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}Laundry Pintar
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Modernisasi bisnis laundry Anda dengan sistem point of sale berbasis cloud. 
              Kelola pesanan, pelanggan, dan pembayaran dari mana saja dengan desain mobile-first.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="h-4 w-4" />
                <span>Install sebagai aplikasi mobile</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshots Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 bg-indigo-100 text-indigo-800">
              <Monitor className="h-3 w-3 mr-1" />
              Tampilan Aplikasi
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lihat Smart Laundry POS dalam Aksi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Antarmuka intuitif yang dirancang untuk kemudahan penggunaan di semua perangkat
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mobile View */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Tampilan Mobile</h3>
                  </div>
                  <Badge className="bg-blue-600">Responsif</Badge>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden border-8 border-gray-800 shadow-xl aspect-[9/19]">
                  <img 
                    src="/screenshots/mobile-1.png" 
                    alt="Smart Laundry POS Mobile View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to a placeholder if image doesn't load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                            <svg class="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-center text-lg font-medium">Aplikasi POS Mobile</p>
                            <p class="text-center text-sm mt-2">Kelola pesanan dari smartphone Anda</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">⚡</div>
                    <div className="text-sm text-gray-600 mt-1">Super Cepat</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">📱</div>
                    <div className="text-sm text-gray-600 mt-1">Touch Friendly</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">💾</div>
                    <div className="text-sm text-gray-600 mt-1">Offline Mode</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Tampilan Desktop</h3>
                  </div>
                  <Badge className="bg-indigo-600">Optimal</Badge>
                </div>
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl overflow-hidden border-4 border-gray-300 shadow-xl aspect-video">
                  <img 
                    src="/favicon-512.png" 
                    alt="Smart Laundry POS Desktop View"
                    className="w-full h-full object-contain p-12"
                    onError={(e) => {
                      // Fallback to a placeholder if image doesn't load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                            <svg class="w-32 h-32 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-center text-xl font-medium">Dashboard Desktop</p>
                            <p class="text-center text-sm mt-2">Kelola bisnis dengan tampilan penuh</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">📊</div>
                    <div className="text-sm text-gray-600 mt-1">Dashboard</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">⌨️</div>
                    <div className="text-sm text-gray-600 mt-1">Keyboard Nav</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">🖨️</div>
                    <div className="text-sm text-gray-600 mt-1">Print Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 mb-6">
              Berfungsi sempurna di smartphone, tablet, dan komputer desktop
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2">
                <Smartphone className="h-4 w-4 mr-2" />
                iOS & Android
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Monitor className="h-4 w-4 mr-2" />
                Windows & Mac
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                Chrome, Safari, Firefox
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Semua yang Anda Butuhkan untuk Menjalankan Laundry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fitur-fitur canggih yang dirancang khusus untuk bisnis laundry segala ukuran
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Solusi Lengkap
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Mengapa Memilih Smart Laundry POS?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Dibuat khusus untuk bisnis laundry Indonesia dengan metode pembayaran lokal, 
                harga dalam Rupiah, dan fitur-fitur yang penting untuk operasional harian Anda.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="mb-6">
                  <Smartphone className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Install sebagai Aplikasi Mobile</h3>
                  <p className="opacity-90">
                    Dapatkan pengalaman mobile lengkap dengan dukungan offline dan akses instan
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Wifi className="h-5 w-5 mr-3" />
                    <span>Bekerja offline saat diperlukan</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 mr-3" />
                    <span>Performa super cepat</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-3" />
                    <span>Akses dari mana saja</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Siap Modernisasi Bisnis Laundry Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabunglah dengan ratusan bisnis laundry yang sudah menggunakan Smart Laundry POS untuk meningkatkan efisiensi dan kepuasan pelanggan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Mulai Hari Ini
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-blue-100 text-sm">
              Tanpa biaya setup • Tanpa kontrak jangka panjang • Langsung bisa dimulai
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">SL</span>
                </div>
                <span className="text-xl font-bold">Smart Laundry POS</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Sistem point of sale modern yang dirancang khusus untuk bisnis laundry. 
                Sederhanakan operasional, tingkatkan efisiensi, dan kembangkan bisnis Anda.
              </p>
              <div className="flex space-x-4 mb-4">
                <PWAInstallButton variant="outline" />
                <Button 
                  variant="outline"
                  onClick={() => navigate('/install')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Guide
                </Button>
              </div>
              <div className="text-gray-400">
                <p className="mb-2">
                  <strong>Kontak:</strong> 
                  <a href="mailto:fahrudinjaya@gmail.com" className="text-blue-400 hover:text-blue-300 ml-2">
                    fahrudinjaya@gmail.com
                  </a>
                </p>
                <p className="text-sm">
                  Untuk pertanyaan, dukungan teknis, atau demo produk
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Fitur</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Manajemen Pesanan</li>
                <li>Database Pelanggan</li>
                <li>Proses Pembayaran</li>
                <li>Laporan & Analitik</li>
                <li>Dukungan Multi-toko</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Dokumentasi</li>
                <li>Tutorial Video</li>
                <li>Customer Support</li>
                <li>Request Fitur</li>
                <li>Status Sistem</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Smart Laundry POS. Dibuat untuk bisnis laundry Indonesia.</p>
            <p className="mt-2 text-sm">
              Kontak: <a href="mailto:fahrudinjaya@gmail.com" className="text-blue-400 hover:text-blue-300">fahrudinjaya@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton 
        phoneNumber="6281234567890"
        message="Halo, saya tertarik dengan Smart Laundry POS dan ingin bertanya lebih lanjut!"
        position="bottom-right"
      />
    </div>
  );
};
