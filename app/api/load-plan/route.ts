import { NextRequest } from 'next/server';
import { loadPlan } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return Response.json({ error: 'Missing studentId' }, { status: 400 });
  }
  const plan = loadPlan(studentId);
  return Response.json({ plan });
}
