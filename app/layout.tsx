import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/animations/reveal";
import { getSettings } from "@/features/public/queries";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
    title: { default: `${settings.clinic_name} | ${settings.tagline}`, template: `%s | ${settings.clinic_name}` },
    description: settings.hero_text,
  };
}

export const viewport: Viewport = {
  themeColor: "#0b7a7c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} antialiased`}>
      <body className="min-h-dvh">
        <MotionProvider>{children}</MotionProvider>
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-manrope)" } }} />
      </body>
    </html>
  );
}
