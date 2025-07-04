import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Numbly Oráculo - Sua Jornada Numerológica",
  description:
    "Descubra os mistérios da numerologia com o Numbly Oráculo. Mapa numerológico personalizado, compatibilidade amorosa e orientação espiritual através da IA.",
  keywords:
    "numerologia, oráculo, mapa numerológico, compatibilidade, espiritualidade, IA",
  authors: [{ name: "Numbly Oráculo" }],
  openGraph: {
    title: "Numbly Oráculo - Sua Jornada Numerológica",
    description:
      "Descubra os mistérios da numerologia com orientação personalizada",
    type: "website",
    locale: "pt_BR",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1E1E2E",
};
