import React from "react";

// Minimal root layout — locale and providers are handled in app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
