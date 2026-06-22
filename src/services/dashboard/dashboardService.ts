import { Op } from "sequelize";

import { Application } from "../../models/Application";
import { CoverLetter } from "../../models/CoverLetter";
import { InterviewSession } from "../../models/InterviewSession";
import { JobAnalysis } from "../../models/JobAnalysis";
import { Resume } from "../../models/Resume";

export type DashboardStats = {
  activeResume: {
    id: string;
    title: string;
  } | null;
  resumeCount: number;
  applicationCount: number;
  atsChecksThisWeek: number;
  interviewSessionCount: number;
};

export type DashboardActivityCategory =
  | "resume"
  | "analysis"
  | "cover-letter"
  | "application"
  | "interview";

export type DashboardActivityItem = {
  id: string;
  category: DashboardActivityCategory;
  title: string;
  detail: string;
  createdAt: string;
};

type ActivitySource = {
  id: string;
  category: DashboardActivityCategory;
  title: string;
  detail: string;
  createdAt: Date;
};

function startOfCurrentWeek(date = new Date()): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function serializeActivityItem(item: ActivitySource): DashboardActivityItem {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    detail: item.detail,
    createdAt: item.createdAt.toISOString(),
  };
}

function humanizeApplicationStatus(status: string): string {
  switch (status) {
    case "applied":
      return "Applied";
    case "screening":
      return "Screening";
    case "interview":
      return "Interview";
    case "rejected":
      return "Rejected";
    case "offer":
      return "Offer";
    default:
      return status;
  }
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const weekStart = startOfCurrentWeek();

  const [activeResume, resumeCount, applicationCount, atsChecksThisWeek, interviewSessionCount] =
    await Promise.all([
      Resume.findOne({
        where: { userId, isActive: true },
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
        ],
      }),
      Resume.count({ where: { userId } }),
      Application.count({ where: { userId } }),
      JobAnalysis.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: weekStart,
          },
        },
      }),
      InterviewSession.count({ where: { userId } }),
    ]);

  return {
    activeResume: activeResume
      ? {
          id: activeResume.id,
          title: activeResume.title,
        }
      : null,
    resumeCount,
    applicationCount,
    atsChecksThisWeek,
    interviewSessionCount,
  };
}

export async function getDashboardActivity(
  userId: string,
): Promise<DashboardActivityItem[]> {
  const [resumes, analyses, coverLetters, applications, interviewSessions] =
    await Promise.all([
      Resume.findAll({
        where: { userId },
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
        ],
        limit: 10,
      }),
      JobAnalysis.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
      CoverLetter.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
      Application.findAll({
        where: { userId },
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
        ],
        limit: 10,
      }),
      InterviewSession.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
    ]);

  const items: ActivitySource[] = [
    ...resumes.map((resume) => ({
      id: `resume-${resume.id}`,
      category: "resume" as const,
      title: `${resume.title} resume saved`,
      detail: resume.isActive
        ? "This is the current active resume."
        : "Ready to set active and reuse in Copilot.",
      createdAt: resume.updatedAt,
    })),
    ...analyses.map((analysis) => ({
      id: `analysis-${analysis.id}`,
      category: "analysis" as const,
      title: "ATS analysis completed",
      detail: `${analysis.jobTitleDetected} scored ${analysis.atsScore} for ATS readiness.`,
      createdAt: analysis.createdAt,
    })),
    ...coverLetters.map((coverLetter) => ({
      id: `cover-letter-${coverLetter.id}`,
      category: "cover-letter" as const,
      title: "Cover letter draft generated",
      detail: `Tone: ${coverLetter.tone}. Saved for later refinement.`,
      createdAt: coverLetter.createdAt,
    })),
    ...applications.map((application) => ({
      id: `application-${application.id}`,
      category: "application" as const,
      title: `${application.company} application updated`,
      detail: `${application.role} - ${humanizeApplicationStatus(application.status)}`,
      createdAt: application.updatedAt,
    })),
    ...interviewSessions.map((session) => ({
      id: `interview-${session.id}`,
      category: "interview" as const,
      title: "Practice session saved",
      detail: `${session.role} - ${session.difficulty} difficulty`,
      createdAt: session.createdAt,
    })),
  ];

  return items
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10)
    .map(serializeActivityItem);
}
