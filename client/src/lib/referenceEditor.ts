export type CropShape = 'original' | 'square' | 'portrait';
export type Rect = { x: number; y: number; width: number; height: number };
export type CropPlan = { rotatedWidth: number; rotatedHeight: number; source: Rect; output: { width: number; height: number } };
export type ReferenceEdit = { rotation: number; shape: CropShape; zoom: number; focusX: number; focusY: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function computeCropPlan(width: number, height: number, rotation: number, shape: CropShape, zoom: number, focusX: number, focusY: number, maxEdge = 1600): CropPlan {
  if (width <= 0 || height <= 0 || !Number.isFinite(width * height)) throw new Error('Invalid source image dimensions.');
  const degrees = ((rotation % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(degrees)) throw new Error('Rotation must be a quarter turn.');
  const rotatedWidth = degrees % 180 === 0 ? width : height;
  const rotatedHeight = degrees % 180 === 0 ? height : width;
  const ratio = shape === 'square' ? 1 : shape === 'portrait' ? 4 / 5 : rotatedWidth / rotatedHeight;
  const widest = Math.min(rotatedWidth, rotatedHeight * ratio);
  const tallest = widest / ratio;
  const sourceWidth = widest / clamp(zoom, 1, 3);
  const sourceHeight = tallest / clamp(zoom, 1, 3);
  const source: Rect = {
    x: (rotatedWidth - sourceWidth) * clamp(focusX, 0, 100) / 100,
    y: (rotatedHeight - sourceHeight) * clamp(focusY, 0, 100) / 100,
    width: sourceWidth,
    height: sourceHeight,
  };
  const scale = Math.min(1, clamp(maxEdge, 1, 4096) / Math.max(sourceWidth, sourceHeight));
  return {
    rotatedWidth, rotatedHeight, source,
    output: { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) },
  };
}

export function renderReferenceCrop(image: HTMLImageElement, canvas: HTMLCanvasElement, edit: ReferenceEdit): void {
  if (image.naturalWidth * image.naturalHeight > 24_000_000) throw new Error('This image is too large to edit in the browser. Choose a smaller photo.');
  const plan = computeCropPlan(image.naturalWidth, image.naturalHeight, edit.rotation, edit.shape, edit.zoom, edit.focusX, edit.focusY);
  const oriented = document.createElement('canvas');
  oriented.width = plan.rotatedWidth;
  oriented.height = plan.rotatedHeight;
  const sourceContext = oriented.getContext('2d');
  const targetContext = canvas.getContext('2d');
  if (!sourceContext || !targetContext) throw new Error('Image editing is not supported in this browser.');
  const degrees = ((edit.rotation % 360) + 360) % 360;
  sourceContext.translate(plan.rotatedWidth / 2, plan.rotatedHeight / 2);
  sourceContext.rotate(degrees * Math.PI / 180);
  sourceContext.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  canvas.width = plan.output.width;
  canvas.height = plan.output.height;
  targetContext.drawImage(oriented, plan.source.x, plan.source.y, plan.source.width, plan.source.height, 0, 0, canvas.width, canvas.height);
}

export function exportEditedReference(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not export this crop; try a smaller image.')), 'image/webp', .86);
  });
}
