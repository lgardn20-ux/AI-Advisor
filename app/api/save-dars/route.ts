import { NextRequest } from 'next/server';
import { saveDars } from '@/lib/store';
import { extractAuthContext, unauthorized } from '@/lib/auth';
import type { DARSData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = extractAuthContext(request);
    if (!auth) {
      return unauthorized();
    }

    const dars = await request.json() as DARSData;
    if (!dars?.studentProfile?.studentId) {
      return Response.json({ error: 'Invalid DARS data' }, { status: 400 });
    }

    // Security: Ensure students can only save their own DARS
    if (dars.studentProfile.studentId !== auth.studentId) {
      return Response.json(
        { error: 'You can only save your own DARS data' },
        { status: 403 }
      );
    }

    saveDars(dars);
    return Response.json({ 
      ok: true,
      message: `DARS data saved for student ${auth.studentId}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
