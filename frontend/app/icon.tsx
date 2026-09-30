import { ImageResponse } from "next/og"
import { PixelMark } from "@/lib/pixel-mark"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(<PixelMark size={512} />, size)
}
