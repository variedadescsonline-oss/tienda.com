import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  Sun,
  Contrast,
  Palette,
  Check,
  Crop,
  Layers,
  Wand2,
  Maximize2,
  RefreshCcw,
} from 'lucide-react';

interface ProductPhotoEditorModalProps {
  isOpen: boolean;
  initialImage: string;
  onClose: () => void;
  onSaveEnhancedImage: (enhancedDataUrl: string) => void;
}

type AspectRatio = '1:1' | '4:5' | 'original';
type StudioBackdrop = 'none' | 'white' | 'warm-light' | 'luxury-border';

export const ProductPhotoEditorModal: React.FC<ProductPhotoEditorModalProps> = ({
  isOpen,
  initialImage,
  onClose,
  onSaveEnhancedImage,
}) => {
  const [brightness, setBrightness] = useState<number>(108); // 100 is normal
  const [contrast, setContrast] = useState<number>(114); // 100 is normal
  const [saturation, setSaturation] = useState<number>(115); // 100 is normal
  const [warmth, setWarmth] = useState<number>(0); // -30 to +30
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [backdrop, setBackdrop] = useState<StudioBackdrop>('white');
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image when modal opens or initialImage changes
  useEffect(() => {
    if (!isOpen || !initialImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
    img.src = initialImage;
  }, [isOpen, initialImage]);

  // Preset quick filters
  const applyAutoEnhance = () => {
    setBrightness(110);
    setContrast(118);
    setSaturation(120);
    setWarmth(4);
    setBackdrop('white');
  };

  const applyFashionPreset = () => {
    setBrightness(105);
    setContrast(122);
    setSaturation(125);
    setWarmth(2);
    setBackdrop('luxury-border');
  };

  const applyPerfumePreset = () => {
    setBrightness(112);
    setContrast(120);
    setSaturation(110);
    setWarmth(-3);
    setBackdrop('white');
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setRotation(0);
    setAspectRatio('1:1');
    setBackdrop('none');
  };

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Re-render canvas whenever settings change
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target dimensions
    let targetWidth = 1080;
    let targetHeight = 1080;

    if (aspectRatio === '4:5') {
      targetWidth = 1080;
      targetHeight = 1350;
    } else if (aspectRatio === 'original') {
      const isRotated = rotation === 90 || rotation === 270;
      const srcW = isRotated ? img.naturalHeight : img.naturalWidth;
      const srcH = isRotated ? img.naturalWidth : img.naturalHeight;
      const maxDim = 1200;
      const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
      targetWidth = Math.round(srcW * scale);
      targetHeight = Math.round(srcH * scale);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 1. Draw Studio Background
    if (backdrop === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (backdrop === 'warm-light') {
      const bgGrad = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        50,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.8
      );
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(1, '#F7F1E8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (backdrop === 'luxury-border') {
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // 2. Apply Image Filters
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Translation to center for rotation
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate source image drawing bounds (fitted nicely inside canvas)
    const isRotated = rotation === 90 || rotation === 270;
    const currentImgW = isRotated ? img.naturalHeight : img.naturalWidth;
    const currentImgH = isRotated ? img.naturalWidth : img.naturalHeight;

    // Padding if backdrop is active so product doesn't touch borders
    const padding = backdrop !== 'none' ? Math.round(targetWidth * 0.05) : 0;
    const availableW = targetWidth - padding * 2;
    const availableH = targetHeight - padding * 2;

    const scale = Math.min(availableW / currentImgW, availableH / currentImgH);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 3. Optional Warmth Tint
    if (warmth !== 0) {
      ctx.save();
      ctx.globalCompositeOperation = warmth > 0 ? 'soft-light' : 'overlay';
      ctx.fillStyle = warmth > 0 ? `rgba(255, 175, 75, ${Math.abs(warmth) / 120})` : `rgba(75, 150, 255, ${Math.abs(warmth) / 120})`;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();
    }

    // 4. Studio Vignette / Border framing if luxury-border
    if (backdrop === 'luxury-border') {
      ctx.save();
      ctx.strokeStyle = 'rgba(206, 93, 69, 0.25)'; // VariedadesCS coral accent
      ctx.lineWidth = Math.round(targetWidth * 0.015);
      ctx.strokeRect(padding * 0.6, padding * 0.6, targetWidth - padding * 1.2, targetHeight - padding * 1.2);
      ctx.restore();
    }
  }, [brightness, contrast, saturation, warmth, rotation, aspectRatio, backdrop]);

  useEffect(() => {
    if (isOpen && imgRef.current) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRendering(true);
    try {
      // Export as high-quality JPEG (0.88 quality is crystal sharp and fast)
      const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onSaveEnhancedImage(enhancedDataUrl);
      onClose();
    } catch (e) {
      console.error('Error saving enhanced image:', e);
    } finally {
      setIsRendering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="photo-editor-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="photo-editor-modal"
        className="relative w-full max-w-2xl bg-[#1e1e1e] text-white rounded-3xl shadow-2xl border border-stone-800 flex flex-col max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#252525] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ce5d45] text-white flex items-center justify-center shadow-md">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <span>Editor Profesional de Producto</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Estudio HD
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Mejora fotos tomadas con el teléfono para catálogo boutique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
            aria-label="Cerrar editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Canvas Preview */}
          <div className="relative rounded-2xl bg-[#141414] border border-stone-800 p-2 flex items-center justify-center min-h-[260px] sm:min-h-[320px] max-h-[40vh] overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="max-h-[38vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-lg"
            />
            {/* Quick rotate overlay button */}
            <button
              type="button"
              onClick={rotate90}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 border border-white/10 shadow-md transition-transform active:scale-95"
              title="Girar 90 grados"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#ce5d45]" />
              <span>Girar 90°</span>
            </button>
          </div>

          {/* Quick 1-Click Auto Enhance Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              ✨ Realce con 1 Clic (Recomendado)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={applyAutoEnhance}
                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-[#ce5d45] to-[#b54c35] text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:brightness-110 active:scale-98 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="leading-tight">Estudio Boutique</span>
              </button>
              <button
                type="button"
                onClick={applyFashionPreset}
                className="py-2.5 px-2 rounded-xl bg-[#2a2a2a] hover:bg-[#333] border border-stone-700 text-stone-200 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-98 transition-all"
              >
                <Palette className="w-4 h-4 text-pink-400" />
                <span className="leading-tight">Moda & Ropa</span>
              </button>
              <button
                type="button"
                onClick={applyPerfumePreset}
                className="py-2.5 px-2 rounded-xl bg-[#2a2a2a] hover:bg-[#333] border border-stone-700 text-stone-200 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-98 transition-all"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="leading-tight">Perfumes & Lujo</span>
              </button>
            </div>
          </div>

          {/* Backdrop & Aspect Ratio controls */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Format / Aspect Ratio */}
            <div className="bg-[#262626] p-3 rounded-2xl border border-stone-800 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Crop className="w-3 h-3 text-[#ce5d45]" />
                <span>Formato de Catálogo</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    aspectRatio === '1:1'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  1:1 Cuadrado
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('4:5')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    aspectRatio === '4:5'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  4:5 Vestidos
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('original')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    aspectRatio === 'original'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Original
                </button>
              </div>
            </div>

            {/* Studio Background */}
            <div className="bg-[#262626] p-3 rounded-2xl border border-stone-800 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#ce5d45]" />
                <span>Fondo de Estudio</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setBackdrop('white')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    backdrop === 'white'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Blanco Puro
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('warm-light')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    backdrop === 'warm-light'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Luz Cálida
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('luxury-border')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    backdrop === 'luxury-border'
                      ? 'bg-[#ce5d45] text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Boutique
                </button>
              </div>
            </div>
          </div>

          {/* Fine Tuning Sliders */}
          <div className="bg-[#262626] p-3.5 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Ajustes Manuales
              </label>
              <button
                type="button"
                onClick={resetAdjustments}
                className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 underline"
              >
                <RefreshCcw className="w-2.5 h-2.5" />
                <span>Restablecer</span>
              </button>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Brillo / Iluminación</span>
                </span>
                <span className="font-mono text-[11px] text-stone-400">{brightness}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#ce5d45]"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contraste & Claridad</span>
                </span>
                <span className="font-mono text-[11px] text-stone-400">{contrast}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#ce5d45]"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>Intensidad de Colores</span>
                </span>
                <span className="font-mono text-[11px] text-stone-400">{saturation}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="160"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#ce5d45]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#252525] border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isRendering}
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando Foto de Catálogo...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar Foto Profesional</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
