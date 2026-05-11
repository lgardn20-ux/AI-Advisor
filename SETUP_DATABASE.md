# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Academic Advisor application using Prisma.

## Prerequisites

- PostgreSQL 12+ installed locally or access to a remote PostgreSQL server
- Node.js 18+
- npm or yarn

## Installation Steps

### 1. Install Dependencies

First, install the required npm packages:

```bash
npm install
```

This will install Prisma and its client library.

### 2. Configure Database Connection

Create a `.env.local` file in the project root with your database URL:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/academic_advisor"
```

Replace with your actual PostgreSQL credentials:
- `username` - your PostgreSQL user
- `password` - your PostgreSQL password
- `localhost` - your server address (localhost for local, IP/domain for remote)
- `5432` - default PostgreSQL port
- `academic_advisor` - name of the database to create

#### For Local Development (macOS/Linux)

If you have PostgreSQL installed locally, you can create the database:

```bash
createdb academic_advisor
```

Then use:
```
DATABASE_URL="postgresql://localhost/academic_advisor"
```

#### For Development with Docker

If you prefer to use Docker:

```bash
docker run --name academic-advisor-db \
  -e POSTGRES_DB=academic_advisor \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

Then use:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/academic_advisor"
```

#### For Cloud Hosting

Popular options:
- **Neon** (Serverless Postgres): https://neon.tech
- **Vercel Postgres** (Integrated): https://vercel.com/storage/postgres
- **Railway**: https://railway.app
- **Heroku Postgres** (legacy): https://www.heroku.com/postgres
- **AWS RDS**: https://aws.amazon.com/rds/postgresql/

### 3. Run Database Migrations

Apply the Prisma schema to your database:

```bash
npm run prisma:migrate
```

This command will:
- Create all tables defined in `prisma/schema.prisma`
- Prompt you to name the migration (e.g., "init")
- Generate the Prisma Client types

### 4. Verify Installation

Check that everything is set up correctly:

```bash
npx prisma db push
```

You can also open Prisma Studio to view and manage your database:

```bash
npx prisma studio
```

This opens an interactive database browser at `http://localhost:5555`

## Using the Prisma Client

### In API Routes

```typescript
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Example: Get all students
  const students = await prisma.student.findMany();
  return Response.json(students);
}
```

### Common Operations

```typescript
import prisma from '@/lib/prisma';

// Create
const student = await prisma.student.create({
  data: {
    studentId: 'SU2021-4892',
    email: 'alex@university.edu',
    name: 'Alex Johnson',
    passwordHash: 'hashed_password_here',
  },
});

// Read
const student = await prisma.student.findUnique({
  where: { studentId: 'SU2021-4892' },
});

// Update
const updated = await prisma.student.update({
  where: { studentId: 'SU2021-4892' },
  data: { name: 'Alex J.' },
});

// Delete
await prisma.student.delete({
  where: { studentId: 'SU2021-4892' },
});

// Query with relations
const student = await prisma.student.findUnique({
  where: { studentId: 'SU2021-4892' },
  include: {
    darsRecords: true,
    academicPlans: true,
    chatSessions: true,
  },
});
```

## Updating the Schema

If you modify `prisma/schema.prisma`:

1. Make your changes
2. Create and apply a migration:
   ```bash
   npm run prisma:migrate
   ```
3. Name the migration descriptively (e.g., "add_course_schedule")

## Resetting the Database (Development Only)

⚠️ **WARNING: This deletes all data**

```bash
npx prisma migrate reset
```

## Troubleshooting

### Connection Refused
- Check that PostgreSQL is running
- Verify your `DATABASE_URL` is correct
- Check firewall settings if using remote database

### Migration Failed
- Run `npx prisma migrate resolve --rolled-back` to mark as rolled back
- Fix the schema and try again

### Prisma Client Out of Sync
```bash
npm run prisma:generate
```

## Next Steps

1. Create a password hashing utility (bcrypt)
2. Implement login/registration endpoints
3. Update API routes to use database instead of file system
4. Create admin dashboard for database management

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/overview)
