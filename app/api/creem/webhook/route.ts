import { NextResponse, type NextRequest } from "next/server";
import { recordProductEvent } from "@/lib/app-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { shouldProcessCreemEvent, verifyCreemWebhookSignature } from "@/lib/creem";

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
  const { error: insertError } = await admin.from("creem_events").insert({ id: event.id, event_type: event.eventType });
  if (insertError?.code === "23505") {
    const { data: existingEvent, error: existingEventError } = await admin
      .from("creem_events")
      .select("processed_at")
      .eq("id", event.id)
      .maybeSingle();
    if (existingEventError) throw existingEventError;
    if (!existingEvent) throw new Error("Creem event record disappeared during duplicate handling");
    if (!shouldProcessCreemEvent(existingEvent.processed_at)) {
      return NextResponse.json({ received: true });
    }
  }
  if (insertError) throw insertError;

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
        .select("user_id, pet_profile_id")
        .maybeSingle();
      if (error) throw error;
      if (purchase) {
        await recordProductEvent({
          userId: purchase.user_id,
          petProfileId: purchase.pet_profile_id,
          eventName: "purchase_completed"
        });
      }
    }

    if (event.eventType === "refund.created") {
      const order = event.object.transaction?.order;
      const orderId = typeof order === "string" ? order : order?.id;
      if (orderId) {
        const { data: purchase, error } = await admin
          .from("purchases")
          .update({ status: "refunded", refunded_at: new Date().toISOString() })
          .eq("creem_order_id", orderId)
          .select("user_id, pet_profile_id")
          .maybeSingle();
        if (error) throw error;
        if (purchase) {
          await recordProductEvent({
            userId: purchase.user_id,
            petProfileId: purchase.pet_profile_id,
            eventName: "refund_created"
          });
        }
      }
    }

    await admin.from("creem_events").update({ processed_at: new Date().toISOString(), processing_error: null }).eq("id", event.id);
  } catch (error) {
    await admin
      .from("creem_events")
      .update({ processing_error: error instanceof Error ? error.message : "Unknown webhook error" })
      .eq("id", event.id);
    throw error;
  }

  return NextResponse.json({ received: true });
}
