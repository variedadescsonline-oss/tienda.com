/**
 * Auto-Photo Enhancer for VariedadesCS
 * Automatically enhances garment, accessory, and perfume photos
 * into clean, high-contrast, professional boutique studio shots
 * without requiring manual slider adjustments ("que lo edite solo").
 */

export interface AutoEnhanceOptions {
  targetSize?: number; // default 1080
  brightness?: number; // default 109
  contrast?: number; // default 116
  saturation?: number; // default 118
  warmth?: number; // default 3
  paddingPercent?: number; // default 0.04 (4% safe margin)
}

export async function autoEnhanceProductPhoto(
  source: string | File,
  options: AutoEnhanceOptions = {}
): Promise<string> {
  const {
    targetSize = 1080,
    brightness = 109,
    contrast = 116,
    saturation = 118,
    warmth = 3,
    paddingPercent = 0.04,
  } = options;

  let dataUrl: string;

  if (source instanceof File) {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    dataUrl = source;
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Studio Clean Backdrop (pure white with subtle luxury gradient edge)
        const bgGradient = ctx.createRadialGradient(
          targetSize / 2,
          targetSize / 2,
          targetSize * 0.15,
          targetSize / 2,
          targetSize / 2,
          targetSize * 0.72
        );
        bgGradient.addColorStop(0, '#FFFFFF');
        bgGradient.addColorStop(0.85, '#FAFAF9');
        bgGradient.addColorStop(1, '#F5F5F4');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, targetSize, targetSize);

        // 2. Optical balance filters (Brightness, Contrast, Saturation)
        ctx.save();
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        // Calculate scaling to fit within square canvas with breathing margin
        const padding = Math.round(targetSize * paddingPercent);
        const availableW = targetSize - padding * 2;
        const availableH = targetSize - padding * 2;

        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;

        const scale = Math.min(availableW / srcW, availableH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;

        const drawX = (targetSize - drawW) / 2;
        const drawY = (targetSize - drawH) / 2;

        // Draw soft contact shadow underneath to give floating depth like a studio table
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = Math.round(targetSize * 0.025);
        ctx.shadowOffsetY = Math.round(targetSize * 0.012);

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        // 3. Subtle Warm Studio Illumination
        if (warmth !== 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'soft-light';
          ctx.fillStyle = `rgba(255, 185, 110, ${Math.abs(warmth) / 100})`;
          ctx.fillRect(0, 0, targetSize, targetSize);
          ctx.restore();
        }

        // 4. Subtle Boutique Edge Framing
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 215, 210, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, targetSize - 1, targetSize - 1);
        ctx.restore();

        // 5. Output high-grade JPEG
        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(enhancedDataUrl);
      } catch (err) {
        console.warn('Auto-enhancement failed, returning original:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
