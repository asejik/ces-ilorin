import Link from 'next/link';
import { GraduationCap, Home, Wifi, WifiOff } from 'lucide-react';

export function AssessHeader({ isOnline }: { isOnline: boolean }) {
  return (
    <header className="border-b border-ink-200 bg-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink-950 flex items-center justify-center text-solar-400 shadow-xs">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-heading font-extrabold text-sm sm:text-base text-ink-950 block leading-tight">
            CES Assessment Room
          </span>
          <span className="text-[11px] text-ink-500 font-medium">
            Citizens Elementary School · Discipleship Training
          </span>
        </div>
      </div>

      {/* Connectivity Status & Return Home */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isOnline
              ? 'bg-status-graduate-bg text-status-graduate-text'
              : 'bg-solar-100 text-solar-700'
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline (Saved)'}</span>
        </div>
        <Link
          href="/"
          className="text-xs font-semibold text-ink-600 hover:text-ink-950 flex items-center gap-1 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>
    </header>
  );
}

export function AssessFooter() {
  return (
    <footer className="border-t border-ink-200 bg-surface/50 py-4 px-4 text-center text-xs text-ink-500">
      Citizens Elementary School · Official Discipleship Training Platform · Citizens of Light Church, Ilorin
    </footer>
  );
}
