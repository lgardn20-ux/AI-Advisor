import { getSampleDars } from '@/lib/store';

export async function GET() {
  const dars = getSampleDars();
  return Response.json(dars);
}
