import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { savePlan } from '@/lib/store';
import { isValidAcademicPlan } from '@/lib/parser';
import { categorizeInProgressCourses, formatSemester, getLatestReservedSemester, getNextAcademicSemester } from '@/lib/semester';
import type { DARSData, AcademicPlan, PlanGenerationPreferences } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(): string {
  return `You are an expert academic advisor. Your job is to generate a detailed, semester-by-semester academic plan for a college student based on their DARS (Degree Audit Report System) data.

PLANNING RULES:
1. Credit load: 12–17 credits per regular semester (suggest 15 as default). Never exceed 20.
2. Prerequisites: NEVER schedule a course before its prerequisites are completed or in-progress.
3. Semester availability: Respect fall-only, spring-only, and both designations strictly.
4. Balance difficulty: Avoid scheduling more than 2 "high difficulty" courses in the same semester.
5. Capstone sequence (CS 490 → CS 491): Must be taken in consecutive semesters in the correct order.
6. Required courses take priority over electives.
7. Include 2–3 alternative courses for each planned course where alternatives exist.
8. Flag any scheduling risks or warnings (e.g., only offered once per year, tight prerequisite chain).
9. Summer semesters: Only include if the student indicates availability, and cap at 6–9 credits.
10. Do not re-plan completed or in-progress courses.

OUTPUT FORMAT:
Respond with ONLY a valid JSON object (no markdown fences, no explanation) matching this exact schema:

{
  "studentId": "string",
  "generatedAt": "ISO date string",
  "semesters": [
    {
      "semester": "e.g. Fall 2024",
      "courses": [
        {
          "courseCode": "string",
          "courseName": "string",
          "credits": number,
          "requirementFulfilled": "string",
          "timeSlot": "string or null",
          "alternatives": [
            {
              "courseCode": "string",
              "courseName": "string",
              "credits": number,
              "reason": "why this is a valid alternative"
            }
          ]
        }
      ],
      "totalCredits": number,
      "status": "draft",
      "notes": "advisor notes for this semester",
      "warnings": ["array of warning strings, empty if none"]
    }
  ],
  "overallNotes": "overall plan notes and advice"
}`;
}

function buildUserPrompt(
  dars: DARSData,
  prefs: PlanGenerationPreferences,
  currentSemesterLabel: string,
  nextSemesterToPlan: string,
  currentTermCodes: string[],
  futureTermCodes: string[]
): string {
  const completedCodes = dars.completedCourses.map(c => c.courseCode);

  return `Generate an academic plan for this student.

STUDENT PROFILE:
- Name: ${dars.studentProfile.name}
- Student ID: ${dars.studentProfile.studentId}
- Major: ${dars.studentProfile.major}${dars.studentProfile.minor ? `\n- Minor: ${dars.studentProfile.minor}` : ''}
- Catalog Year: ${dars.studentProfile.catalogYear}
- Credits Completed: ${dars.studentProfile.totalCreditsCompleted} / ${dars.studentProfile.totalCreditsRequired}
- Current GPA: ${dars.studentProfile.currentGPA}
- Expected Graduation: ${dars.studentProfile.expectedGraduationSemester}

COMPLETED COURSES (DO NOT RE-PLAN):
${completedCodes.join(', ') || 'none'}

CURRENT SEMESTER (${currentSemesterLabel}) COURSES (DO NOT RE-PLAN):
${currentTermCodes.join(', ') || 'none'}

REGISTERED FUTURE COURSES (DO NOT RE-PLAN):
${futureTermCodes.join(', ') || 'none'}

REMAINING REQUIREMENTS:
${JSON.stringify(dars.remainingRequirements, null, 2)}

STUDENT PREFERENCES:
- Semesters remaining: ${prefs.semestersRemaining}
- Prefer lighter load: ${prefs.preferLighterLoad}
- Summer available: ${prefs.summerAvailable}
- Priority courses: ${prefs.priorityCourses.length > 0 ? prefs.priorityCourses.join(', ') : 'none specified'}
- Additional constraints: ${prefs.additionalConstraints || 'none'}

The next semester to plan is ${nextSemesterToPlan}. Plan all remaining semesters through graduation.
Today's date is ${new Date().toISOString().split('T')[0]}.

Remember: respond with ONLY the JSON object, no markdown or explanation.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { dars: DARSData; preferences: PlanGenerationPreferences };
    const { dars, preferences } = body;

    if (!dars?.studentProfile) {
      return Response.json({ error: 'Invalid DARS data' }, { status: 400 });
    }

    const { currentTermCourses, futureTermCourses, currentSemester } = categorizeInProgressCourses(dars.inProgressCourses);
    const reservedCourses = [...currentTermCourses, ...futureTermCourses];
    const latestReservedSemester = reservedCourses.length
      ? getLatestReservedSemester(reservedCourses)
      : currentSemester;
    const nextSemesterToPlan = formatSemester(getNextAcademicSemester(latestReservedSemester));

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(
            dars,
            preferences,
            currentSemester.original,
            nextSemesterToPlan,
            currentTermCourses.map(c => c.courseCode),
            futureTermCourses.map(c => c.courseCode)
          ),
        },
      ],
    });

    const message = await stream.finalMessage();
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    let plan: AcademicPlan;
    try {
      plan = JSON.parse(rawText) as AcademicPlan;
    } catch {
      // Try to extract JSON if wrapped in markdown or text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Response.json({ error: 'AI returned invalid JSON. Could not parse response.' }, { status: 500 });
      }
      try {
        plan = JSON.parse(jsonMatch[0]) as AcademicPlan;
      } catch (innerErr) {
        return Response.json({ 
          error: 'AI returned malformed JSON structure. Please try again.' 
        }, { status: 500 });
      }
    }

    // Validate the plan structure
    if (!isValidAcademicPlan(plan)) {
      return Response.json({
        error: 'Generated plan does not match expected structure. Missing or invalid fields (studentId, generatedAt, semesters, overallNotes)',
      }, { status: 500 });
    }

    plan.studentId = dars.studentProfile.studentId;
    plan.generatedAt = new Date().toISOString();

    savePlan(plan);

    return Response.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
