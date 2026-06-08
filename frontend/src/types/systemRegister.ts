// Type definitions for vendors, systems, business processes and dependencies.

// Shared risk/importance level used across register entities.
export type Criticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SystemAssetType =
  | "APPLICATION"
  | "DATABASE"
  | "INFRASTRUCTURE"
  | "CLOUD_SERVICE"
  | "SAAS"
  | "API"
  | "WEBSITE"
  | "IDENTITY_PROVIDER"
  | "SECURITY_TOOL"
  | "BACKUP_SYSTEM"
  | "EMAIL_SYSTEM"
  | "ERP"
  | "CRM"
  | "HR_SYSTEM"
  | "PAYMENT_SYSTEM"
  | "OTHER";

export type SystemAssetStatus = "ACTIVE" | "INACTIVE" | "PLANNED" | "RETIRED";

export type Vendor = {
  id: number;
  companyId?: number;
  name: string;
  description?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  criticality: Criticality;
  isCriticalSupplier: boolean;
  hasDpa: boolean;
  hasSla: boolean;
  hasSecurityReview: boolean;
  country?: string | null;
  reviewDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorPayload = {
  name: string;
  description?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  criticality?: Criticality;
  isCriticalSupplier?: boolean;
  hasDpa?: boolean;
  hasSla?: boolean;
  hasSecurityReview?: boolean;
  country?: string | null;
  reviewDate?: string | null;
};

export type SystemAsset = {
  id: number;
  companyId?: number;

  name: string;
  description?: string | null;

  type: SystemAssetType;
  status: SystemAssetStatus;
  criticality: Criticality;

  ownerDepartment?: string | null;
  ownerUserId?: number | null;

  vendorId?: number | null;
  vendor?: Vendor | null;

  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  internetExposed: boolean;

  mfaEnabled: boolean;
  backupEnabled: boolean;
  loggingEnabled: boolean;
  monitoringEnabled: boolean;

  rtoMinutes?: number | null;
  rpoMinutes?: number | null;

  createdAt?: string;
  updatedAt?: string;
};

export type SystemAssetPayload = {
  name: string;
  description?: string | null;

  type?: SystemAssetType;
  status?: SystemAssetStatus;
  criticality?: Criticality;

  ownerDepartment?: string | null;
  ownerUserId?: number | null;

  vendorId?: number | null;

  containsPersonalData?: boolean;
  containsSensitiveData?: boolean;
  internetExposed?: boolean;

  mfaEnabled?: boolean;
  backupEnabled?: boolean;
  loggingEnabled?: boolean;
  monitoringEnabled?: boolean;

  rtoMinutes?: number | null;
  rpoMinutes?: number | null;
};

export type BusinessProcess = {
  id: number;
  companyId?: number;

  name: string;
  description?: string | null;
  ownerDepartment?: string | null;

  criticality: Criticality;

  maxTolerableDowntimeMinutes?: number | null;
  manualWorkaroundAvailable: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type BusinessProcessPayload = {
  name: string;
  description?: string | null;
  ownerDepartment?: string | null;

  criticality?: Criticality;

  maxTolerableDowntimeMinutes?: number | null;
  manualWorkaroundAvailable?: boolean;
};

// Entity types that can be connected through dependencies.
export type DependencyNodeType = "SYSTEM" | "VENDOR" | "BUSINESS_PROCESS";

export type DependencyType =
  | "AUTHENTICATION"
  | "HOSTING"
  | "DATA"
  | "EMAIL"
  | "BACKUP"
  | "PAYMENT"
  | "NETWORK"
  | "MANUAL_PROCESS"
  | "OTHER";

export type Dependency = {
  id: number;

  companyId?: number;

  sourceType: DependencyNodeType;
  sourceId: number;

  targetType: DependencyNodeType;
  targetId: number;

  dependencyType: DependencyType;

  isCritical: boolean;

  failureImpact?: string | null;

  sourceSystem?: SystemAsset | null;
  targetSystem?: SystemAsset | null;

  sourceVendor?: Vendor | null;
  targetVendor?: Vendor | null;

  sourceBusinessProcess?: BusinessProcess | null;
  targetBusinessProcess?: BusinessProcess | null;

  createdAt?: string;
  updatedAt?: string;
};

export type DependencyPayload = {
  sourceType: DependencyNodeType;
  sourceId: number;

  targetType: DependencyNodeType;
  targetId: number;

  dependencyType?: DependencyType;

  isCritical?: boolean;

  failureImpact?: string | null;
};
