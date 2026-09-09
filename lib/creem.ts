import { createHmac, timingSafeEqual } from "node:crypto";
import { requiredEnv } from "./env";

type CreemCheckout = {
  id: string;
  checkout_url: string;
};

function creemEnvironment() {
  const environment = process.env.CREEM_ENVIRONMENT ?? "test";
  if (environment !== "test" && environment !== "production") {
    throw new Error("CREEM_ENVIRONMENT must be test or production");
  }
  return environment;
}

function creemEnvName(name: "API_KEY" | "WEBHOOK_SECRET" | "PRODUCT_ID") {
  return `CREEM_${creemEnvironment() === "test" ? "TEST" : "LIVE"}_${name}`;
}

export function creemProductId() {
  return requiredEnv(creemEnvName("PRODUCT_ID"));
}

function creemApiUrl() {
  return creemEnvironment() === "test" ? "https://test-api.creem.io" : "https://api.creem.io";
}

export async function createCreemCheckout(input: {
  productId: string;
  requestId: string;
  successUrl: string;
  email?: string;
  metadata: Record<string, string>;
}) {
  const response = await fetch(`${creemApiUrl()}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": requiredEnv(creemEnvName("API_KEY"))
    },
    body: JSON.stringify({
      product_id: input.productId,
      request_id: input.requestId,
      success_url: input.successUrl,
      customer: input.email ? { email: input.email } : undefined,
      metadata: input.metadata
    }),
    cache: "no-store"
  });

  const checkout = (await response.json().catch(() => null)) as CreemCheckout | null;
  if (!response.ok || !checkout?.id || !checkout.checkout_url) {
    throw new Error("Creem could not create a checkout");
  }
  return checkout;
}

export function verifyCreemWebhookSignature(body: string, signature: string) {
  const expected = createHmac("sha256", requiredEnv(creemEnvName("WEBHOOK_SECRET"))).update(body).digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function shouldProcessCreemEvent(processedAt: string | null) {
  return processedAt === null;
}
