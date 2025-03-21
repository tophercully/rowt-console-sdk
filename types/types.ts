export interface Link {
  id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  fallbackUrlOverride?: string;
  additionalMetadata?: Record<string, any>;
  properties: Record<string, any>;
  lifetimeClicks: number;
  interactions?: Interaction[];
}

export interface Interaction {
  id: string;
  link: Link;
  referer?: string;
  ip?: string;
  device?: string;
  os?: string;
  browser?: string;
  timestamp: Date;
}
