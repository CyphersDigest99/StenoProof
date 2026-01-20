import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StenoProof - AI Transcript Proofreading",
  description: "Professional proofreading for court reporters and stenographers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
