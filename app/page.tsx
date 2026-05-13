import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Upload,
  Zap,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Clock,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Upload,
    title: 'Upload Your DARS',
    description: 'Drag and drop your Degree Audit Report — as a PDF, image, or paste JSON. Our AI extracts every course, grade, and requirement in seconds.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    title: 'AI Generates Your Plan',
    description: "Claude analyzes your transcript, prerequisites, and graduation requirements to build a smart semester-by-semester plan tailored to you.",
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: CheckCircle2,
    title: 'Stay on Track',
    description: 'Monitor your progress with a live registration countdown, a pre-registration checklist, and an AI advisor you can chat with any time.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

const STATS = [
  { value: '< 30s',  label: 'Plan generation' },
  { value: '100%',   label: 'Prereq-aware' },
  { value: '3x',     label: 'Alternatives per course' },
  { value: 'Live',   label: 'Registration countdown' },
];

const TRUST = [
  { icon: ShieldCheck, text: 'FERPA-aware data handling' },
  { icon: Clock, text: 'Real-time registration countdowns' },
  { icon: BarChart3, text: 'Credit & GPA progress tracking' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Subtle radial gradient background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 text-xs font-medium border-primary/20 text-primary bg-primary/5">
            <Sparkles className="h-3 w-3" />
            Powered by Claude AI
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Graduate on time —{' '}
            <span className="gradient-text">with a plan built by AI</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            Upload your DARS report and get a complete, prerequisite-aware semester plan in under 30 seconds. Then chat with your AI advisor whenever questions come up.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" asChild>
              <Link href="/dars">
                <Upload className="h-4 w-4" />
                Upload Your DARS
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/dashboard">
                View Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Everything you need to finish strong
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From DARS analysis to semester planning to registration prep — one tool, every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="group relative rounded-xl border border-border bg-card p-6 card-shadow hover:card-shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-muted/30 border-t border-border/60">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <GraduationCap className="h-7 w-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Your degree is a plan away
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Upload your DARS and let AI do the hard work. It takes less than a minute.
          </p>
          <Button size="xl" asChild>
            <Link href="/dars">
              Start Planning Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-muted/20 px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">AcademicAdvisor</span>
            <span>&mdash; AI-powered degree planning</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} AcademicAdvisor</span>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
