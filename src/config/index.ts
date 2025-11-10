import staticConfig from "../../config/app.config.json";

type StaticConfig = typeof staticConfig;

type AppConfig = {
  supabase: {
    url: string;
    anonKey: string;
    bucket: string;
    signedUrlTTL: number;
  };
  ui: StaticConfig["ui"];
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const bucketOverride = import.meta.env.VITE_SUPABASE_BUCKET?.trim();

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase config. Set VITE_SUPABASE_URL in your environment."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing Supabase config. Set VITE_SUPABASE_ANON_KEY in your environment."
  );
}

const mergedConfig: AppConfig = {
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    bucket: bucketOverride || staticConfig.supabase.bucket,
    signedUrlTTL: staticConfig.supabase.signedUrlTTL ?? 60,
  },
  ui: staticConfig.ui,
};

export const appConfig = mergedConfig;
