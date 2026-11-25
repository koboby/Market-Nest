export const MAX_IMAGE_BYTES = 100 * 1024;
const TARGET_BYTES = 94 * 1024;
const MAX_DIMENSION = 2400;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened. Try another image."));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Image compression failed. Please try another image.")),
      "image/webp",
      quality,
    );
  });
}

/**
 * Converts supported browser images to WebP and iteratively lowers quality and
 * dimensions until the output is safely below the 100 KB storage ceiling.
 */
export async function compressImageUnder100KB(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    throw new Error("SVG and GIF uploads are not supported. Please use JPG, PNG or WebP.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Your browser cannot process this image.");

  let best: Blob | null = null;
  for (let dimensionPass = 0; dimensionPass < 7; dimensionPass += 1) {
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.24]) {
      const blob = await canvasToWebp(canvas, quality);
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    }

    width = Math.max(240, Math.round(width * 0.78));
    height = Math.max(240, Math.round(height * 0.78));
  }

  if (best && best.size <= MAX_IMAGE_BYTES) {
    return new File([best], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  throw new Error("This image could not be compressed below 100 KB. Please choose a simpler or smaller image.");
}
