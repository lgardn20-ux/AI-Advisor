import Link from 'next/link';
import { getSampleDars, loadPlan } from '@/lib/store';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import { categorizeInProgressCourses } from '@/lib/semester';

export const dynamic = 'force-dynamic';

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

  return (
    <div className="space-y-6">
      {showRegAlert && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">Registration opening soon!</p>
            <p className="text-amber-700 text-sm">
              Your registration window opens on{' '}
              <strong>{regDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.{' '}
              Make sure your plan is finalized.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              <p className="text-gray-500 text-sm">
                {p.major}{p.minor ? ` · ${p.minor} Minor` : ''} · Class of {p.expectedGraduationSemester}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Catalog Year: {p.catalogYear}
              </p>
            </div>
            <span className="text-3xl">🎓</span>
          </div>

          <ProgressBar
            completed={p.totalCreditsCompleted}
            total={p.totalCreditsRequired}
            label="Credits completed"
            color="bg-blue-600"
          />

          <div className="grid grid-cols-4 gap-3 pt-2">
            <StatCard value={p.totalCreditsCompleted} label="Credits Done" color="text-blue-700" />
            <StatCard value={p.totalCreditsRequired - p.totalCreditsCompleted} label="Credits Left" color="text-orange-600" />
            <StatCard value={requiredRemaining} label="Req. Remaining" color="text-red-600" />
            <GPACard gpa={p.currentGPA} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Registration Countdown</h2>
          <CountdownTimer targetDate={p.registrationDate} label="Opens in" />
          <p className="text-xs text-gray-400">
            {regDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <Link
            href="/registration"
            className="mt-auto text-center text-sm bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
          >
            View Checklist →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">In Progress This Semester</h2>
              <p className="text-xs text-gray-400">{currentSemester.original}</p>
            </div>
            <span className="text-xs text-gray-400">{currentTermCourses.length} courses</span>
          </div>
          {currentTermCourses.length === 0 ? (
            <p className="text-gray-400 text-sm">No courses in progress for the current semester.</p>
          ) : (
            <ul className="space-y-2">
              {currentTermCourses.map(c => (
                <li key={c.courseCode} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                  <span className="font-medium text-gray-700">{c.courseCode}</span>
                  <span className="text-gray-500 truncate">{c.courseName}</span>
                  <span className="ml-auto text-gray-400">{c.credits}cr</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">Registered for Upcoming Semester</h2>
              {futureTermCourses.length > 0 && (
                <p className="text-xs text-gray-400">{futureTermCourses[0].semesterTaken}</p>
              )}
            </div>
            <span className="text-xs text-gray-400">{futureTermCourses.length} courses</span>
          </div>
          {futureTermCourses.length === 0 ? (
            <p className="text-gray-400 text-sm">No registered future courses found.</p>
          ) : (
            <ul className="space-y-2">
              {futureTermCourses.map(c => (
                <li key={c.courseCode} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                  <span className="font-medium text-gray-700">{c.courseCode}</span>
                  <span className="text-gray-500 truncate">{c.courseName}</span>
                  <span className="ml-auto text-gray-400">{c.credits}cr</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">Recent Courses</h2>
          <span className="text-xs text-gray-400">{completedCourses.length} completed</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {completedCourses.slice(-8).map(c => (
            <div key={c.courseCode} className="rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="text-xs font-semibold text-gray-700">{c.courseCode}</p>
              <p className="text-xs text-gray-500 truncate">{c.courseName}</p>
              <p className={`text-xs font-bold mt-0.5 ${gradeColor(c.grade)}`}>{c.grade}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function GPACard({ gpa }: { gpa: number }) {
  const color = gpa >= 3.5 ? 'text-green-600' : gpa >= 3.0 ? 'text-blue-700' : gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
      <p className={`text-3xl font-bold ${color}`}>{gpa.toFixed(2)}</p>
      <p className="text-xs text-gray-500 mt-0.5">Current GPA</p>
    </div>
  );
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-yellow-600';
  if (grade === 'IP') return 'text-gray-400';
  return 'text-red-600';
}
