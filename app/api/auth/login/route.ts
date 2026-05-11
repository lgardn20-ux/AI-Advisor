import { NextRequest } from 'next/server';
import { createAuthToken } from '@/lib/auth';

/**
 * POST /api/auth/login
 * 
 * Example login endpoint.
 * 
 * Request body:
 * {
 *   "studentId": "SU2021-4892",
 *   "email": "student@university.edu",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "studentId": "SU2021-4892",
 *   "email": "student@university.edu",
 *   "name": "Alex Johnson"
 * }
 * 
 * NOTE: This is a DEMO endpoint. In production:
 * - Verify password against hashed value in database
 * - Use HTTPS only
 * - Rate limit login attempts
 * - Add CSRF protection
 * - Log failed attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      studentId?: string;
      email?: string;
      password?: string;
    };

    // Validate input
    if (!body.studentId || !body.email || !body.password) {
      return Response.json(
        { error: 'Missing required fields: studentId, email, password' },
        { status: 400 }
      );
    }

    // TODO: In production, verify credentials against database
    // For demo purposes, we'll accept any credentials
    // NEVER DO THIS IN PRODUCTION

    const studentId = body.studentId.trim();
    const email = body.email.trim().toLowerCase();

    // Validate email format
    if (!email.includes('@')) {
      return Response.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create JWT token
    const token = createAuthToken(studentId, email, studentId); // Using studentId as name for demo

    return Response.json({
      token,
      studentId,
      email,
      name: studentId,
      expiresIn: '7 days',
      message: 'Login successful. Use this token in the Authorization header: Bearer <token>',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json(
      { error: `Login failed: ${message}` },
      { status: 500 }
    );
  }
}
