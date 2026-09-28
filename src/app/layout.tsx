import type { Metadata } from "next";
import "./globals.css";
import { BibleStoreProvider } from "@/lib/store";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Bible Tracker",
  description: "Follow your Bible reading plan and track your daily progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <BibleStoreProvider>
          <AppShell>{children}</AppShell>
        </BibleStoreProvider>
      </body>
    </html>
  );
}
