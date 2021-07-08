export interface WHFAppConfig {
  appName: string;
  daoId: number;
  projects: {
    banned: number[];
    featured: number[];
  };
  nfts: {
    banned: string[];
    featured: string[];
  };
}
