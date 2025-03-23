export interface RowtLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  fallbackUrlOverride?: string;
  additionalMetadata?: Record<string, any>;
  properties: Record<string, any>;
  lifetimeClicks: number;
  interactions?: RowtInteraction[];
  createdAt: Date;
}

export interface RowtInteraction {
  id: string;
  link: RowtLink;
  referer?: string;
  ip?: string;
  device?: string;
  os?: string;
  browser?: string;
  timestamp: Date;
}

export interface RowtLoginDTO {
  email: string;
  password: string;
}

export interface RowtTokens {
  access_token: string;
  refresh_token: string;
}

export interface RowtUpdatePasswordDTO {
  email: string;
  password: string;
}

export interface RowtUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export interface RowtLoginResponseDTO {
  tokens: RowtTokens;
  user: RowtUser;
}

export interface RowtGetProjectOptions {
  includeLinks?: boolean;
  includeInteractions?: boolean;
  startDate?: Date;
  endDate?: Date;
  getPreviousPeriod?: boolean;
}

export interface RowtProject {
  id: string;
  name: string;
  baseUrl: string;
  fallbackUrl: string;
  appStoreId?: string;
  playStoreId?: string;
  userId: string;
  links?: RowtLink[];
  previousPeriodInteractionCount?: number;
  interactions?: RowtInteraction[];
}
