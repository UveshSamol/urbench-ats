import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UrBench ATS",
  description: "Internal AI-powered ATS for SAP staffing",
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