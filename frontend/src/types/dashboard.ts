// Type definitions for dashboard overview data.

export type DashboardFrameworkProgress = {
  code: string;
  name: string;
  category?: string | null;
  score: number;
  status: "IN_PROGRESS" | "COMPLETED";
};

export type DashboardResponse = {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  company: unknown;
  overallScore: number;
  lawScore: number;
  certificateScore: number;
  frameworks: DashboardFrameworkProgress[];
};
