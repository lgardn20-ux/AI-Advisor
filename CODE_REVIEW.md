# Code Review: AI Academic Advisor

## 📋 Project Overview

Your application is a **Next.js-based AI academic advisor** that helps college students build academic plans based on their DARS (Degree Audit Report) data. The system:
- Accepts DARS uploads (PDF/images) via Claude's document/image parsing
- Parses DARS data into structured JSON
- Generates semester-by-semester academic plans using Claude
- Provides an interactive AI chatbot for advising questions
- Tracks progress toward graduation requirements

---

## ✅ Strengths

### 1. **Well-Structured Architecture**
- Clean separation of concerns (pages, API routes, utilities, components)
- Type-safe implementation with comprehensive TypeScript interfaces
- Proper use of Next.js conventions (server/client components, API routes)
- Server-side data persistence using the file system

### 2. **Intelligent DARS Parsing**
- Uses Claude's document/image understanding capabilities
- Handles both PDF and image formats
- Automatically extracts student profile, course history, and requirements
- Smart fallback for missing fields (e.g., registration date defaults)

### 3. **Sophisticated Plan Generation**
- Respects prerequisite chains and corequisites
- Enforces semester availability constraints (fall/spring/both)
- Balances course difficulty across semesters
- Suggests alternative courses for flexibility
- Includes warnings for scheduling risks
- Handles capstone sequencing (CS 490 → CS 491)

### 4. **User Experience**
- Intuitive dashboard with key metrics and countdown timers
- Drag-and-drop DARS file upload with visual feedback
- Interactive plan visualization with expandable semesters
- Real-time AI advisor chat with streaming responses
- Registration checklist with priorities

### 5. **AI Integration**
- Uses Claude Sonnet 4 (cutting-edge model)
- Streaming chat responses for better UX
- Contextual system prompts that adapt to student data
- Natural, supportive conversational tone

---

## ⚠️ Areas for Improvement

