import type { DARSData, CompletedCourse, RemainingRequirement, StudentProfile, AcademicPlan, SemesterPlan } from './types';

export interface ParseResult {
  success: boolean;
  data?: DARSData;
  errors: string[];
}

function isStudentProfile(obj: unknown): obj is StudentProfile {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    typeof p.studentId === 'string' &&
    typeof p.major === 'string' &&
    typeof p.catalogYear === 'string' &&
    typeof p.totalCreditsCompleted === 'number' &&
    typeof p.totalCreditsRequired === 'number' &&
    typeof p.currentGPA === 'number' &&
    typeof p.expectedGraduationSemester === 'string'
  );
}

function isCourse(obj: unknown): obj is CompletedCourse {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.courseCode === 'string' &&
    typeof c.courseName === 'string' &&
    typeof c.credits === 'number' &&
    typeof c.grade === 'string' &&
    typeof c.semesterTaken === 'string' &&
    Array.isArray(c.fulfills)
  );
}

function isRequirement(obj: unknown): obj is RemainingRequirement {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.requirementCategory === 'string' &&
    Array.isArray(r.courseOptions) &&
    typeof r.creditsNeeded === 'number' &&
    (r.priority === 'required' || r.priority === 'recommended' || r.priority === 'elective') &&
    Array.isArray(r.prerequisites) &&
    Array.isArray(r.corequisites)
  );
}

export function parseDarsJson(input: string): ParseResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { success: false, errors: ['Invalid JSON: could not parse input.'] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, errors: ['Root value must be a JSON object.'] };
  }

  const root = parsed as Record<string, unknown>;

  if (!root.studentProfile) {
    errors.push('Missing required field: studentProfile');
  } else if (!isStudentProfile(root.studentProfile)) {
    errors.push('studentProfile is missing required fields (name, studentId, major, catalogYear, totalCreditsCompleted, totalCreditsRequired, currentGPA, expectedGraduationSemester)');
  }

  if (!Array.isArray(root.completedCourses)) {
    errors.push('Missing or invalid field: completedCourses (must be an array)');
  } else {
    (root.completedCourses as unknown[]).forEach((c, i) => {
      if (!isCourse(c)) errors.push(`completedCourses[${i}] is missing required fields`);
    });
  }

  if (!Array.isArray(root.inProgressCourses)) {
    errors.push('Missing or invalid field: inProgressCourses (must be an array)');
  } else {
    (root.inProgressCourses as unknown[]).forEach((c, i) => {
      if (!isCourse(c)) errors.push(`inProgressCourses[${i}] is missing required fields`);
    });
  }

  if (!Array.isArray(root.remainingRequirements)) {
    errors.push('Missing or invalid field: remainingRequirements (must be an array)');
  } else {
    (root.remainingRequirements as unknown[]).forEach((r, i) => {
      if (!isRequirement(r)) errors.push(`remainingRequirements[${i}] is missing required fields`);
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const profile = root.studentProfile as StudentProfile;
  if (!profile.registrationDate) {
    profile.registrationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (typeof profile.registrationReminderDays !== 'number') {
    profile.registrationReminderDays = 14;
  }

  return {
    success: true,
    data: {
      studentProfile: profile,
      completedCourses: root.completedCourses as CompletedCourse[],
      inProgressCourses: root.inProgressCourses as CompletedCourse[],
      remainingRequirements: root.remainingRequirements as RemainingRequirement[],
    },
    errors: [],
  };
}

function isSemesterPlan(obj: unknown): obj is SemesterPlan {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.semester === 'string' &&
    Array.isArray(s.courses) &&
    typeof s.totalCredits === 'number' &&
    (s.status === 'draft' || s.status === 'confirmed') &&
    typeof s.notes === 'string' &&
    Array.isArray(s.warnings)
  );
}

export function isValidAcademicPlan(obj: unknown): obj is AcademicPlan {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.studentId === 'string' &&
    typeof p.generatedAt === 'string' &&
    Array.isArray(p.semesters) &&
    (p.semesters as unknown[]).every(s => isSemesterPlan(s)) &&
    typeof p.overallNotes === 'string'
  );
}
