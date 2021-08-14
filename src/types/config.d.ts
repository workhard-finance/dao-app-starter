export interface WHFAppConfig {
  appName: string;
  daoId: number;
  pool2Factory: string;
  projects: {
    banned: number[];
    featured: number[];
  };
  nfts: {
    banned: string[];
    featured: string[];
  };
}
