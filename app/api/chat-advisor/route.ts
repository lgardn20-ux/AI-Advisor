import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { DARSData, AcademicPlan, ChatMessage } from '@/lib/types';

function buildSystemPrompt(dars: DARSData, plan: AcademicPlan | null): string {
  const profile = dars.studentProfile;
  const completedList = dars.completedCourses
    .map(c => `${c.courseCode} (${c.grade})`)
    .join(', ');
  const inProgressList = dars.inProgressCourses
    .map(c => c.courseCode)
    .join(', ');

  let planSummary = 'No plan generated yet.';
  if (plan) {
    planSummary = plan.semesters
      .map(s => `${s.semester}: ${s.courses.map(c => c.courseCode).join(', ')} (${s.totalCredits} credits)`)
      .join('\n');
  }

  return `You are a friendly, knowledgeable academic advisor helping ${profile.name} (${profile.major}${profile.minor ? ` / ${profile.minor} minor` : ''}).

STUDENT SNAPSHOT:
- Credits: ${profile.totalCreditsCompleted} / ${profile.totalCreditsRequired} completed
- GPA: ${profile.currentGPA}
- Expected graduation: ${profile.expectedGraduationSemester}
- Completed: ${completedList}
- In progress: ${inProgressList}

CURRENT SEMESTER PLAN:
${planSummary}

Your role:
- Answer questions about the plan, requirements, and course options
- Explain prerequisite chains and scheduling constraints
- Suggest alternatives if the student wants to swap courses
- Give advice on course difficulty and workload balance
- Be encouraging and supportive

Keep answers concise (2–4 paragraphs max). Use bullet points for lists. Be specific about course codes when relevant.`;
}

export async function POST(request: NextRequest) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const body = await request.json() as {
      dars: DARSData;
      plan: AcademicPlan | null;
      messages: ChatMessage[];
    };

    const { dars, plan, messages } = body;

    if (!dars?.studentProfile) {
      return Response.json({ error: 'Invalid DARS data' }, { status: 400 });
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    const anthropicMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(dars, plan),
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
