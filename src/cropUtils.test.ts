import { describe, expect, it } from "vitest";
import {
  buildOutputFileName,
  clampImageIndex,
  createCenteredAspectCrop,
  getAdjacentImageIndex,
  getScaledCropSource,
  normalizeOutputSize,
} from "./cropUtils";

describe("crop utilities", () => {
  it("keeps image navigation inside the available range", () => {
    expect(clampImageIndex(-4, 3)).toBe(0);
    expect(clampImageIndex(1, 3)).toBe(1);
    expect(clampImageIndex(12, 3)).toBe(2);
    expect(clampImageIndex(12, 0)).toBe(0);
    expect(getAdjacentImageIndex(0, 3, -1)).toBe(0);
    expect(getAdjacentImageIndex(1, 3, 1)).toBe(2);
  });

  it("normalizes output sizes to the supported export bounds", () => {
    expect(normalizeOutputSize(10)).toBe(64);
    expect(normalizeOutputSize(513.6)).toBe(514);
    expect(normalizeOutputSize(4096)).toBe(2048);
  });

  it("creates safe jpg file names from source names", () => {
    expect(buildOutputFileName("summer portrait.JPG")).toBe(
      "summer-portrait-crop.jpg",
    );
    expect(buildOutputFileName("---")).toBe("image-crop.jpg");
  });

  it("centers a square crop against the image aspect ratio", () => {
    const crop = createCenteredAspectCrop(1000, 500, 1, 50);

    expect(crop.unit).toBe("%");
    expect(crop.x).toBeCloseTo(25);
    expect(crop.y).toBeCloseTo(0);
    expect(crop.width).toBeCloseTo(50);
    expect(crop.height).toBeCloseTo(100);
  });

  it("maps rendered crop pixels back to natural image pixels", () => {
    const image = {
      height: 500,
      naturalHeight: 1000,
      naturalWidth: 2000,
      width: 1000,
    } as HTMLImageElement;

    expect(
      getScaledCropSource(image, {
        height: 400,
        unit: "px",
        width: 300,
        x: 10,
        y: 20,
      }),
    ).toEqual({
      height: 800,
      scaleX: 2,
      scaleY: 2,
      width: 600,
      x: 20,
      y: 40,
    });
  });
});
