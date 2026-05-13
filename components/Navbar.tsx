'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  CalendarDays,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dars',      label: 'DARS Upload',  icon: FileText },
  { href: '/plans',     label: 'Semester Plans',icon: CalendarDays },
  { href: '/registration', label: 'Registration', icon: ClipboardList },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-15 items-center justify-between" style={{ height: '3.75rem' }}>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" style={{ height: '1.125rem', width: '1.125rem' }} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Academic<span className="text-primary">Advisor</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {!isHome && (
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {isHome ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/dars"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                >
                  Get started
                </Link>
              </>
            ) : (
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background animate-slide-down">
          <nav className="mx-auto max-w-7xl px-4 py-3 space-y-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border/60 flex gap-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                href="/dars"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
