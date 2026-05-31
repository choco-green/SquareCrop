# Crop Resize

A browser-based image cropper for producing square JPG exports from bundled or local images. The app runs entirely in the client: images selected from disk are loaded with object URLs, cropped with `react-image-crop`, rendered through Canvas, and downloaded without a server round trip.

## What It Does

- Loads bundled sample images from `src/images`.
- Accepts multiple local image uploads.
- Keeps crop navigation inside valid image bounds.
- Starts each image with a centered square crop.
- Exports a resized square JPG from 64px to 2048px.
- Shows an export preview before download.
- Includes focused tests for crop sizing, file naming, and navigation helpers.

## Stack

- React 19
- Vite 8
- TypeScript 6
- react-image-crop 11
- lucide-react
- Vitest

Create React App, the unused `react-cropper` package, and the Tailwind/PostCSS watcher chain were removed. Vite covers the dev server and production build with less configuration and fewer dependencies.

## Requirements

Vite 8 requires Node `^20.19.0` or `>=22.12.0`.

The current local environment used for this update was:

```sh
node --version
# v22.15.0

npm --version
# 11.6.2
```

## Scripts

```sh
npm run dev
```

Starts the Vite dev server.

```sh
npm run build
```

Runs TypeScript checks and creates a production build.

```sh
npm run preview
```

Serves the production build locally.

```sh
npm test
```

Runs Vitest once.

```sh
npm run format
```

Formats project files with Prettier.

## Project Layout

```text
src/
  App.tsx              Main cropper UI and image upload flow
  cropUtils.ts         Pure crop/export/navigation helpers
  cropUtils.test.ts    Focused utility tests
  images/              Bundled image sources
  styles/index.css     App styles
```

## Crop Flow

1. The app collects bundled images with Vite `import.meta.glob`.
2. Uploaded images are added with `URL.createObjectURL`.
3. `createCenteredAspectCrop` creates a square percentage crop on image load.
4. `react-image-crop` emits pixel crop data after edits.
5. `exportCropToDataUrl` maps rendered crop coordinates back to natural image pixels, draws the crop to a square Canvas, and returns a JPG data URL.
6. `downloadDataUrl` triggers a local download with a safe file name.

## Adding Images

Drop additional default images into `src/images`. JPG, JPEG, PNG, and WebP files are picked up automatically and sorted by file name.
