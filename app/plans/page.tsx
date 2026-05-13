'use client';

import { useState, useRef } from 'react';
import type { DARSData, AcademicPlan, SemesterPlan, PlanGenerationPreferences, ChatMessage, ProfessorInfo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EmptyState from '@/components/EmptyState';
import {
  Loader2,
  RefreshCw,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  User,
  SendHorizonal,
  Info,
  Star,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlansPage() {
  const [dars, setDars] = useState<DARSData | null>(null);
  const [plan, setPlan] = useState<AcademicPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSem, setExpandedSem] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [professorData, setProfessorData] = useState<Record<string, ProfessorInfo[]>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [prefs, setPrefs] = useState<PlanGenerationPreferences>({
    semestersRemaining: 4,
    preferLighterLoad: false,
    summerAvailable: false,
    priorityCourses: [],
    additionalConstraints: '',
  });

  async function loadDars() {
    const res = await fetch('/api/sample-dars');
    const data = await res.json() as DARSData;
    setDars(data);
    return data;
  }

  async function loadProfessorData(courseCodes: string[]) {
    const newProfessorData: Record<string, ProfessorInfo[]> = {};
    for (const courseCode of courseCodes) {
      try {
        const res = await fetch(`/api/professors?courseCode=${encodeURIComponent(courseCode)}`);
        if (res.ok) {
          const data = await res.json();
          newProfessorData[courseCode] = data.professors || [];
        }
      } catch {
        // silently ignore
      }
    }
    setProfessorData(newProfessorData);
  }

  async function generatePlan() {
    setLoading(true);
    setError('');
    try {
      const activeDars = dars ?? await loadDars();
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dars: activeDars, preferences: prefs }),
      });
      const json = await res.json() as { plan?: AcademicPlan; error?: string };
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to generate plan');
      setPlan(json.plan!);
      setExpandedSem(json.plan!.semesters[0]?.semester ?? null);
      const allCourses = json.plan!.semesters.flatMap(sem => sem.courses.map(c => c.courseCode));
      loadProfessorData([...new Set(allCourses)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !dars) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    try {
      const res = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dars, plan, messages: newMessages }),
      });
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...assistantMsg, content: assistantText };
          return updated;
        });
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Semester Plans</h1>
          <p className="text-muted-foreground text-sm">
            AI-generated semester-by-semester course plan tailored to your DARS.
          </p>
        </div>
        <div className="flex gap-2">
          {plan && (
            <Button
              variant="outline"
              onClick={() => setChatOpen(o => !o)}
            >
              <MessageCircle className="h-4 w-4" />
              Advisor Chat
            </Button>
          )}
          <Button onClick={generatePlan} loading={loading}>
            {!loading && (plan ? <RefreshCw className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />)}
            {loading ? 'Generating…' : plan ? 'Regenerate Plan' : 'Generate Plan'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plan Preferences</CardTitle>
          <CardDescription>Customize how Claude builds your academic roadmap.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Semesters remaining</label>
              <select
                value={prefs.semestersRemaining}
                onChange={e => setPrefs(p => ({ ...p, semestersRemaining: +e.target.value }))}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Additional notes</label>
              <input
                value={prefs.additionalConstraints}
                onChange={e => setPrefs(p => ({ ...p, additionalConstraints: e.target.value }))}
                placeholder="e.g. avoid 8am classes"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer sm:pt-5">
              <input
                type="checkbox"
                checked={prefs.preferLighterLoad}
                onChange={e => setPrefs(p => ({ ...p, preferLighterLoad: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Prefer lighter load</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer sm:pt-5">
              <input
                type="checkbox"
                checked={prefs.summerAvailable}
                onChange={e => setPrefs(p => ({ ...p, summerAvailable: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Summer available</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">Building your personalized plan…</p>
              <p className="text-sm text-muted-foreground">Claude is analyzing your DARS and prerequisites. This takes 20–40 seconds.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !plan && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarDays}
              title="No plan generated yet"
              description='Set your preferences above, then click "Generate Plan" to create your AI-powered academic roadmap.'
              action={
                <Button onClick={generatePlan}>
                  <CalendarDays className="h-4 w-4" />
                  Generate Plan
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Plan */}
      {plan && !loading && (
        <div className="space-y-4 animate-slide-up">
          {plan.overallNotes && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Advisor Notes</AlertTitle>
              <AlertDescription>{plan.overallNotes}</AlertDescription>
            </Alert>
          )}

          {plan.semesters.map(sem => (
            <SemesterCard
              key={sem.semester}
              sem={sem}
              expanded={expandedSem === sem.semester}
              onToggle={() => setExpandedSem(expandedSem === sem.semester ? null : sem.semester)}
              professorData={professorData}
            />
          ))}
        </div>
      )}

      {/* Chat panel */}
      {chatOpen && plan && (
        <div className="fixed bottom-4 right-4 w-96 bg-background rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden z-50 max-h-[32rem]">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
              <span className="font-semibold text-sm text-primary-foreground">Advisor Chat</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors rounded-md p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm min-h-0">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-center text-xs py-6">
                Ask me anything about your plan, prerequisites, or course options.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}>
                  {m.content || <span className="text-muted-foreground animate-pulse">▌</span>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask about your plan…"
              disabled={chatLoading}
              className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 placeholder:text-muted-foreground/50"
            />
            <Button
              size="icon"
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              loading={chatLoading}
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SemesterCard({
  sem,
  expanded,
  onToggle,
  professorData,
}: {
  sem: SemesterPlan;
  expanded: boolean;
  onToggle: () => void;
  professorData: Record<string, ProfessorInfo[]>;
}) {
  const [showAlts, setShowAlts] = useState<string | null>(null);
  const [showProfessors, setShowProfessors] = useState<string | null>(null);

  const isLight = sem.totalCredits < 12;
  const isHeavy = sem.totalCredits > 17;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-foreground">{sem.semester}</span>
          <Badge
            variant={isHeavy ? 'warning' : isLight ? 'secondary' : 'default'}
            className="text-[11px]"
          >
            {sem.totalCredits} credits
          </Badge>
          {sem.status === 'confirmed' && (
            <Badge variant="success" className="text-[11px]">
              <CheckCircle2 className="h-3 w-3" />
              Confirmed
            </Badge>
          )}
          {sem.warnings.length > 0 && (
            <Badge variant="warning" className="text-[11px]">
              <AlertTriangle className="h-3 w-3" />
              {sem.warnings.length} warning{sem.warnings.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-6 pb-5 pt-4 space-y-4">
          {sem.notes && (
            <p className="text-sm text-muted-foreground italic">{sem.notes}</p>
          )}

          {sem.warnings.length > 0 && (
            <div className="space-y-1.5">
              {sem.warnings.map((w, i) => (
                <Alert key={i} variant="warning" className="py-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">{w}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {sem.courses.map(c => {
              const professors = professorData[c.courseCode] || [];
              return (
                <div key={c.courseCode} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{c.courseCode}</span>
                        <span className="text-sm text-muted-foreground truncate">{c.courseName}</span>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">{c.credits} cr</Badge>
                      </div>
                      <p className="text-xs text-primary font-medium">Fulfills: {c.requirementFulfilled}</p>
                      {professors.length > 0 && (
                        <button
                          onClick={() => setShowProfessors(showProfessors === c.courseCode ? null : c.courseCode)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                        >
                          <User className="h-3 w-3" />
                          {professors.length} professor{professors.length > 1 ? 's' : ''} available
                          {showProfessors === c.courseCode
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                    {c.alternatives.length > 0 && (
                      <button
                        onClick={() => setShowAlts(showAlts === c.courseCode ? null : c.courseCode)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                      >
                        {showAlts === c.courseCode ? 'Hide alts' : `${c.alternatives.length} alt${c.alternatives.length > 1 ? 's' : ''}`}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {showProfessors === c.courseCode && professors.length > 0 && (
                    <div className="pl-3 border-l-2 border-primary/30 space-y-2 mt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Professor Reviews</p>
                      {professors.map((prof, idx) => (
                        <ProfessorCard key={idx} professor={prof} />
                      ))}
                    </div>
                  )}

                  {showAlts === c.courseCode && (
                    <div className="pl-3 border-l-2 border-border space-y-1.5 mt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Alternatives</p>
                      {c.alternatives.map(alt => (
                        <div key={alt.courseCode} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-foreground">{alt.courseCode}</span>
                          <span className="text-muted-foreground">{alt.courseName}</span>
                          <Badge variant="secondary" className="text-[9px] flex-shrink-0">{alt.credits} cr</Badge>
                          <span className="text-muted-foreground flex-shrink-0 hidden sm:block">— {alt.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function ProfessorCard({ professor }: { professor: ProfessorInfo }) {
  const [showComments, setShowComments] = useState(false);

  const ratingVariant = professor.rating >= 4.0 ? 'success' : professor.rating >= 3.0 ? 'warning' : 'destructive';

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-foreground">{professor.name}</p>
          <p className="text-xs text-muted-foreground">{professor.department}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <Badge variant={ratingVariant} className="text-[11px] gap-1">
            <Star className="h-2.5 w-2.5" />
            {professor.rating.toFixed(1)}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1">{professor.totalRatings} ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Would take again:</span>
          <span className="font-medium text-foreground">{professor.wouldTakeAgainPercent}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Difficulty:</span>
          <span className="font-medium text-foreground">{professor.difficulty.toFixed(1)}/5</span>
        </div>
      </div>

      {professor.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {professor.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      )}

      {professor.recentComments.length > 0 && (
        <div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            {showComments ? 'Hide' : 'Show'} comments ({professor.recentComments.length})
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showComments && (
            <div className="mt-2 space-y-1.5">
              {professor.recentComments.map((comment, idx) => (
                <blockquote key={idx} className="text-xs text-muted-foreground italic border-l-2 border-border pl-2 leading-relaxed">
                  &ldquo;{comment}&rdquo;
                </blockquote>
              ))}
            </div>
          )}
        </div>
      )}

      {professor.semestersTaught.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Taught: {professor.semestersTaught.join(', ')}
        </p>
      )}
    </div>
  );
}
