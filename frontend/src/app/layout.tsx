import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/shared/providers/supabase-provider";
import { QueryProvider } from "@/shared/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Datum — MSA Contract Q&A",
  description: "RAG-powered contract question answering system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <QueryProvider>{children}</QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
