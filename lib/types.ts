export interface StudentProfile {
  name: string;
  studentId: string;
  major: string;
  minor?: string;
  catalogYear: string;
  totalCreditsCompleted: number;
  totalCreditsRequired: number;
  currentGPA: number;
  expectedGraduationSemester: string;
  registrationDate: string; // ISO date string
  registrationReminderDays: number;
}

export interface CompletedCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: string;
  semesterTaken: string;
  fulfills: string[];
}

export interface RemainingRequirement {
  requirementCategory: string;
  courseOptions: string[];
  creditsNeeded: number;
  priority: "required" | "recommended" | "elective";
  prerequisites: string[];
  corequisites: string[];
  semesterAvailability?: "fall" | "spring" | "both";
  notes?: string;
}

export interface PlannedCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  requirementFulfilled: string;
  timeSlot?: string;
  alternatives: AlternativeCourse[];
}

export interface AlternativeCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  reason: string;
}

export interface SemesterPlan {
  semester: string;
  courses: PlannedCourse[];
  totalCredits: number;
  status: "draft" | "confirmed";
  notes: string;
  warnings: string[];
}

export interface AcademicPlan {
  studentId: string;
  generatedAt: string;
  semesters: SemesterPlan[];
  overallNotes: string;
}

export interface DARSData {
  studentProfile: StudentProfile;
  completedCourses: CompletedCourse[];
  inProgressCourses: CompletedCourse[];
  remainingRequirements: RemainingRequirement[];
}

export interface CourseInfo {
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
  corequisites: string[];
  semesterAvailability: "fall" | "spring" | "both";
  description: string;
  difficulty: "low" | "medium" | "high";
  professors?: ProfessorInfo[];
}

export interface ProfessorInfo {
  name: string;
  department: string;
  rating: number; // 1-5 scale
  wouldTakeAgainPercent: number; // 0-100
  difficulty: number; // 1-5 scale
  totalRatings: number;
  recentComments: string[];
  tags: string[]; // e.g., ["Tough Grader", "Clear Grading Criteria", "Lecture Heavy"]
  semestersTaught: string[]; // e.g., ["Fall 2024", "Spring 2025"]
}

export interface AppState {
  studentProfile: StudentProfile | null;
  completedCourses: CompletedCourse[];
  inProgressCourses: CompletedCourse[];
  remainingRequirements: RemainingRequirement[];
  currentPlan: AcademicPlan | null;
  darsLoaded: boolean;
}

export interface PlanGenerationPreferences {
  semestersRemaining: number;
  preferLighterLoad: boolean;
  summerAvailable: boolean;
  priorityCourses: string[];
  additionalConstraints: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO date string
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
