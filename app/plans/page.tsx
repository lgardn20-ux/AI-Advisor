'use client';

import { useState, useRef } from 'react';
import type { DARSData, AcademicPlan, SemesterPlan, PlanGenerationPreferences, ChatMessage, ProfessorInfo } from '@/lib/types';

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
      } catch (error) {
        console.error(`Failed to load professor data for ${courseCode}:`, error);
      }
    }

    setProfessorData(newProfessorData);
  }

  async function generatePlan() {
    if (!dars) {
      await loadDars();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dars, preferences: prefs }),
      });
      const json = await res.json() as { plan?: AcademicPlan; error?: string };
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to generate plan');
      setPlan(json.plan!);
      setExpandedSem(json.plan!.semesters[0]?.semester ?? null);

      // Load professor data for all courses in the plan
      const allCourses = json.plan!.semesters.flatMap(sem => sem.courses.map(c => c.courseCode));
      const uniqueCourses = [...new Set(allCourses)];
      loadProfessorData(uniqueCourses);
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
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semester Plans</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI-generated semester-by-semester course plan
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {plan && (
            <button
              onClick={() => setChatOpen(o => !o)}
              className="text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-colors"
            >
              💬 Advisor Chat
            </button>
          )}
          <button
            onClick={generatePlan}
            disabled={loading}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 transition-colors"
          >
            {loading ? 'Generating…' : plan ? '↺ Regenerate Plan' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Plan Preferences</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Semesters remaining</span>
            <select
              value={prefs.semestersRemaining}
              onChange={e => setPrefs(p => ({ ...p, semestersRemaining: +e.target.value }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer pt-5">
            <input
              type="checkbox"
              checked={prefs.preferLighterLoad}
              onChange={e => setPrefs(p => ({ ...p, preferLighterLoad: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-600">Prefer lighter load</span>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer pt-5">
            <input
              type="checkbox"
              checked={prefs.summerAvailable}
              onChange={e => setPrefs(p => ({ ...p, summerAvailable: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-600">Summer available</span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Additional notes</span>
            <input
              value={prefs.additionalConstraints}
              onChange={e => setPrefs(p => ({ ...p, additionalConstraints: e.target.value }))}
              placeholder="e.g. avoid 8am classes"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Claude is building your personalized plan…</p>
          </div>
        </div>
      )}

      {!loading && !plan && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-5xl mb-4 block">📅</span>
          <p className="text-gray-500 text-sm">Click &quot;Generate Plan&quot; to create your AI-powered academic roadmap.</p>
        </div>
      )}

      {plan && !loading && (
        <div className="space-y-3">
          {plan.overallNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Advisor Notes:</strong> {plan.overallNotes}
            </div>
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

      {chatOpen && plan && dars && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 max-h-[32rem]">
          <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm">💬 Advisor Chat</span>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm min-h-0">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center text-xs py-4">
                Ask me anything about your plan, prerequisites, or course options!
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.content || <span className="animate-pulse text-gray-400">▌</span>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask about your plan…"
              disabled={chatLoading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SemesterCard({ sem, expanded, onToggle, professorData }: { sem: SemesterPlan; expanded: boolean; onToggle: () => void; professorData: Record<string, ProfessorInfo[]> }) {
  const [showAlts, setShowAlts] = useState<string | null>(null);
  const [showProfessors, setShowProfessors] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">{sem.semester}</span>
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {sem.totalCredits} credits
          </span>
          {sem.status === 'confirmed' && (
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Confirmed</span>
          )}
          {sem.warnings.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
              ⚠ {sem.warnings.length} warning{sem.warnings.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 pb-5 pt-4 space-y-4">
          {sem.notes && (
            <p className="text-sm text-gray-600 italic">{sem.notes}</p>
          )}
          {sem.warnings.length > 0 && (
            <ul className="space-y-1">
              {sem.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-1.5">⚠ {w}</li>
              ))}
            </ul>
          )}
          <div className="space-y-2">
            {sem.courses.map(c => {
              const professors = professorData[c.courseCode] || [];
              return (
                <div key={c.courseCode} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">{c.courseCode}</span>
                        <span className="text-gray-500 text-sm">{c.courseName}</span>
                        <span className="text-xs text-gray-400">{c.credits} cr</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-0.5">Fulfills: {c.requirementFulfilled}</p>
                      {professors.length > 0 && (
                        <button
                          onClick={() => setShowProfessors(showProfessors === c.courseCode ? null : c.courseCode)}
                          className="text-xs text-purple-600 hover:text-purple-800 mt-1 flex items-center gap-1"
                        >
                          👨‍🏫 {professors.length} professor{professors.length > 1 ? 's' : ''} available
                          <span className="text-xs">{showProfessors === c.courseCode ? '▲' : '▼'}</span>
                        </button>
                      )}
                    </div>
                    {c.alternatives.length > 0 && (
                      <button
                        onClick={() => setShowAlts(showAlts === c.courseCode ? null : c.courseCode)}
                        className="text-xs text-gray-500 hover:text-blue-600 whitespace-nowrap flex-shrink-0"
                      >
                        {showAlts === c.courseCode ? 'Hide' : `${c.alternatives.length} alt${c.alternatives.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>

                  {showProfessors === c.courseCode && professors.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-purple-200 space-y-3">
                      <p className="text-xs font-medium text-purple-700 mb-2">Professor Reviews:</p>
                      {professors.map((prof, idx) => (
                        <ProfessorCard key={idx} professor={prof} />
                      ))}
                    </div>
                  )}

                  {showAlts === c.courseCode && (
                    <div className="mt-2 pl-3 border-l-2 border-blue-200 space-y-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Alternatives:</p>
                      {c.alternatives.map(alt => (
                        <div key={alt.courseCode} className="text-xs">
                          <span className="font-medium text-gray-700">{alt.courseCode} {alt.courseName}</span>
                          <span className="text-gray-400 ml-1">({alt.credits} cr)</span>
                          <span className="text-gray-500"> — {alt.reason}</span>
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
    </div>
  );
}

function ProfessorCard({ professor }: { professor: ProfessorInfo }) {
  const [showComments, setShowComments] = useState(false);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600 bg-green-50';
    if (rating >= 3.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2.5) return 'text-green-600';
    if (difficulty <= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-purple-100 p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{professor.name}</h4>
          <p className="text-xs text-gray-500">{professor.department}</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(professor.rating)}`}>
            ⭐ {professor.rating.toFixed(1)}
          </div>
          <p className="text-xs text-gray-500 mt-1">{professor.totalRatings} ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-500">Would take again:</span>
          <span className="font-medium text-green-600 ml-1">{professor.wouldTakeAgainPercent}%</span>
        </div>
        <div>
          <span className="text-gray-500">Difficulty:</span>
          <span className={`font-medium ml-1 ${getDifficultyColor(professor.difficulty)}`}>
            {professor.difficulty.toFixed(1)}/5
          </span>
        </div>
      </div>

      {professor.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {professor.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {professor.recentComments.length > 0 && (
        <div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            💬 {showComments ? 'Hide' : 'Show'} comments ({professor.recentComments.length})
            <span className="text-xs">{showComments ? '▲' : '▼'}</span>
          </button>
          {showComments && (
            <div className="mt-2 space-y-2">
              {professor.recentComments.map((comment, idx) => (
                <blockquote key={idx} className="text-xs text-gray-600 italic border-l-2 border-purple-200 pl-2">
                  "{comment}"
                </blockquote>
              ))}
            </div>
          )}
        </div>
      )}

      {professor.semestersTaught.length > 0 && (
        <p className="text-xs text-gray-400">
          Taught: {professor.semestersTaught.join(', ')}
        </p>
      )}
    </div>
  );
}
