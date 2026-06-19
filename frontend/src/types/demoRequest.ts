// Type definitions for public demo request workflow.

export type DemoRequestFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  country: string;
};

export type DemoRequestStatus =
  | "PENDING"
  | "EMAILED"
  | "ACTIVATED"
  | "EXPIRED"
  | "REJECTED";

export type DemoRequestCompany = {
  id: string;
  name: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionRenewal: string | null;
};

export type DemoRequestResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string | null;
  country: string | null;
  status: DemoRequestStatus;
  createdAt: string;
  updatedAt: string;
  company: DemoRequestCompany | null;
};

export type ActivateDemoRequestResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  company?: DemoRequestCompany;
  temporaryPassword: string;
};

export type DeleteDemoRequestResponse = {
  deleted: boolean;
  deletedUser: boolean;
};
