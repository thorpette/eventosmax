export interface AppConfig {
  port: number;
  nodeEnv: string;
  databasePath: string;
  apiKey: string;
  salesApiUrl: string;
  defaultMinAge: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 4000),
    nodeEnv: env.NODE_ENV ?? "development",
    databasePath: env.DATABASE_PATH ?? "./data/passlive.db",
    apiKey: env.API_KEY ?? "passlive-dev-key",
    salesApiUrl: env.SALES_API_URL ?? "http://localhost:4000",
    defaultMinAge: Number(env.DEFAULT_MIN_AGE ?? 18),
  };
}
