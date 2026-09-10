import { NextResponse, type NextRequest } from "next/server";
import { recordProductEvent } from "@/lib/app-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyCreemWebhookSignature } from "@/lib/creem";

type CreemEvent = {
  id: string;
  eventType: string;
  object: {
    id?: string;
    metadata?: Record<string, unknown>;
    order?: { id?: string; customer?: string; status?: string };
    transaction?: { order?: string | { id?: string } };
  };
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function eventError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("creem-signature");
  if (!signature || !verifyCreemWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(body) as CreemEvent;
  } catch {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  if (!event.id || !event.eventType) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const orderReference = event.object.transaction?.order
    ? typeof event.object.transaction.order === "string"
      ? event.object.transaction.order
      : event.object.transaction.order.id ?? null
    : event.object.order?.id ?? null;
  const { data: claimed, error: claimError } = await admin.rpc("claim_creem_event", {
    p_event_id: event.id,
    p_event_type: event.eventType,
    p_order_reference: orderReference,
    p_event_payload: event
  });
  if (claimError) throw claimError;
  if (claimed !== true) return NextResponse.json({ received: true });

  try {
    if (event.eventType === "checkout.completed" && event.object.order?.status === "paid") {
      const metadata = event.object.metadata ?? {};
      const purchaseId = stringValue(metadata.purchase_id);
      const userId = stringValue(metadata.user_id);
      const petProfileId = stringValue(metadata.pet_profile_id);
      if (!purchaseId || !userId || !petProfileId || !event.object.id || !event.object.order.id) {
        throw new Error("Checkout metadata is incomplete");
      }

      const { data: purchase, error } = await admin
        .from("purchases")
        .update({
          status: "paid",
          purchased_at: new Date().toISOString(),
          creem_customer_id: event.object.order.customer ?? null,
          creem_checkout_id: event.object.id,
          creem_order_id: event.object.order.id
        })
        .eq("id", purchaseId)
        .eq("user_id", userId)
        .eq("pet_profile_id", petProfileId)
        .eq("status", "pending")
        .select("user_id, pet_profile_id")
        .maybeSingle();
      if (error) throw error;
      if (purchase) {
        await recordProductEvent({
          userId: purchase.user_id,
          petProfileId: purchase.pet_profile_id,
          eventName: "purchase_completed"
        });
      } else {
        const { data: completedPurchase, error: completedPurchaseError } = await admin
          .from("purchases")
          .select("status, creem_checkout_id, creem_order_id")
          .eq("id", purchaseId)
          .eq("user_id", userId)
          .eq("pet_profile_id", petProfileId)
          .maybeSingle();
        if (completedPurchaseError) throw completedPurchaseError;
        if (
          !completedPurchase ||
          completedPurchase.status !== "paid" ||
          (completedPurchase.creem_checkout_id !== event.object.id && completedPurchase.creem_order_id !== event.object.order.id)
        ) {
          throw new Error("Checkout does not match a pending purchase");
        }
      }
    }

    if (event.eventType === "refund.created") {
      const order = event.object.transaction?.order;
      const orderId = typeof order === "string" ? order : order?.id;
      if (!orderId) throw new Error("Refund order is missing");
      const { data: purchase, error } = await admin
        .from("purchases")
        .update({ status: "refunded", refunded_at: new Date().toISOString() })
        .eq("creem_order_id", orderId)
        .eq("status", "paid")
        .select("user_id, pet_profile_id")
        .maybeSingle();
      if (error) throw error;
      if (purchase) {
        await recordProductEvent({
          userId: purchase.user_id,
          petProfileId: purchase.pet_profile_id,
          eventName: "refund_created"
        });
      } else {
        const { data: refundedPurchase, error: refundedPurchaseError } = await admin
          .from("purchases")
          .select("status")
          .eq("creem_order_id", orderId)
          .maybeSingle();
        if (refundedPurchaseError) throw refundedPurchaseError;
        if (!refundedPurchase || refundedPurchase.status !== "refunded") {
          throw new Error("Refund does not match a paid purchase");
        }
      }
    }

    const { data: completed, error: completeError } = await admin.rpc("complete_creem_event", { p_event_id: event.id });
    if (completeError || completed !== true) throw completeError ?? new Error("Could not complete Creem event");
  } catch (error) {
    const { data: released, error: releaseError } = await admin.rpc("release_creem_event", {
      p_event_id: event.id,
      p_error: eventError(error)
    });
    if (releaseError || released !== true) throw releaseError ?? new Error("Could not release Creem event");
    throw error;
  }

  return NextResponse.json({ received: true });
}
