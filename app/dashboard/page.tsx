import Link from 'next/link';
import { getSampleDars, loadPlan } from '@/lib/store';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import { categorizeInProgressCourses } from '@/lib/semester';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  CalendarDays,
  Layers,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade === 'IP') return 'text-muted-foreground';
  return 'text-destructive';
}

function gradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-50';
  if (grade.startsWith('B')) return 'bg-blue-50';
  if (grade.startsWith('C')) return 'bg-amber-50';
  return 'bg-muted';
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.5) return 'text-emerald-600';
  if (gpa >= 3.0) return 'text-blue-600';
  if (gpa >= 2.0) return 'text-amber-600';
  return 'text-destructive';
}

export default function DashboardPage() {
  const dars = getSampleDars();
  const plan = loadPlan(dars.studentProfile.studentId);
  const { studentProfile: p, completedCourses, inProgressCourses, remainingRequirements } = dars;
  const { currentTermCourses, futureTermCourses, currentSemester } = categorizeInProgressCourses(inProgressCourses);

  const regDate = new Date(p.registrationDate);
  const now = new Date();
  const daysUntilReg = Math.ceil((regDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const showRegAlert = daysUntilReg > 0 && daysUntilReg <= p.registrationReminderDays;

  const nextSemester = plan?.semesters[0];
  const requiredRemaining = remainingRequirements.filter(r => r.priority === 'required').length;
  const creditsLeft = p.totalCreditsRequired - p.totalCreditsCompleted;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

      {/* Registration alert */}
      {showRegAlert && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Registration opening in {daysUntilReg} day{daysUntilReg !== 1 ? 's' : ''}</AlertTitle>
          <AlertDescription>
            Your window opens{' '}
            <strong>{regDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.{' '}
            <Link href="/registration" className="underline underline-offset-2 font-medium">View your checklist →</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Top row: profile + countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Student profile card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>
                    {p.major}{p.minor ? ` · ${p.minor} Minor` : ''} · {p.catalogYear}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="flex-shrink-0 hidden sm:flex">
                {p.expectedGraduationSemester}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressBar
              completed={p.totalCreditsCompleted}
              total={p.totalCreditsRequired}
              label="Degree progress"
              size="lg"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Credits Done', value: p.totalCreditsCompleted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Credits Left', value: creditsLeft, icon: Circle, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Reqs Remaining', value: requiredRemaining, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Current GPA', value: p.currentGPA.toFixed(2), icon: TrendingUp, color: gpaColor(p.currentGPA), bg: 'bg-muted', isGpa: true },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={cn('rounded-lg p-3 text-center', bg)}>
                  <Icon className={cn('h-4 w-4 mx-auto mb-1.5', color)} strokeWidth={1.75} />
                  <div className={cn('text-xl font-bold tabular-nums leading-none', color)}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Registration countdown card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Registration
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CountdownTimer targetDate={p.registrationDate} label="Opens in" />
            <p className="text-xs text-muted-foreground">
              {regDate.toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/registration">
                View Checklist
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: in-progress + upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">In Progress</CardTitle>
              </div>
              <Badge variant="secondary">{currentSemester.original}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentTermCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No courses in progress.</p>
            ) : (
              <ul className="space-y-2">
                {currentTermCourses.map(c => (
                  <li key={c.courseCode} className="flex items-center gap-3 rounded-lg p-2.5 bg-muted/50 hover:bg-muted transition-colors">
                    <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{c.courseCode}</span>
                      <span className="text-sm text-muted-foreground ml-2 truncate">{c.courseName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{c.credits} cr</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">
                  {plan ? 'Next Planned Semester' : 'No Plan Yet'}
                </CardTitle>
              </div>
              {nextSemester && (
                <Badge variant="default">{nextSemester.semester}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {futureTermCourses.length > 0 && (
              <ul className="space-y-2 mb-4">
                {futureTermCourses.map(c => (
                  <li key={c.courseCode} className="flex items-center gap-3 rounded-lg p-2.5 bg-primary/5 hover:bg-primary/8 transition-colors">
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{c.courseCode}</span>
                      <span className="text-sm text-muted-foreground ml-2 truncate">{c.courseName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{c.credits} cr</Badge>
                  </li>
                ))}
              </ul>
            )}
            {!plan ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Generate an AI plan to preview upcoming semesters.
                </p>
                <Button asChild size="sm">
                  <Link href="/plans">
                    Generate Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : nextSemester ? (
              <>
                {futureTermCourses.length === 0 && (
                  <ul className="space-y-2 mb-3">
                    {nextSemester.courses.map(c => (
                      <li key={c.courseCode} className="flex items-center gap-3 rounded-lg p-2.5 bg-primary/5">
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{c.courseCode}</span>
                          <span className="text-sm text-muted-foreground ml-2 truncate">{c.courseName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{c.credits} cr</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">{nextSemester.totalCredits} credits total</span>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                    <Link href="/plans">View full plan →</Link>
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Recent courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Courses</CardTitle>
            <span className="text-xs text-muted-foreground">{completedCourses.length} total completed</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {completedCourses.slice(-8).map(c => (
              <div
                key={c.courseCode}
                className="rounded-lg border border-border p-2.5 space-y-1.5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-foreground truncate">{c.courseCode}</p>
                  <span className={cn(
                    'text-xs font-bold rounded px-1 py-0.5 flex-shrink-0',
                    gradeColor(c.grade), gradeBg(c.grade)
                  )}>
                    {c.grade}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{c.courseName}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
