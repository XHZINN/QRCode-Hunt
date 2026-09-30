import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IT-WORKS · Caça ao QR",
    short_name: "IT-WORKS",
    description: "Escaneie, responda e suba no ranking do IT-WORKS — Escola de Tecnologia UNDB.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030304",
    theme_color: "#030304",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
