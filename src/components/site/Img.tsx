import Image, { type ImageProps } from "next/image";

/** next/image with sensible defaults; falls back to a warm paper block when no src. */
export function Img({ src, alt, className, ...rest }: Omit<ImageProps, "src"> & { src?: string | null }) {
  if (!src) return <div aria-hidden className={`bg-paper-2 ${className ?? ""}`} />;
  const unoptimized = src.endsWith(".svg") || process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true";
  return <Image src={src} alt={alt} className={className} unoptimized={unoptimized} {...rest} />;
}
