import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  HeartHandshake,
  Home,
  Menu,
  Mic,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';

type PageState = 'landing' | 'input' | 'result';

interface NavbarProps {
  currentPage: PageState;
  hasResult: boolean;
  onGoHome: () => void;
  onGoInput: () => void;
  onGoResult: () => void;
  onRestart: () => void;
}

interface NavItem {
  id: PageState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export default function Navbar({
  currentPage,
  hasResult,
  onGoHome,
  onGoInput,
  onGoResult,
  onRestart,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPage]);

  const navItems: NavItem[] = [
    { id: 'landing', label: 'Beranda', icon: Home, onClick: onGoHome },
    { id: 'input', label: 'Unggah Audio', icon: UploadCloud, onClick: onGoInput },
    { id: 'result', label: 'Hasil', icon: BarChart3, onClick: onGoResult, disabled: !hasResult },
  ];

  const primaryAction =
    currentPage === 'landing'
      ? { label: 'Mulai Analisis', onClick: onGoInput, icon: Mic }
      : currentPage === 'result'
        ? { label: 'Analisis Ulang', onClick: onRestart, icon: RefreshCw }
        : { label: 'Kembali ke Beranda', onClick: onGoHome, icon: Home };

  const PrimaryIcon = primaryAction.icon;

  const handleAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[1000] w-full">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full border-b border-white/50 bg-[rgba(253,251,247,0.64)] text-ink shadow-[0_10px_28px_rgba(45,55,72,0.07)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(253,251,247,0.5)]"
      >
        <div className="relative flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-w-0 items-center justify-start lg:max-w-[24rem] lg:flex-1">
            <button
              onClick={() => handleAction(onGoHome)}
              className="flex min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-terracotta/10 bg-terracotta/10 text-terracotta shadow-sm">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-ink-light/70">
                  Serambi Emosi
                </p>
                <p className="truncate font-serif text-lg text-ink sm:text-[1.35rem] xl:text-[1.6rem]">
                  Analisis Suara Empatik
                </p>
              </div>
            </button>
          </div>

          <div className="hidden lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2 lg:items-center lg:justify-center">
            <nav className="flex items-center gap-[clamp(0.2rem,0.45vw,0.5rem)] rounded-full border border-white/65 bg-white/48 p-[clamp(0.2rem,0.45vw,0.32rem)] shadow-[0_6px_18px_rgba(45,55,72,0.05)] backdrop-blur-md">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAction(item.onClick)}
                    disabled={item.disabled}
                    className={`inline-flex items-center gap-[clamp(0.35rem,0.45vw,0.5rem)] rounded-full px-[clamp(0.72rem,0.95vw,1rem)] py-[clamp(0.5rem,0.65vw,0.65rem)] text-[clamp(0.76rem,0.8vw,0.9rem)] font-medium transition-all ${
                      isActive
                        ? 'bg-terracotta text-white shadow-sm'
                        : item.disabled
                          ? 'cursor-not-allowed text-ink-light/35'
                          : 'text-ink-light hover:bg-white hover:text-ink'
                    }`}
                  >
                    <Icon className="h-[clamp(0.8rem,0.85vw,1rem)] w-[clamp(0.8rem,0.85vw,1rem)]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex lg:min-w-[15rem] lg:flex-1">
            {hasResult && (
              <span className="hidden items-center gap-2 rounded-full border border-sage/25 bg-sage/10 px-4 py-2 text-sm font-medium text-sage-dark xl:inline-flex">
                <span className="h-2 w-2 rounded-full bg-sage-dark" />
                Hasil siap
              </span>
            )}

            <button
              onClick={() => handleAction(primaryAction.onClick)}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-[0.82rem] font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark xl:px-5 xl:text-sm"
            >
              <PrimaryIcon className="h-4 w-4" />
              <span>{primaryAction.label}</span>
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/65 bg-white/45 text-ink shadow-sm backdrop-blur-md transition-colors hover:bg-white/65 lg:hidden"
            aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="px-4 pb-4 sm:px-6">
                <div className="rounded-3xl border border-white/75 bg-[rgba(255,255,255,0.82)] p-3 shadow-[0_14px_32px_rgba(45,55,72,0.08)] backdrop-blur-xl">
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleAction(item.onClick)}
                        disabled={item.disabled}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-terracotta text-white'
                            : item.disabled
                              ? 'cursor-not-allowed text-ink-light/35'
                              : 'text-ink-light hover:bg-cream hover:text-ink'
                        }`}
                      >
                        <span className="inline-flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </span>
                        {isActive && <span className="h-2 w-2 rounded-full bg-white/85" />}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-3 flex flex-col gap-3 border-t border-cream-dark pt-3">
                  {hasResult && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-sage/25 bg-sage/10 px-4 py-2 text-sm font-medium text-sage-dark">
                      <span className="h-2 w-2 rounded-full bg-sage-dark" />
                      Hasil analisis siap
                    </span>
                  )}

                  <button
                    onClick={() => handleAction(primaryAction.onClick)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark"
                  >
                    <PrimaryIcon className="h-4 w-4" />
                    <span>{primaryAction.label}</span>
                  </button>
                </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
