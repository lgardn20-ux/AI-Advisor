'use client';

import { useEffect, useState } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
import ProgressBar from '@/components/ProgressBar';
import type { DARSData, AcademicPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarDays,
  BookOpen,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

const BASE_CHECKLIST: Omit<ChecklistItem, 'done'>[] = [
  {
    id: 'advisor',
    label: 'Meet with academic advisor',
    description: 'Schedule and attend an advising appointment to confirm your plan.',
    priority: 'high',
  },
  {
    id: 'holds',
    label: 'Clear any registration holds',
    description: 'Check student portal for financial, academic, or administrative holds.',
    priority: 'high',
  },
  {
    id: 'prereqs',
    label: 'Verify prerequisites are met',
    description: 'Confirm all prerequisites for next semester courses are completed or in progress.',
    priority: 'high',
  },
  {
    id: 'review-plan',
    label: 'Review your semester plan',
    description: 'Check the Semester Plans page and confirm your course selections.',
    priority: 'high',
  },
  {
    id: 'time-slots',
    label: 'Check course time conflicts',
    description: 'Look up section times in the course catalog and ensure no overlaps.',
    priority: 'medium',
  },
  {
    id: 'waitlist',
    label: 'Identify waitlist alternatives',
    description: 'Have 1–2 backup courses ready in case your first choices are full.',
    priority: 'medium',
  },
  {
    id: 'financial-aid',
    label: 'Confirm financial aid for next semester',
    description: 'Ensure enrollment will meet required credit minimums for aid eligibility.',
    priority: 'medium',
  },
  {
    id: 'housing',
    label: 'Complete housing / meal plan selection',
    description: 'If applicable, submit housing preferences before the deadline.',
    priority: 'low',
  },
  {
    id: 'textbooks',
    label: 'Look up required textbooks',
    description: 'Check course syllabi or bookstore listings to budget for materials.',
    priority: 'low',
  },
];

const PRIORITY_META = {
  high:   { label: 'High Priority',   variant: 'destructive' as const, dot: 'bg-destructive' },
  medium: { label: 'Medium Priority', variant: 'warning'     as const, dot: 'bg-amber-400'   },
  low:    { label: 'Low Priority',    variant: 'secondary'   as const, dot: 'bg-muted-foreground' },
};

export default function RegistrationPage() {
  const [dars, setDars] = useState<DARSData | null>(null);
  const [plan, setPlan] = useState<AcademicPlan | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    BASE_CHECKLIST.map(item => ({ ...item, done: false }))
  );

  useEffect(() => {
    fetch('/api/sample-dars')
      .then(r => r.json())
      .then((data: DARSData) => {
        setDars(data);
        const studentId = data.studentProfile.studentId;
        fetch(`/api/load-plan?studentId=${encodeURIComponent(studentId)}`)
          .then(r => r.json())
          .then((p: { plan: AcademicPlan | null }) => { if (p.plan) setPlan(p.plan); })
          .catch(() => {});
      })
      .catch(() => {});

    const saved = localStorage.getItem('reg-checklist');
    if (saved) {
      try {
        const savedItems = JSON.parse(saved) as Record<string, boolean>;
        setChecklist(prev => prev.map(item => ({ ...item, done: savedItems[item.id] ?? false })));
      } catch {
        // ignore
      }
    }
  }, []);

  function toggleItem(id: string) {
    setChecklist(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, done: !item.done } : item);
      const saved: Record<string, boolean> = {};
      updated.forEach(item => { saved[item.id] = item.done; });
      localStorage.setItem('reg-checklist', JSON.stringify(saved));
      return updated;
    });
  }

  const doneCount = checklist.filter(i => i.done).length;
  const allDone = doneCount === checklist.length;
  const nextSemester = plan?.semesters[0];

  const grouped = (['high', 'medium', 'low'] as const).map(priority => ({
    priority,
    items: checklist.filter(i => i.priority === priority),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Registration Tracker</h1>
        <p className="text-muted-foreground text-sm">
          Complete your pre-registration checklist and track the countdown to your registration window.
        </p>
      </div>

      {/* All done banner */}
      {allDone && (
        <Alert variant="success">
          <PartyPopper className="h-4 w-4" />
          <AlertTitle>You&apos;re ready to register!</AlertTitle>
          <AlertDescription>All checklist items are complete. Good luck with registration.</AlertDescription>
        </Alert>
      )}

      {/* Top row: countdown + progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Countdown card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Registration Window
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dars ? (
              <>
                <CountdownTimer targetDate={dars.studentProfile.registrationDate} label="Opens in" />
                <p className="text-xs text-muted-foreground">
                  {new Date(dars.studentProfile.registrationDate).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
            )}
          </CardContent>
        </Card>

        {/* Checklist progress card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Checklist Progress</CardTitle>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {doneCount} / {checklist.length}
              </span>
            </div>
            <CardDescription>Complete all items before your registration window opens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              completed={doneCount}
              total={checklist.length}
              size="lg"
              color={allDone ? 'bg-emerald-500' : undefined}
            />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {(['high', 'medium', 'low'] as const).map(p => {
                const group = checklist.filter(i => i.priority === p);
                const done = group.filter(i => i.done).length;
                return (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', PRIORITY_META[p].dot)} />
                    <span className="capitalize">{p}: {done}/{group.length}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planned courses */}
      {nextSemester ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Planned Courses — {nextSemester.semester}</CardTitle>
              </div>
              <Badge variant="outline">{nextSemester.totalCredits} credits total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nextSemester.courses.map(c => (
                <div
                  key={c.courseCode}
                  className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-foreground">{c.courseCode}</span>
                    <span className="text-sm text-muted-foreground ml-2 truncate">{c.courseName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{c.credits} cr</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No plan generated yet</p>
                <p className="text-xs text-muted-foreground">Generate a plan to see your upcoming courses here.</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/plans">
                Generate Plan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Checklist sections */}
      <div className="space-y-4">
        {grouped.map(({ priority, items }) => (
          <Card key={priority} className="overflow-hidden">
            <div className={cn(
              'px-6 py-2.5 border-b border-border flex items-center gap-2',
              priority === 'high' ? 'bg-destructive/5' : priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/40'
            )}>
              <span className={cn('h-2 w-2 rounded-full flex-shrink-0', PRIORITY_META[priority].dot)} />
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {PRIORITY_META[priority].label}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {items.filter(i => i.done).length}/{items.length} done
              </span>
            </div>
            <ul className="divide-y divide-border">
              {items.map(item => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer select-none',
                    item.done ? 'bg-muted/30' : 'hover:bg-muted/30'
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.done
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500 flex-shrink-0" />
                    : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                  }
                  <div className={cn('space-y-0.5', item.done && 'opacity-50')}>
                    <p className={cn(
                      'text-sm font-medium transition-colors',
                      item.done ? 'line-through text-muted-foreground' : 'text-foreground'
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
