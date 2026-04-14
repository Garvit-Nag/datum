import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { SupabaseProvider } from "@/shared/providers/supabase-provider";
import { QueryProvider } from "@/shared/providers/query-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Datum — MSA Contract Intelligence",
  description:
    "RAG-powered contract question answering. Upload your MSA, ask anything, get evidence-backed answers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-grid min-h-screen">
        <ThemeProvider>
          <SupabaseProvider>
            <QueryProvider>{children}</QueryProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
