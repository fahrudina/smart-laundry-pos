import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/**
 * Pre-login screen shown inside the native app / installed PWA, in place of
 * the full marketing LandingPage - an app-shell user already installed the
 * app, they just want to log in or sign up. Reuses the LandingPage's
 * ticket-stub design language (.tk-page) but intentionally skips its Google
 * Fonts network fetch so the app's first screen has no network dependency;
 * the --tk-font-* variables already fall back to system fonts.
 */
export const AppWelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="tk-page min-h-screen flex flex-col items-center justify-center text-center"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
      }}
    >
      <div className="w-16 h-16 flex-shrink-0 border-2 border-[var(--tk-ink)] rounded-sm flex items-center justify-center tk-mono font-bold text-[var(--tk-ink)] text-xl">
        SL
      </div>
      <div className="mt-4">
        <span className="block text-2xl font-bold text-[var(--tk-graphite)]">
          Smart Laundry POS
        </span>
        <p className="text-xs tk-mono tracking-wide text-[var(--tk-graphite-soft)] mt-1">
          SISTEM KASIR LAUNDRY
        </p>
      </div>

      <div className="tk-perforation w-full max-w-xs my-8" />

      <p className="text-base text-[var(--tk-graphite-soft)] max-w-xs">
        Kasir laundry yang jalan secepat antrian pagi.
      </p>

      <div className="w-full max-w-xs mt-10 flex flex-col gap-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full inline-flex items-center justify-center px-5 py-3 text-base font-semibold rounded-sm bg-[var(--tk-ink)] text-[var(--tk-paper)] hover:bg-[var(--tk-graphite)] transition-colors"
        >
          Masuk
        </button>
        <button
          onClick={() => navigate('/login?tab=signup')}
          className="w-full inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-sm border border-[var(--tk-line)] text-[var(--tk-ink-soft)] hover:bg-[var(--tk-paper-soft)] transition-colors"
        >
          Daftar akun baru
        </button>
      </div>
    </div>
  );
};
