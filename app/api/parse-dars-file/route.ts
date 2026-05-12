import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { parseDarsJson } from '@/lib/parser';

// File size limit: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EXTRACTION_PROMPT = `You are an academic advisor assistant. The user has uploaded a DARS (Degree Audit Reporting System) report as an image or document.

Extract all information from this DARS report and return it as a single valid JSON object matching this exact structure:

{
  "studentProfile": {
    "name": "string",
    "studentId": "string",
    "major": "string",
    "minor": "string or omit if none",
    "catalogYear": "string (e.g. 2022)",
    "totalCreditsCompleted": number,
    "totalCreditsRequired": number,
    "currentGPA": number,
    "expectedGraduationSemester": "string (e.g. Spring 2026)",
    "registrationDate": "ISO date string (e.g. 2025-11-01)",
    "registrationReminderDays": 14
  },
  "completedCourses": [
    {
      "courseCode": "string",
      "courseName": "string",
      "credits": number,
      "grade": "string",
      "semesterTaken": "string (e.g. Fall 2023)",
      "fulfills": ["requirement category strings"]
    }
  ],
  "inProgressCourses": [
    {
      "courseCode": "string",
      "courseName": "string",
      "credits": number,
      "grade": "IP",
      "semesterTaken": "string (e.g. Spring 2025)",
      "fulfills": []
    }
  ],
  "remainingRequirements": [
    {
      "requirementCategory": "string",
      "courseOptions": ["course code strings"],
      "creditsNeeded": number,
      "priority": "required" or "recommended" or "elective",
      "prerequisites": [],
      "corequisites": [],
      "semesterAvailability": "both",
      "notes": "optional string"
    }
  ]
}

Rules:
- Extract every course you can see. Be thorough.
- If a field is not visible, use a reasonable default (e.g. registrationDate: one year from now, registrationReminderDays: 14).
- Return ONLY the raw JSON with no markdown, no code fences, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is 5MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    // Validate file type
    const mimeType = file.type || 'image/jpeg';
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      return Response.json(
        { error: `Unsupported file type. Accepted: PDF, JPEG, PNG, GIF, WebP` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const isPdf = mimeType === 'application/pdf';

    let extractedText = '';

    if (isPdf) {
      // Use document source type for PDFs
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } },
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      });
      extractedText = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      // Image
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const imageMediaType = validImageTypes.includes(mimeType)
        ? (mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
        : 'image/jpeg';

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMediaType,
                  data: base64,
                },
              },
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      });
      extractedText = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // Validate extracted JSON
    try {
      JSON.parse(extractedText);
    } catch (parseErr) {
      return Response.json(
        {
          error: 'Claude returned invalid JSON. This may indicate the document is unclear. Try: using better quality image, different angle, or clearer document.',
          raw: extractedText,
        },
        { status: 400 }
      );
    }

    // Validate structure with parser
    const parseResult = parseDarsJson(extractedText);
    if (!parseResult.success) {
      return Response.json(
        {
          error: 'Extracted data does not match DARS format',
          details: parseResult.errors,
          raw: extractedText,
        },
        { status: 400 }
      );
    }

    return Response.json({ json: extractedText });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
