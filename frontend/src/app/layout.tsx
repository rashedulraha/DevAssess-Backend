import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevAssess — Developer Assessment & Technical Hiring Platform",
  description: "Next-generation developer evaluation platform featuring isolated code execution, proctoring telemetry, and automated candidate grading.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-[#f3f4f6]">
        {children}
      </body>
    </html>
  );
}
