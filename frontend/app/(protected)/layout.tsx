"use client";

import { AuthGate } from "@/components/AuthGate";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthGate>{children}</AuthGate>;
}
