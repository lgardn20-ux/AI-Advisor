# Authentication Guide

This guide explains how to use the JWT-based authentication system in the Academic Advisor application.

## Overview

The application uses JWT (JSON Web Tokens) for stateless authentication. Students receive a token after login and include it in subsequent requests to authenticate themselves.

## Setting Up Authentication

### 1. Environment Configuration

Add to your `.env.local`:

```bash
# Generate a strong secret (min 32 characters)
# Unix: openssl rand -hex 16
# Node: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-key-min-32-chars-required
```

## Login Flow

### Step 1: Get a Token

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "studentId": "SU2021-4892",
  "email": "student@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "studentId": "SU2021-4892",
  "email": "student@university.edu",
  "name": "Alex Johnson",
  "expiresIn": "7 days",
  "message": "Login successful. Use this token in the Authorization header: Bearer <token>"
}
```

⚠️ **Note:** The login endpoint is currently a demo. In production, implement proper password verification against a hashed database value.

### Step 2: Use the Token in Requests

Include the token in the `Authorization` header of all subsequent requests:

```bash
curl -X POST https://yourapp.com/api/save-dars \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"studentProfile": {...}}'
```

Or in JavaScript:

```typescript
const token = localStorage.getItem('authToken'); // Saved from login response

const response = await fetch('/api/save-dars', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(darsData),
});
```

## Protecting an API Route

To require authentication in an API endpoint, use the `extractAuthContext` helper:

```typescript
import { NextRequest } from 'next/server';
import { extractAuthContext, unauthorized } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Step 1: Verify authentication
  const auth = extractAuthContext(request);
  if (!auth) {
    return unauthorized('Please log in first');
  }

  // Step 2: Use the authenticated student ID
  console.log(`Request from student: ${auth.studentId}`);

  // Step 3: Enforce data ownership
  const requestData = await request.json();
  if (requestData.studentId !== auth.studentId) {
    return new Response(
      JSON.stringify({ error: 'You can only access your own data' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Step 4: Process the request
  // ... your logic here
  
  return Response.json({ ok: true });
}
```

## Auth Context Structure

When a request is authenticated, `extractAuthContext()` returns:

```typescript
interface AuthContext {
  studentId: string;    // University student ID
  email: string;        // Student email
  name: string;         // Student name
}
```

## Security Best Practices

### 1. Always Verify Ownership

```typescript
// ✅ Good: Verify the user can only access their own data
if (requestData.studentId !== auth.studentId) {
  return forbidden('You can only access your own data');
}
```

### 2. Never Trust Client Data

```typescript
// ❌ Bad: Accept studentId from request body
const studentId = requestData.studentId;

// ✅ Good: Use authenticated studentId
const studentId = auth.studentId;
```

### 3. Use HTTPS Only

- In production, always use HTTPS
- Set secure cookie flags for stored tokens
- Never log tokens in production logs

### 4. Token Expiration

Tokens expire after 7 days. Implement token refresh:

```typescript
// Refresh endpoint (not yet implemented)
export async function POST(request: NextRequest) {
  const auth = extractAuthContext(request);
  if (!auth) return unauthorized();
  
  // Create a new token
  const newToken = createAuthToken(auth.studentId, auth.email, auth.name);
  return Response.json({ token: newToken });
}
```

### 5. Rate Limiting

Implement rate limiting on login to prevent brute force:

```typescript
// Example: Use an external service like Upstash
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 login attempts per 15 minutes
});

const { success } = await ratelimit.limit(`login:${email}`);
if (!success) {
  return new Response('Too many login attempts', { status: 429 });
}
```

## Client-Side Implementation

### Store Token

```typescript
// After login
localStorage.setItem('authToken', response.token);

// On app load
const token = localStorage.getItem('authToken');
if (token) {
  // User is logged in
}
```

### Make Authenticated Requests

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Usage
const dars = await fetchWithAuth('/api/load-dars', {
  method: 'POST',
  body: JSON.stringify({ studentId: 'SU2021-4892' }),
});
```

### Handle Token Expiration

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (refreshResponse.ok) {
      const { token: newToken } = await refreshResponse.json();
      localStorage.setItem('authToken', newToken);

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

## Logout

```typescript
function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

## Protected Routes Checklist

As you migrate endpoints to use authentication, check them off:

- [ ] POST /api/save-dars ✅ (Already updated)
- [ ] POST /api/parse-dars-file
- [ ] POST /api/generate-plan
- [ ] POST /api/chat-advisor
- [ ] GET /api/load-plan
- [ ] GET /api/sample-dars (Should be auth-only)

## Migration from File System to Database

When migrating from file system to database storage, use these utilities:

```typescript
import prisma from '@/lib/prisma';

// Save DARS to database
export async function saveDarsWithAuth(
  auth: AuthContext,
  dars: DARSData
) {
  return await prisma.dARSRecord.create({
    data: {
      studentId: auth.studentId,
      data: dars, // Prisma will serialize to JSON
    },
  });
}

// Load DARS from database
export async function loadDarsWithAuth(auth: AuthContext) {
  return await prisma.dARSRecord.findFirst({
    where: { studentId: auth.studentId },
    orderBy: { uploadedAt: 'desc' }, // Get most recent
  });
}
```

## Troubleshooting

### "Invalid token" Error
- Check that JWT_SECRET is set and consistent
- Verify token hasn't expired (7 day limit)
- Check Authorization header format: `Bearer <token>`

### Token Not Working Across Requests
- Tokens are stateless - no session store needed
- If token works in one request but not another, likely an error in token creation

### "Missing required fields" Error
- Verify studentId and email are provided
- Check that token payload hasn't been modified

## Next Steps

1. Implement password hashing with bcrypt for secure password storage
2. Add token refresh endpoint for better UX
3. Implement role-based access control (RBAC) for advisors
4. Add two-factor authentication (2FA) for sensitive operations
5. Create admin authentication with elevated privileges

## Resources

- [JWT Introduction](https://jwt.io/introduction)
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
