import {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";

export const DEFAULT_ASPECT_RATIO = 1;
export const DEFAULT_OUTPUT_SIZE = 512;
export const MIN_OUTPUT_SIZE = 64;
export const MAX_OUTPUT_SIZE = 2048;
export const JPEG_QUALITY = 0.92;

export type Direction = -1 | 1;

export interface CropExport {
  dataUrl: string;
  fileName: string;
  height: number;
  width: number;
}

export interface ExportCropOptions {
  fileNameBase: string;
  image: HTMLImageElement;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  outputSize?: number;
  pixelCrop: PixelCrop;
  quality?: number;
}

export function clampNumber(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error("Minimum cannot be greater than maximum.");
  }

  return Math.min(Math.max(value, min), max);
}

export function clampImageIndex(index: number, imageCount: number): number {
  if (imageCount <= 0) {
    return 0;
  }

  return clampNumber(index, 0, imageCount - 1);
}

export function getAdjacentImageIndex(
  currentIndex: number,
  imageCount: number,
  direction: Direction,
): number {
  return clampImageIndex(currentIndex + direction, imageCount);
}

export function normalizeOutputSize(value: number): number {
  return Math.round(clampNumber(value, MIN_OUTPUT_SIZE, MAX_OUTPUT_SIZE));
}

export function createCenteredAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect = DEFAULT_ASPECT_RATIO,
  widthPercent = 72,
): PercentCrop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: clampNumber(widthPercent, 1, 100),
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function isUsablePixelCrop(
  crop: PixelCrop | undefined,
): crop is PixelCrop {
  return Boolean(crop && crop.width > 0 && crop.height > 0);
}

export function buildOutputFileName(fileNameBase: string): string {
  const cleaned = fileNameBase
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${cleaned || "image"}-crop.jpg`;
}

export function getScaledCropSource(
  image: HTMLImageElement,
  crop: PixelCrop,
): {
  height: number;
  scaleX: number;
  scaleY: number;
  width: number;
  x: number;
  y: number;
} {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  return {
    height: Math.round(crop.height * scaleY),
    scaleX,
    scaleY,
    width: Math.round(crop.width * scaleX),
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
  };
}

export function exportCropToDataUrl({
  fileNameBase,
  image,
  mimeType = "image/jpeg",
  outputSize = DEFAULT_OUTPUT_SIZE,
  pixelCrop,
  quality = JPEG_QUALITY,
}: ExportCropOptions): CropExport {
  if (!isUsablePixelCrop(pixelCrop)) {
    throw new Error("Choose a crop area before exporting.");
  }

  const source = getScaledCropSource(image, pixelCrop);
  const size = normalizeOutputSize(outputSize);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is not available in this browser.");
  }

  canvas.width = size;
  canvas.height = size;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return {
    dataUrl: canvas.toDataURL(mimeType, quality),
    fileName: buildOutputFileName(fileNameBase),
    height: canvas.height,
    width: canvas.width,
  };
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
