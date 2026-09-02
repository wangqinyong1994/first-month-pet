import { NextResponse, type NextRequest } from "next/server";
import { checkoutStatus } from "@/lib/app-data";

export async function GET(request: NextRequest) {
  const checkoutId = request.nextUrl.searchParams.get("checkout_id");
  if (!checkoutId) return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });

  return NextResponse.json({ status: await checkoutStatus(checkoutId) });
}
