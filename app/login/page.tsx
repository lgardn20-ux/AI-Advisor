'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Login failed');
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Academic<span className="text-primary">Advisor</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className={cn(
                    'w-full h-9 rounded-md border border-border bg-background px-3 text-sm',
                    'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring',
                    'transition-colors'
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <a href="#" className="text-xs text-primary hover:underline underline-offset-2">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      'w-full h-9 rounded-md border border-border bg-background px-3 pr-9 text-sm',
                      'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring',
                      'transition-colors'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline underline-offset-2">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
