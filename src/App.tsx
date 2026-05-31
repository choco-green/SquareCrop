import {
  type ChangeEvent,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  convertToPixelCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  RotateCcw,
  Scissors,
} from "lucide-react";
import "./styles/index.css";
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_OUTPUT_SIZE,
  MAX_OUTPUT_SIZE,
  MIN_OUTPUT_SIZE,
  buildOutputFileName,
  createCenteredAspectCrop,
  downloadDataUrl,
  exportCropToDataUrl,
  getAdjacentImageIndex,
  isUsablePixelCrop,
  normalizeOutputSize,
} from "./cropUtils";

interface ImageItem {
  id: string;
  name: string;
  source: string;
}

const bundledImageModules = import.meta.glob<string>(
  "./images/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

const bundledImages = Object.entries(bundledImageModules)
  .map(([path, source]) => ({
    id: path,
    name: path.split("/").pop() ?? "image",
    source,
  }))
  .sort((left, right) =>
    left.name.localeCompare(right.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

function App() {
  const [userImages, setUserImages] = useState<ImageItem[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [outputSize, setOutputSize] = useState(DEFAULT_OUTPUT_SIZE);
  const [exportedCrop, setExportedCrop] = useState<{
    dataUrl: string;
    fileName: string;
    height: number;
    width: number;
  }>();
  const [status, setStatus] = useState("Ready");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const images = useMemo(() => [...bundledImages, ...userImages], [userImages]);
  const safeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
  const currentImage = images[safeImageIndex];
  const canGoPrevious = safeImageIndex > 0;
  const canGoNext = safeImageIndex < images.length - 1;
  const canExport = isUsablePixelCrop(completedCrop);
  const pendingFileName = currentImage
    ? buildOutputFileName(currentImage.name)
    : "image-crop.jpg";

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (imageIndex !== safeImageIndex) {
      setImageIndex(safeImageIndex);
    }
  }, [imageIndex, safeImageIndex]);

  function applyDefaultCrop(image: HTMLImageElement, message = "Ready"): void {
    const nextCrop = createCenteredAspectCrop(
      image.naturalWidth,
      image.naturalHeight,
      DEFAULT_ASPECT_RATIO,
    );

    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, image.width, image.height));
    setExportedCrop(undefined);
    setStatus(message);
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>): void {
    imageRef.current = event.currentTarget;
    applyDefaultCrop(event.currentTarget);
  }

  function moveImage(direction: -1 | 1): void {
    setImageIndex((current) =>
      getAdjacentImageIndex(current, images.length, direction),
    );
    setExportedCrop(undefined);
    setStatus("Ready");
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      setStatus("Choose an image file.");
      return;
    }

    const nextImages = files.map((file) => {
      const source = URL.createObjectURL(file);
      objectUrlsRef.current.push(source);

      return {
        id: `${file.name}-${source}`,
        name: file.name,
        source,
      };
    });

    setUserImages((current) => [...current, ...nextImages]);
    setImageIndex(images.length);
    setExportedCrop(undefined);
    setStatus(
      `${nextImages.length} image${nextImages.length === 1 ? "" : "s"} added`,
    );
    event.target.value = "";
  }

  function handleOutputSizeChange(value: string): void {
    const parsedSize = Number.parseInt(value, 10);
    setOutputSize(
      normalizeOutputSize(
        Number.isNaN(parsedSize) ? DEFAULT_OUTPUT_SIZE : parsedSize,
      ),
    );
    setExportedCrop(undefined);
  }

  function handleExport(): void {
    if (
      !currentImage ||
      !imageRef.current ||
      !isUsablePixelCrop(completedCrop)
    ) {
      setStatus("Choose a crop area before exporting.");
      return;
    }

    try {
      const result = exportCropToDataUrl({
        fileNameBase: currentImage.name,
        image: imageRef.current,
        outputSize,
        pixelCrop: completedCrop,
      });

      setExportedCrop(result);
      setStatus(`Exported ${result.width} x ${result.height}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed.");
    }
  }

  function handleDownload(): void {
    if (!exportedCrop) {
      return;
    }

    downloadDataUrl(exportedCrop.dataUrl, exportedCrop.fileName);
  }

  if (!currentImage) {
    return (
      <main className="app-shell app-shell--empty">
        <button
          className="button button--primary"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={18} />
          Add Images
        </button>
        <input
          ref={fileInputRef}
          accept="image/*"
          className="visually-hidden"
          multiple
          onChange={handleFilesSelected}
          type="file"
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Scissors aria-hidden="true" size={22} />
          </span>
          <div>
            <h1>Crop Resize</h1>
            <p>
              {images.length} image source{images.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="topbar__actions">
          <button
            className="button button--secondary"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <ImagePlus aria-hidden="true" size={18} />
            Add Images
          </button>
          <input
            ref={fileInputRef}
            accept="image/*"
            className="visually-hidden"
            multiple
            onChange={handleFilesSelected}
            type="file"
          />
        </div>
      </header>

      <section className="app-grid" aria-label="Crop workspace">
        <aside className="control-panel" aria-label="Image controls">
          <section className="panel-section">
            <span className="section-label">Image</span>
            <div className="image-stepper">
              <button
                aria-label="Previous image"
                className="icon-button"
                disabled={!canGoPrevious}
                onClick={() => moveImage(-1)}
                title="Previous image"
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
              <strong>
                {safeImageIndex + 1} / {images.length}
              </strong>
              <button
                aria-label="Next image"
                className="icon-button"
                disabled={!canGoNext}
                onClick={() => moveImage(1)}
                title="Next image"
                type="button"
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="file-name" title={currentImage.name}>
              {currentImage.name}
            </p>
          </section>

          <section className="panel-section">
            <label className="section-label" htmlFor="output-size">
              Output Size
            </label>
            <div className="range-row">
              <input
                id="output-size"
                max={MAX_OUTPUT_SIZE}
                min={MIN_OUTPUT_SIZE}
                onChange={(event) => handleOutputSizeChange(event.target.value)}
                step="16"
                type="range"
                value={outputSize}
              />
              <input
                aria-label="Output size in pixels"
                className="number-input"
                max={MAX_OUTPUT_SIZE}
                min={MIN_OUTPUT_SIZE}
                onChange={(event) => handleOutputSizeChange(event.target.value)}
                type="number"
                value={outputSize}
              />
            </div>
          </section>

          <section className="panel-section panel-section--actions">
            <button
              className="button button--secondary"
              onClick={() => {
                if (imageRef.current) {
                  applyDefaultCrop(imageRef.current, "Crop reset");
                }
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={18} />
              Reset Crop
            </button>
            <button
              className="button button--primary"
              disabled={!canExport}
              onClick={handleExport}
              type="button"
            >
              <Scissors aria-hidden="true" size={18} />
              Export Crop
            </button>
          </section>
        </aside>

        <section className="workspace" aria-label="Crop editor">
          <ReactCrop
            aspect={DEFAULT_ASPECT_RATIO}
            className="cropper"
            crop={crop}
            keepSelection
            minHeight={48}
            minWidth={48}
            onChange={(_, percentCrop) => {
              setCrop(percentCrop);
              setExportedCrop(undefined);
            }}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            ruleOfThirds
          >
            <img
              alt={currentImage.name}
              className="source-image"
              onLoad={handleImageLoad}
              src={currentImage.source}
            />
          </ReactCrop>
        </section>

        <aside className="preview-panel" aria-label="Export preview">
          <section className="panel-section">
            <span className="section-label">Preview</span>
            <div className="preview-frame">
              {exportedCrop ? (
                <img
                  alt="Exported crop preview"
                  className="preview-image"
                  src={exportedCrop.dataUrl}
                />
              ) : (
                <div className="preview-empty">
                  <Scissors aria-hidden="true" size={24} />
                  <span>
                    {outputSize} x {outputSize}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel-section">
            <span className="section-label">File</span>
            <p
              className="file-name"
              title={exportedCrop?.fileName ?? pendingFileName}
            >
              {exportedCrop?.fileName ?? pendingFileName}
            </p>
            <p className="status-line" role="status">
              {status}
            </p>
          </section>

          <button
            className="button button--primary button--wide"
            disabled={!exportedCrop}
            onClick={handleDownload}
            type="button"
          >
            <Download aria-hidden="true" size={18} />
            Download
          </button>
        </aside>
      </section>
    </main>
  );
}

export default App;
