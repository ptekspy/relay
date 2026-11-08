import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  productName?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  productName = "Paddy Systems",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white selection:bg-white selection:text-black font-sans antialiased">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase font-bold text-white hover:opacity-80 transition-opacity"
          >
            <span className="inline-block w-2.5 h-2.5 bg-white" />
            <span>PADDY.SYSTEMS</span>
          </a>
          {productName !== "Paddy Systems" && (
            <>
              <span className="text-white/30 font-mono">/</span>
              <span className="font-mono text-xs uppercase tracking-wider text-white/70">
                {productName}
              </span>
            </>
          )}
        </div>
        <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
          Unified Identity
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-neutral-950 border border-white/15 p-8 relative shadow-2xl">
          {/* Accent corners */}
          <div
            className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white"
            aria-hidden="true"
          />

          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-neutral-500">
        <div>&copy; {new Date().getFullYear()} Paddy Systems Inc.</div>
        <div className="flex gap-4">
          <a
            href="https://paddy.systems"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Platform
          </a>
          <a
            href="https://auth.paddy.systems"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Auth Status
          </a>
        </div>
      </footer>
    </div>
  );
}
