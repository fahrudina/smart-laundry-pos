import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';

const NotFound = () => {
  const location = useLocation();
  
  usePageTitle('Halaman Tidak Ditemukan');

  useEffect(() => {
    console.error(
      "404 Error: Pengguna mencoba mengakses route yang tidak ada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Halaman tidak ditemukan</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
};

export default NotFound;
