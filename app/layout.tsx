import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Theme } from "@radix-ui/themes";
import { Geist } from "next/font/google";
import { signOutAction } from "./actions";
import { MilestoneMoment } from "./milestone-moment";
import { PrimaryNav } from "./primary-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "@radix-ui/themes/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Month Pet",
  description: "A first-month care plan for newly adopted cats and dogs."
};

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={geist.variable}>
        <Theme accentColor="gray" grayColor="gray" radius="medium" scaling="100%">
        {user ? (
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/home">
                <Image
                  src="/brand/first-month-pet-mark-v2.png"
                  alt=""
                  width={40}
                  height={40}
                  priority
                />
                <span>First Month Pet</span>
              </Link>
              <PrimaryNav />
              <form action={signOutAction}>
                <button className="link-button" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </header>
        ) : null}
        {children}
        {user ? <MilestoneMoment /> : null}
        <footer className="public-footer">
          <nav aria-label="Public information">
            <Link href="/about">About</Link>
            <Link href="/guidance">Guidance</Link>
            <Link href="/refund">Refund</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </footer>
        </Theme>
      </body>
    </html>
  );
}
