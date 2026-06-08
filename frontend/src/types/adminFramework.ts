import type { FrameworkCode } from "./framework";
// Type definitions for admin framework management.

export type AdminFrameworkSummary = {
  id: number;
  code: FrameworkCode | string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
  sectionCount: number;
  requirementCount: number;
  createdAt?: string;
  updatedAt?: string;
  sections?: AdminFrameworkSection[];
};

export type AdminFrameworkRequirement = {
  id: number;
  question: string;
  description?: string | null;
  reference?: string | null;
  implementationGuide?: string | null;
  exampleEvidence?: string | null;
  riskIfMissing?: string | null;
  order: number;
  weight: number;
  isRequired: boolean;
  isActive: boolean;
};

export type AdminFrameworkSection = {
  id: number;
  title: string;
  description?: string | null;
  order: number;
  weight: number;
  requirements: AdminFrameworkRequirement[];
};

export type AdminFrameworkDetail = AdminFrameworkSummary & {
  sections: AdminFrameworkSection[];
};

// Payloads used when creating or updating framework entities.
export type FrameworkPayload = Partial<
  Pick<
    AdminFrameworkSummary,
    "code" | "name" | "description" | "category" | "isActive"
  >
>;

export type SectionPayload = Partial<
  Pick<AdminFrameworkSection, "title" | "description" | "order" | "weight">
>;

export type RequirementPayload = Partial<
  Pick<
    AdminFrameworkRequirement,
    | "question"
    | "description"
    | "reference"
    | "implementationGuide"
    | "exampleEvidence"
    | "riskIfMissing"
    | "order"
    | "weight"
    | "isRequired"
    | "isActive"
  >
>;
