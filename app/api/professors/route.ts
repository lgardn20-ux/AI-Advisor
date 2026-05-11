import { NextRequest } from 'next/server';
import type { ProfessorInfo } from '@/lib/types';

// Mock professor data - in production, this would come from RateMyProfessor API or database
const professorData: Record<string, ProfessorInfo[]> = {
  "CS 420": [
    {
      name: "Dr. Sarah Chen",
      department: "Computer Science",
      rating: 4.2,
      wouldTakeAgainPercent: 85,
      difficulty: 3.8,
      totalRatings: 47,
      recentComments: [
        "Challenging but fair. Lectures are well-organized and she explains concepts clearly.",
        "Heavy workload but the material is fascinating. Definitely learned a lot.",
        "Great at explaining complex theory. Office hours are very helpful."
      ],
      tags: ["Clear Grading Criteria", "Lecture Heavy", "Accessible Outside Class"],
      semestersTaught: ["Fall 2024", "Spring 2025"]
    },
    {
      name: "Prof. Michael Rodriguez",
      department: "Computer Science",
      rating: 3.9,
      wouldTakeAgainPercent: 78,
      difficulty: 4.1,
      totalRatings: 32,
      recentComments: [
        "Very knowledgeable but lectures can be dry. Homework is tough but fair.",
        "Expects a lot from students but provides good feedback on assignments.",
        "Theory-heavy course, but he makes it interesting when discussing real applications."
      ],
      tags: ["Tough Grader", "Respected", "Test Heavy"],
      semestersTaught: ["Fall 2023", "Fall 2024"]
    }
  ],
  "CS 430": [
    {
      name: "Dr. Emily Watson",
      department: "Computer Science",
      rating: 4.5,
      wouldTakeAgainPercent: 92,
      difficulty: 3.2,
      totalRatings: 61,
      recentComments: [
        "Amazing professor! Makes programming languages fun and accessible.",
        "Clear explanations and great examples. Projects are challenging but rewarding.",
        "Best CS professor I've had. Really cares about student understanding."
      ],
      tags: ["Inspirational", "Clear Grading Criteria", "Caring"],
      semestersTaught: ["Spring 2024", "Spring 2025", "Fall 2024"]
    }
  ],
  "CS 440": [
    {
      name: "Prof. David Kim",
      department: "Computer Science",
      rating: 4.1,
      wouldTakeAgainPercent: 88,
      difficulty: 3.9,
      totalRatings: 39,
      recentComments: [
        "Excellent at explaining OS concepts. Labs are well-designed.",
        "Challenging material but very rewarding. Great preparation for industry.",
        "Clear expectations and helpful during office hours."
      ],
      tags: ["Respected", "Accessible Outside Class", "Test Heavy"],
      semestersTaught: ["Fall 2024", "Spring 2025"]
    }
  ],
  "CS 450": [
    {
      name: "Dr. Lisa Thompson",
      department: "Computer Science",
      rating: 4.3,
      wouldTakeAgainPercent: 90,
      difficulty: 3.7,
      totalRatings: 28,
      recentComments: [
        "Fascinating course on distributed systems. Dr. Thompson is passionate about the subject.",
        "Group projects are challenging but teach real-world skills.",
        "Great balance of theory and practical applications."
      ],
      tags: ["Inspirational", "Group Projects", "Clear Grading Criteria"],
      semestersTaught: ["Fall 2024"]
    }
  ],
  "CS 460": [
    {
      name: "Prof. James Wilson",
      department: "Computer Science",
      rating: 3.8,
      wouldTakeAgainPercent: 82,
      difficulty: 3.5,
      totalRatings: 53,
      recentComments: [
        "Good introduction to cloud computing. Hands-on projects are valuable.",
        "Sometimes lectures feel rushed, but the material is current and relevant.",
        "Fair grading and reasonable expectations for a technical course."
      ],
      tags: ["Lecture Heavy", "Clear Grading Criteria", "Accessible Outside Class"],
      semestersTaught: ["Spring 2025", "Fall 2024"]
    }
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get('courseCode');

  if (!courseCode) {
    return Response.json({ error: 'courseCode parameter is required' }, { status: 400 });
  }

  const professors = professorData[courseCode] || [];

  return Response.json({ professors });
}