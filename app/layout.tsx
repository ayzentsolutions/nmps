import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "School Website", template: "%s | School Website" },
  description: "Official school information, learning updates, events and admissions."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}