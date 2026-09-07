import Image from "next/image";
import { visualImage } from "@/lib/visuals";

export default function RefundPage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Refunds</h1>
        <p>First Month Pet is a one-time purchase for one pet profile.</p>
      </section>
      <Image
        className="section-image support-image"
        src={visualImage.support}
        alt="A quiet home workspace with a pet blanket and everyday care items"
        width={1100}
        height={700}
        sizes="(max-width: 760px) 100vw, 58vw"
      />
      <section className="panel stack">
        <div>
          <h2>7-day refund policy</h2>
          <p>Request a full refund within seven calendar days after purchase by emailing wqy1994yeah@gmail.com.</p>
        </div>
        <div>
          <h2>How refunds are handled</h2>
          <p>Approved refunds return to the original payment method. Creem processes the payment. We do not offer prorated refunds.</p>
        </div>
      </section>
    </main>
  );
}
