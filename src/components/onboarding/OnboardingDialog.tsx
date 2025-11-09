import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Users,
  Wrench,
  BarChart3,
  ShoppingCart,
  CheckCircle,
  ArrowRight,
  X
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration?: string;
}

const ONBOARDING_STORAGE_KEY = 'smart_laundry_onboarding_completed';

export const OnboardingDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { isOwner } = useStore();

  // Define onboarding steps based on user role
  const ownerSteps: OnboardingStep[] = [
    {
      title: 'Selamat Datang di Smart Laundry POS! 🎉',
      description: 'Aplikasi ini akan membantu Anda mengelola bisnis laundry dengan lebih mudah dan efisien. Mari kita lihat fitur-fitur utamanya.',
      icon: <CheckCircle className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Buat Pesanan Baru',
      description: 'Gunakan menu "Buat Pesanan" untuk membuat order laundry baru. Anda dapat memilih jenis layanan, menambahkan item, dan menghitung total pembayaran dengan mudah.',
      icon: <Plus className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Kelola Pelanggan',
      description: 'Simpan data pelanggan Anda dan lacak riwayat pesanan mereka. Anda juga dapat memberikan poin loyalitas untuk pelanggan setia.',
      icon: <Users className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Atur Layanan',
      description: 'Sebagai pemilik toko, Anda dapat menambah, mengedit, atau menghapus jenis layanan laundry. Tentukan harga per kilo, per unit, atau kombinasi keduanya.',
      icon: <Wrench className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Pantau Laporan',
      description: 'Lihat riwayat pesanan, status pembayaran, dan laporan keuangan toko Anda. Dashboard akan menampilkan pendapatan harian dan statistik penting lainnya.',
      icon: <BarChart3 className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Siap Memulai! ✨',
      description: 'Anda sekarang siap untuk mulai menggunakan Smart Laundry POS. Jika ada pertanyaan, jangan ragu untuk menghubungi dukungan kami.',
      icon: <ShoppingCart className="h-16 w-16 text-rose-500 mx-auto" />,
    },
  ];

  const staffSteps: OnboardingStep[] = [
    {
      title: 'Selamat Datang di Smart Laundry POS! 🎉',
      description: 'Aplikasi ini akan membantu Anda mengelola pesanan laundry dengan mudah. Mari kita lihat fitur-fitur yang tersedia untuk Anda.',
      icon: <CheckCircle className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Buat Pesanan Baru',
      description: 'Gunakan menu "Buat Pesanan" untuk membuat order laundry baru. Pilih pelanggan, tambahkan layanan, dan proses pembayaran dengan cepat.',
      icon: <Plus className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Kelola Pelanggan',
      description: 'Anda dapat melihat daftar pelanggan dan menambah pelanggan baru. Riwayat pesanan pelanggan juga dapat diakses dengan mudah.',
      icon: <Users className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Lihat Riwayat Pesanan',
      description: 'Pantau semua pesanan yang masuk, update status pesanan, dan kelola pembayaran. Anda juga dapat mencetak struk untuk pelanggan.',
      icon: <BarChart3 className="h-16 w-16 text-rose-500 mx-auto" />,
    },
    {
      title: 'Siap Memulai! ✨',
      description: 'Anda sekarang siap untuk mulai melayani pelanggan. Semoga hari Anda menyenangkan!',
      icon: <ShoppingCart className="h-16 w-16 text-rose-500 mx-auto" />,
    },
  ];

  const steps = isOwner ? ownerSteps : staffSteps;

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (!onboardingCompleted) {
      // Small delay to ensure smooth transition after login
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </button>

        <DialogHeader className="pt-6">
          <div className="mb-4">
            {steps[currentStep].icon}
          </div>
          <DialogTitle className="text-xl text-center">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-rose-500'
                  : index < currentStep
                  ? 'w-2 bg-rose-300'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-rose-500 hover:bg-rose-600"
          >
            {currentStep === steps.length - 1 ? (
              'Mulai'
            ) : (
              <>
                Selanjutnya
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Lewati panduan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
