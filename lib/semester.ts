import type { CompletedCourse } from './types';

export type SemesterSeason = 'spring' | 'summer' | 'fall' | 'winter';

const seasonOrder: Record<SemesterSeason, number> = {
  spring: 0,
  summer: 1,
  fall: 2,
  winter: 3,
};

export interface ParsedSemester {
  season: SemesterSeason;
  year: number;
  original: string;
}

export function parseSemesterTerm(term: string): ParsedSemester | null {
  const normalized = term.trim().toLowerCase();
  const match = normalized.match(/^(spring|summer|fall|winter)\s+(\d{4})$/i);
  if (!match) return null;

  const season = match[1].toLowerCase() as SemesterSeason;
  const year = Number(match[2]);
  if (Number.isNaN(year)) return null;

  return { season, year, original: `${season.charAt(0).toUpperCase()}${season.slice(1)} ${year}` };
}

export function getSemesterOrder(term: ParsedSemester): number {
  return term.year * 10 + seasonOrder[term.season];
}

export function formatSemester(term: ParsedSemester): string {
  return `${term.season.charAt(0).toUpperCase()}${term.season.slice(1)} ${term.year}`;
}

export function getAcademicSemesterForDate(date = new Date()): ParsedSemester {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 1 && month <= 4) {
    return { season: 'spring', year, original: `Spring ${year}` };
  }

  if (month >= 5 && month <= 7) {
    return { season: 'summer', year, original: `Summer ${year}` };
  }

  if (month >= 8 && month <= 11) {
    return { season: 'fall', year, original: `Fall ${year}` };
  }

  return { season: 'winter', year, original: `Winter ${year}` };
}

export function getNextAcademicSemester(current: ParsedSemester): ParsedSemester {
  const nextSeasonIndex = seasonOrder[current.season] + 1;
  const seasons: SemesterSeason[] = ['spring', 'summer', 'fall', 'winter'];
  if (nextSeasonIndex < seasons.length) {
    return { season: seasons[nextSeasonIndex], year: current.year, original: `${seasons[nextSeasonIndex][0].toUpperCase()}${seasons[nextSeasonIndex].slice(1)} ${current.year}` };
  }

  return { season: 'spring', year: current.year + 1, original: `Spring ${current.year + 1}` };
}

export function categorizeInProgressCourses(courses: CompletedCourse[], currentDate = new Date()) {
  const currentSemester = getAcademicSemesterForDate(currentDate);
  const currentOrder = getSemesterOrder(currentSemester);

  const currentTermCourses: CompletedCourse[] = [];
  const futureTermCourses: CompletedCourse[] = [];

  courses.forEach(course => {
    const parsed = parseSemesterTerm(course.semesterTaken);
    if (!parsed) {
      currentTermCourses.push(course);
      return;
    }

    const courseOrder = getSemesterOrder(parsed);
    if (courseOrder === currentOrder) {
      currentTermCourses.push(course);
      return;
    }

    if (courseOrder > currentOrder) {
      futureTermCourses.push(course);
      return;
    }

    currentTermCourses.push(course);
  });

  const sortBySemester = (a: CompletedCourse, b: CompletedCourse) => {
    const aTerm = parseSemesterTerm(a.semesterTaken);
    const bTerm = parseSemesterTerm(b.semesterTaken);
    if (!aTerm || !bTerm) return 0;
    return getSemesterOrder(aTerm) - getSemesterOrder(bTerm);
  };

  return {
    currentTermCourses: currentTermCourses.sort(sortBySemester),
    futureTermCourses: futureTermCourses.sort(sortBySemester),
    currentSemester,
  };
}

export function getLatestReservedSemester(courses: CompletedCourse[], currentDate = new Date()) {
  const semesters = courses
    .map(course => parseSemesterTerm(course.semesterTaken))
    .filter((term): term is ParsedSemester => term !== null);

  if (semesters.length === 0) {
    return getAcademicSemesterForDate(currentDate);
  }

  const latest = semesters.reduce((prev, next) =>
    getSemesterOrder(next) > getSemesterOrder(prev) ? next : prev
  );

  return latest;
}
