import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiveDataProvider } from "@/hooks/use-live-data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Matrix Smart Makkah — Smart City Operating System",
    template: "%s · Matrix Smart Makkah",
  },
  description:
    "A production-grade Smart City AI Platform for Makkah: real-time IoT telemetry, predictive analytics, and an Emergency AI Core. Built by Abdulaziz AlAmawi.",
  authors: [{ name: "Abdulaziz AlAmawi" }],
  creator: "Abdulaziz AlAmawi",
  keywords: [
    "Smart City",
    "Artificial Intelligence",
    "IoT",
    "Makkah",
    "Predictive Analytics",
    "Real-time Systems",
  ],
};

export const viewport: Viewport = {
  themeColor: "#06141f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LiveDataProvider>{children}</LiveDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