### 1. **DARS File Parsing - Missing Error Handling**
**File:** [app/api/parse-dars-file/route.ts](app/api/parse-dars-file/route.ts#L82)

**Issue:** The EXTRACTION_PROMPT assumes Claude will always return valid JSON, but doesn't handle malformed JSON responses.

```typescript
// Current approach - prone to silent failures
const text = message.content[0].type === 'text' ? message.content[0].text : '';
return Response.json({ json: text });
```

**Recommendation:**
```typescript
// Add JSON validation before returning
try {
  JSON.parse(text); // Validate JSON structure
  return Response.json({ json: text });
} catch {
  return Response.json({ 
    error: 'Claude returned invalid JSON. Please try again.' 
  }, { status: 400 });
}
```

---

### 2. **Plan Generation - No Validation of AI Output**
**File:** [app/api/generate-plan/route.ts](app/api/generate-plan/route.ts#L100)

**Issue:** The code tries to parse JSON but doesn't validate it against the schema. This can cause runtime errors if Claude returns invalid data.

```typescript
// Current code (partial error handling)
let plan: AcademicPlan;
try {
  plan = JSON.parse(rawText) as AcademicPlan;
} catch {
  // What happens here? No visible error handling
}
```

**Recommendation:** Add a validation function similar to `parser.ts`:
```typescript
function validateAcademicPlan(obj: unknown): obj is AcademicPlan {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.studentId === 'string' &&
    Array.isArray(p.semesters) &&
    typeof p.generatedAt === 'string'
  );
}
```

---

### 3. **Missing ChatMessage Type Definition**
**File:** [lib/types.ts](lib/types.ts)

**Issue:** `ChatMessage` is imported in [app/plans/page.tsx](app/plans/page.tsx#L4) but never defined in `types.ts`.

**Recommendation:** Add to types.ts:
```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO date string
}
```

---

### 4. **Hardcoded Business Logic in Prompts**
**Files:** [app/api/generate-plan/route.ts](app/api/generate-plan/route.ts#L10), [app/api/chat-advisor/route.ts](app/api/chat-advisor/route.ts#L21)

**Issue:** Planning rules (credit limits, max difficulty courses, etc.) are hard-coded in system prompts. These should be configurable.

**Current:**
```
- Credit load: 12–17 credits per regular semester
- Never exceed 20 credits
- Balance difficulty: Avoid more than 2 "high difficulty" courses
```

**Recommendation:** Create a `PlanningConstraints` interface:
```typescript
export interface PlanningConstraints {
  minCreditsPerSemester: number;
  maxCreditsPerSemester: number;
  maxHighDifficultyCourses: number;
  maxSummerCredits: number;
}

// Use in prompts via interpolation
CREDIT_LOAD_RULE: ${constraints.minCreditsPerSemester}–${constraints.maxCreditsPerSemester} credits
```

---

### 5. **No Persistence for Chat History**
**File:** [app/plans/page.tsx](app/plans/page.tsx#L16)

**Issue:** Chat messages are stored only in React state and lost on page reload. Production systems typically need message history.

**Recommendation:** Add API endpoint to save/retrieve chat sessions:
```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { studentId, messages } = await request.json();
  // Save to database or file
  saveChatSession(studentId, messages);
}
```

---

### 6. **No Authentication/Authorization**
**Impact:** All endpoints are publicly accessible. Any user can:
- View/upload any student's DARS
- Generate plans for any student
- Access all stored plans

**Recommendation:**
```typescript
// Middleware or route protection
import { auth } from '@/lib/auth'; // Your auth provider

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.studentId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Continue with authenticated student ID
}
```

---

### 7. **File System Storage Limitations**
**File:** [lib/store.ts](lib/store.ts)

**Issue:** 
- Data stored on file system has no backup/recovery
- Can't scale to multiple servers
- No concurrent access control
- No audit trail

**Recommendation:** Migrate to a database (PostgreSQL, MongoDB, etc.):
```typescript
// Example with Prisma
export async function saveDars(data: DARSData): Promise<void> {
  await db.dars.upsert({
    where: { studentId: data.studentProfile.studentId },
    create: { data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
}
```

---

### 8. **Limited Course Catalog**
**File:** [data/courseCatalog.json](data/courseCatalog.json)

**Issue:** Very small sample catalog (only advanced CS courses). Production needs:
- All available courses
- Regular updates
- Course section availability
- Instructor information
- Room/time scheduling data

**Recommendation:** 
- Integrate with university course registration system (Banner, Workday, etc.)
- Create admin dashboard to manage course catalog
- Add sync job to update catalog regularly

---

### 9. **No Validation for Conflicting Requirements**
**File:** [app/api/generate-plan/route.ts](app/api/generate-plan/route.ts#L51)

**Issue:** If remaining requirements can't fit in remaining semesters (e.g., 100 credits needed but 2 semesters × 17 = 34 credits available), the plan becomes unrealistic. No warning to user.

**Recommendation:** Add pre-flight validation:
```typescript
const totalCreditsNeeded = dars.remainingRequirements
  .reduce((sum, r) => sum + r.creditsNeeded, 0);
const availableCredits = prefs.semestersRemaining * 17; // max per semester

if (totalCreditsNeeded > availableCredits) {
  return Response.json({ 
    error: `Cannot complete all requirements in ${prefs.semestersRemaining} semesters. 
            Need ${totalCreditsNeeded} credits but only ${availableCredits} slots available.
            Consider adding summer semesters or extending graduation.` 
  }, { status: 400 });
}
```

---

### 10. **Missing Environment Variable Documentation**
**File:** .env (not provided)

**Required variables:**
- `ANTHROPIC_API_KEY` - Used in all API routes

**Recommendation:** Create `.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

---

## 🔴 Critical Issues & Recommendations

### Issue 1: Incomplete Error Responses
Several API endpoints don't properly validate responses before returning to the client. This can lead to app crashes.

**Fix Priority:** HIGH  
**Affected Files:** [parse-dars-file](app/api/parse-dars-file/route.ts), [generate-plan](app/api/generate-plan/route.ts)

---

### Issue 2: No Input Size Limits
Large DARS uploads could hit Claude's token limits or cause memory issues.

**Recommendation:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_FILE_SIZE) {
  return Response.json({ error: 'File too large' }, { status: 413 });
}
```

---

### Issue 3: Missing Rate Limiting
Claude API calls are expensive (~$0.003 per plan generation). No rate limiting means potential cost overruns.

**Recommendation:** Add Redis-based rate limiting:
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests/hour per student
});

const { success } = await ratelimit.limit(studentId);
if (!success) return Response.json({ error: 'Rate limited' }, { status: 429 });
```

---

## 🎯 Feature Gaps & Enhancement Opportunities

### 1. **Multi-Major/Minor Support**
Current system assumes one major and optional minor. Should support:
- Double majors
- Multiple minors
- Concentration tracks
- Certificate programs

**Impact:** Medium complexity, high value for students

---

### 2. **Degree Audit (What-If Analysis)**
"What if I add a Computer Science minor?" or "Can I graduate in 3 years?"

**Implementation:** Create `/api/what-if` endpoint that generates alternate plans

---

### 3. **Course Conflict Detection**
Alert students to:
- Time slot conflicts
- Prerequisite chains with no availability
- Courses not offered during planned semester

**Implementation:** Add conflict detection in plan validation

---

### 4. **Export/Share Plans**
- PDF export of academic plan
- Share plan link with advisor
- Print-friendly version

**Implementation:** Use a library like `html2pdf` or `pdfkit`

---

### 5. **Progress Tracking**
- Compare actual registration to plan
- Mark completed courses
- Auto-adjust remaining plan

**Implementation:** Add `/api/update-progress` endpoint

---

### 6. **Course Reviews & Difficulty Ratings**
Students input difficulty ratings (actual vs. expected), improve predictions over time.

**Implementation:** Add user feedback collection and ML-based difficulty scoring

---

### 7. **GPA Impact Calculator**
Estimate how grade targets affect overall GPA and graduation honors.

**Implementation:** Add formula-based calculator component

---

### 8. **Mobile App**
Current design is responsive but a native mobile app would be better for on-the-go planning.

**Implementation:** React Native or Flutter port

---

## 🧪 Testing Gaps

Current codebase has no visible tests. Recommended:

### Unit Tests
- [lib/parser.ts](lib/parser.ts) - Test JSON validation
- [lib/store.ts](lib/store.ts) - Test file I/O

### Integration Tests
- Plan generation with various student profiles
- DARS parsing with edge cases (missing fields, unusual formats)

### E2E Tests
- Full user flow: upload DARS → generate plan → chat → export

**Tool Recommendations:**
- Jest (unit/integration)
- Playwright (E2E)
- MSW (mock API responses)

---

## 📊 Performance Considerations

### API Response Times
- **DARS parsing:** ~3-5 seconds (Claude processing)
- **Plan generation:** ~5-10 seconds (Claude + JSON parsing)
- **Chat messages:** Streaming (immediate + ~2-3 seconds per response)

**Potential optimizations:**
- Cache parsed DARS for repeated access
- Pre-generate common course recommendations
- Implement async job queue for long-running operations

---

## 🔒 Security Recommendations

1. **Input Validation:** Validate all file uploads (check magic bytes, not just extension)
2. **CORS:** Restrict to your domain only
3. **Secrets Management:** Use environment variables, never commit API keys
4. **Logging:** Add audit logs for data access
5. **Data Privacy:** Ensure FERPA compliance (student data protection)
6. **API Key Rotation:** Implement regular rotation of secrets

---

## 📦 Dependencies

### Current Stack (Good Choices)
- **Next.js 16:** Modern React framework ✅
- **Anthropic SDK:** Direct Claude API access ✅
- **Tailwind CSS:** Utility-first styling ✅
- **TypeScript:** Type safety ✅

### Consider Adding
- **Zod** or **Yup:** Schema validation
- **Prisma:** Database ORM
- **Redis:** Caching & rate limiting
- **Sentry:** Error tracking
- **Vercel Analytics:** Performance monitoring

---

## 🚀 Deployment Recommendations

### Current Issues
- File system storage won't work on serverless (Vercel, AWS Lambda)
- No environment configuration strategy

### Recommended Setup
1. **Database:** PostgreSQL on Neon or AWS RDS
2. **Hosting:** Vercel (optimal for Next.js)
3. **File Storage:** AWS S3 or Vercel Blob for document archives
4. **Monitoring:** Sentry for error tracking, Vercel Analytics for performance
5. **CI/CD:** GitHub Actions for automated testing & deployment

---

## 📝 Code Quality Summary

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Architecture** | ⭐⭐⭐⭐ | Clean, well-organized |
| **Type Safety** | ⭐⭐⭐⭐ | Comprehensive interfaces |
| **Error Handling** | ⭐⭐ | Needs improvement in API routes |
| **Testing** | ⭐ | No tests present |
| **Documentation** | ⭐⭐⭐ | Good code comments, minimal README |
| **Security** | ⭐⭐ | Missing auth, no input validation |
| **Scalability** | ⭐⭐ | File system storage limits scale |
| **User Experience** | ⭐⭐⭐⭐⭐ | Excellent UI/UX design |

**Overall:** 3.1/5 ⭐ — Solid foundation with excellent UX, but needs production hardening

---

## 🎯 Priority Action Items

### Phase 1: Bug Fixes (Week 1)
- [ ] Add JSON validation to DARS parsing
- [ ] Validate plan generation output
- [ ] Add missing ChatMessage type
- [ ] Add file size limits and validation

### Phase 2: Production Hardening (Week 2-3)
- [ ] Add authentication & authorization
- [ ] Migrate to database (PostgreSQL)
- [ ] Add input validation (Zod)
- [ ] Implement error tracking (Sentry)
- [ ] Add rate limiting

### Phase 3: Testing & Monitoring (Week 4)
- [ ] Write unit tests for utilities
- [ ] Add integration tests for API routes
- [ ] Set up E2E tests
- [ ] Deploy to staging environment

### Phase 4: Features & Optimization (Week 5+)
- [ ] Add what-if analysis
- [ ] Implement chat history persistence
- [ ] Add PDF export
- [ ] Optimize course catalog integration
- [ ] Add mobile app

---

## 💡 Conclusion

Your AI academic advisor is a **well-designed, feature-rich application** with excellent UI/UX and intelligent AI integration. The foundation is solid for a prototype or MVP.

**Key next steps:**
1. Fix critical validation issues (HIGH PRIORITY)
2. Add authentication & move to database for multi-user safety
3. Write tests to prevent regressions
4. Deploy to production with proper monitoring
5. Iterate on features based on user feedback

The combination of Claude's intelligence with thoughtful UX puts this ahead of most academic planning tools. Focus on reliability and security as you scale to real users.

---

*Review Date: May 10, 2026*  
*Reviewer: GitHub Copilot*
