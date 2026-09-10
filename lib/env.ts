export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function siteUrl(value = process.env.NEXT_PUBLIC_SITE_URL, environment = process.env.NODE_ENV) {
  if (!value) {
    if (environment === "production") {
      throw new Error("Missing environment variable: NEXT_PUBLIC_SITE_URL");
    }
    return "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid URL");
  }
  if (environment === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production");
  }
  return url.origin;
}
