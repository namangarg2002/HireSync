import dotenv from "dotenv";

dotenv.config({quiet: true});

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    console.error(`❌ Missing environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}


export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  CLIENT_URL: requireEnv("CLIENT_URL"),

  MONGO_URI: requireEnv("MONGO_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),

  INNGEST_EVENT_KEY: requireEnv("INNGEST_EVENT_KEY"),
  INNGEST_SIGNING_KEY: requireEnv("INNGEST_SIGNING_KEY"),

  STREAM_API_KEY: requireEnv("STREAM_API_KEY"),
  STREAM_SECRET_KEY: requireEnv("STREAM_SECRET_KEY"),

  CLERK_PUBLISHABLE_KEY: requireEnv("CLERK_PUBLISHABLE_KEY"),
  CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
};

console.log("✅ Environment variables loaded successfully");