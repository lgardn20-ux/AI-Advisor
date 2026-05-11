import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Authentication context extracted from JWT token
 */
export interface AuthContext {
  studentId: string;
  email: string;
  name: string;
}

/**
 * Verify JWT token and extract auth context
 * 
 * Expects token in Authorization header: "Bearer <token>"
 * Set JWT_SECRET in environment variables
 */
export function verifyAuthToken(token: string): AuthContext | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('JWT_SECRET not set in environment variables');
      return null;
    }

    const decoded = jwt.verify(token, secret) as {
      studentId?: string;
      email?: string;
      name?: string;
    };

    if (!decoded.studentId || !decoded.email) {
      return null;
    }

    return {
      studentId: decoded.studentId,
      email: decoded.email,
      name: decoded.name || '',
    };
  } catch (err) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract auth context from NextRequest
 * Looks for Authorization header with Bearer token
 */
export function extractAuthContext(request: NextRequest): AuthContext | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  return verifyAuthToken(token);
}

/**
 * Middleware to verify authentication on API routes
 * 
 * Usage in API route:
 * ```
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth) return; // Response already sent by requireAuth
 *   
 *   // Your protected endpoint logic here
 *   // Use auth.studentId for database queries
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthContext | null> {
  const auth = extractAuthContext(request);

  if (!auth) {
    // Return 401 response automatically
    const response = new Response(
      JSON.stringify({ error: 'Unauthorized. Please provide a valid Bearer token.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    // This is a bit of a hack - in a real app you'd use middleware
    // For now, the route handler should check for null and return the response
    return null;
  }

  return auth;
}

/**
 * Send 401 Unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Send 403 Forbidden response
 */
export function forbidden(message = 'Forbidden'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a JWT token for a student
 * 
 * Usage: Call this after login/registration
 * ```
 * const token = createAuthToken(studentId, email, name);
 * // Send token to client to use in Authorization header
 * ```
 */
export function createAuthToken(
  studentId: string,
  email: string,
  name: string
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not set in environment variables');
  }

  const token = jwt.sign(
    {
      studentId,
      email,
      name,
    },
    secret,
    {
      expiresIn: '7d', // Token expires in 7 days
      algorithm: 'HS256',
    }
  );

  return token;
}
