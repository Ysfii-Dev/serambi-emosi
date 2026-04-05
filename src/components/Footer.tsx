import React from 'react';
import { BarChart3, HeartHandshake, Home, UploadCloud } from 'lucide-react';

type PageState = 'landing' | 'input' | 'result';

interface FooterProps {
  currentPage: PageState;
  hasResult: boolean;
  onGoHome: () => void;
  onGoInput: () => void;
  onGoResult: () => void;
}

interface FooterNavItem {
  id: PageState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export default function Footer({
  currentPage,
  hasResult,
  onGoHome,
  onGoInput,
  onGoResult,
}: FooterProps) {
  const navItems: FooterNavItem[] = [
    { id: 'landing', label: 'Beranda', icon: Home, onClick: onGoHome },
    { id: 'input', label: 'Unggah Audio', icon: UploadCloud, onClick: onGoInput },
    { id: 'result', label: 'Hasil', icon: BarChart3, onClick: onGoResult, disabled: !hasResult },
  ];

  return (
    <footer className="relative z-10 mt-12 border-t border-cream-dark/80 bg-[rgba(249,250,251,0.72)] backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-terracotta/10 bg-white/85 text-terracotta shadow-sm">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-light/70">
                  Serambi Emosi
                </p>
                <h3 className="font-serif text-xl text-ink">Analisis Suara Empatik</h3>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-ink-light">
              Ruang yang ringan dan tenang untuk memahami indikasi emosi dari suara dalam satu alur analisis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-terracotta shadow-sm'
                        : item.disabled
                          ? 'cursor-not-allowed text-ink-light/35'
                          : 'text-ink-light hover:bg-white/85 hover:text-ink'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-cream-dark/80 pt-4 text-xs text-ink-light sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Serambi Emosi.</p>
          <p>Refleksi emosional dengan antarmuka yang ringan dan modern.</p>
        </div>
      </div>
    </footer>
  );
}
