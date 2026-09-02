import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Month Pet",
  description: "A first-month care plan for newly adopted cats and dogs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/home">
            First Month Pet
          </Link>
          <nav>
            <Link href="/home">Home</Link>
            <Link href="/plan">Plan</Link>
            <Link href="/profile">Profile</Link>
          </nav>
          <form action={signOutAction}>
            <button className="link-button" type="submit">
              Sign out
            </button>
          </form>
        </header>
        {children}
      </body>
    </html>
  );
}
