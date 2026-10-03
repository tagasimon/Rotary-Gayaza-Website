import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Rotary Club of Gayaza", short_name: "RC Gayaza", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#17458F", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
