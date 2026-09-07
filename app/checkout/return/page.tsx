import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { checkoutStatus } from "@/lib/app-data";
import { visualImage } from "@/lib/visuals";

export default async function CheckoutReturnPage({
  searchParams
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const params = await searchParams;
  if (!params.checkout_id) redirect("/paywall");

  const status = await checkoutStatus(params.checkout_id);
  if (status === "paid") redirect("/home");

  return (
    <main className="page">
      <section className="panel">
        <h1>Checkout {status === "pending" ? "processing" : status}</h1>
        {status === "pending" ? (
          <p>
            We&apos;re confirming your payment with Creem. Please refresh this page in a moment. If
            access does not update, email wqy1994yeah@gmail.com.
          </p>
        ) : (
          <p>Free preview remains active for this pet profile.</p>
        )}
        <div className="task-row">
          <Link className="secondary" href="/paywall">
            Retry checkout
          </Link>
          <Link className="button" href="/home">
            Back home
          </Link>
        </div>
        <Image
          className="section-image checkout-image"
          src={visualImage.checkout}
          alt="A calm home entryway with a pet blanket, water bowl, and notebook"
          width={1000}
          height={620}
          sizes="(max-width: 760px) 100vw, 58vw"
        />
      </section>
    </main>
  );
}
