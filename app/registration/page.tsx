'use client';

import { useEffect, useState } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
import type { DARSData, AcademicPlan } from '@/lib/types';

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
    label: 'Complete housing/meal plan selection',
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

const PRIORITY_LABEL: Record<ChecklistItem['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_COLOR: Record<ChecklistItem['priority'], string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-gray-500 bg-gray-50 border-gray-200',
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
  const highPriority = checklist.filter(i => i.priority === 'high');
  const medPriority = checklist.filter(i => i.priority === 'medium');
  const lowPriority = checklist.filter(i => i.priority === 'low');

  const nextSemester = plan?.semesters[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registration Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your registration preparation checklist and countdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dars && (
          <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Registration Window</h2>
            <CountdownTimer
              targetDate={dars.studentProfile.registrationDate}
              label="Opens in"
            />
            <div className="text-xs text-gray-400">
              {new Date(dars.studentProfile.registrationDate).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </div>
          </div>
        )}

        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Checklist Progress</h2>
            <span className="text-sm font-medium text-gray-600">{doneCount} / {checklist.length} complete</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.round((doneCount / checklist.length) * 100)}%` }}
            />
          </div>
          {doneCount === checklist.length ? (
            <p className="text-green-600 font-semibold text-sm">🎉 All items complete! You&apos;re ready to register.</p>
          ) : (
            <p className="text-gray-500 text-sm">
              Complete {checklist.length - doneCount} more item{checklist.length - doneCount > 1 ? 's' : ''} before registration.
            </p>
          )}
        </div>
      </div>

      {nextSemester && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Planned Courses — {nextSemester.semester}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {nextSemester.courses.map(c => (
              <div key={c.courseCode} className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700 text-sm">{c.courseCode}</span>
                  <span className="text-gray-500 text-sm ml-2">{c.courseName}</span>
                </div>
                <span className="ml-auto text-xs text-gray-400">{c.credits}cr</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Total: {nextSemester.totalCredits} credits
          </p>
        </div>
      )}

      <div className="space-y-3">
        {([['high', highPriority], ['medium', medPriority], ['low', lowPriority]] as const).map(([priority, items]) => (
          <div key={priority} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide border-b ${PRIORITY_COLOR[priority]}`}>
              {PRIORITY_LABEL[priority]} Priority
            </div>
            <ul className="divide-y divide-gray-100">
              {items.map(item => (
                <li
                  key={item.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors ${item.done ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {item.done && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className={item.done ? 'opacity-50' : ''}>
                    <p className={`text-sm font-medium ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
