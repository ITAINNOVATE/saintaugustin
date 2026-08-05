import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Auto École Saint Augustin",
    template: "%s | Auto École Saint Augustin",
  },
  description:
    "Plateforme digitale de l'Auto École Saint Augustin — Gestion des inscriptions, apprentissage du Code de la route, examens blancs et suivi de progression.",
  keywords: [
    "auto-école",
    "code de la route",
    "Bénin",
    "permis de conduire",
    "Saint Augustin",
    "formation",
    "e-learning",
  ],
  openGraph: {
    title: "Auto École Saint Augustin",
    description: "Plateforme digitale de gestion d'auto-école au Bénin",
    type: "website",
    locale: "fr_BJ",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
