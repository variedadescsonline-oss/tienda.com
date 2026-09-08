import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Trash2, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface ProductImageUploaderProps {
  currentImage: string;
  onImageChange: (dataUrlOrUrl: string) => void;
  presetImages?: Array<{ label: string; url: string }>;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  currentImage,
  onImageChange,
  presetImages = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(currentImage || '');

  React.useEffect(() => {
    setUrlInputValue(currentImage || '');
  }, [currentImage]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const compressedDataUrl = await compressImageFile(file, 1000, 1000, 0.82);
      onImageChange(compressedDataUrl);
      setUrlInputValue(compressedDataUrl);
    } catch (err: any) {
      console.error('Error compressing image:', err);
      setErrorMessage(err.message || 'No se pudo procesar la imagen del teléfono.');
    } finally {
      setIsProcessing(false);
      // Reset inputs so the same photo can be re-selected if needed
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInputValue.trim()) {
      onImageChange(urlInputValue.trim());
      setErrorMessage(null);
    }
  };

  const handleClearImage = () => {
    onImageChange('');
    setUrlInputValue('');
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Preview and Upload Container */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            Foto del Producto
          </label>
          <span className="text-[10px] text-stone-500 font-medium">
            Compatible con fotos de celular
          </span>
        </div>

        {/* Current Image Preview */}
        {currentImage ? (
          <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-white aspect-4/3 sm:aspect-16/9 flex items-center justify-center group shadow-xs">
            <img
              src={currentImage}
              alt="Vista previa del producto"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white text-[#20201e] text-xs font-bold shadow-md hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#ce5d45]" />
                <span>Cambiar</span>
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>

            {/* Mobile always visible action pills */}
            <div className="sm:hidden absolute bottom-2 right-2 flex gap-1.5 bg-black/60 backdrop-blur-xs p-1 rounded-xl">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-white/90 text-[#20201e] text-[11px] font-bold"
                title="Cambiar foto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="p-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold"
                title="Eliminar foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State / Upload Callout */
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-6 text-center">
            {isProcessing ? (
              <div className="py-6 space-y-2">
                <div className="w-8 h-8 border-3 border-[#ce5d45] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-700">Optimizando foto del teléfono...</p>
                <p className="text-[10px] text-stone-400">Comprimiendo para carga ultrarrápida</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#ce5d45] flex items-center justify-center mx-auto border border-amber-200">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#20201e]">
                    Sube una foto directamente desde tu teléfono
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Toma una foto de la prenda o elígela de tu galería de imágenes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons for Mobile Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#20201e] hover:bg-[#ce5d45] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-[#d89c35]" />
            <span>Tomar Foto con Cámara</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-[#20201e] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-[#ce5d45]" />
            <span>Galería del Teléfono</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Toggle between phone upload and URL / Presets */}
        <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-stone-500 hover:text-stone-800 font-semibold inline-flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3 text-[#d89c35]" />
            <span>{showUrlInput ? 'Ocultar enlace URL' : '¿Prefieres pegar una URL o usar presets?'}</span>
          </button>
          {currentImage && (
            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Foto cargada
            </span>
          )}
        </div>

        {/* URL Input & Presets section */}
        {showUrlInput && (
          <div className="pt-2 space-y-2.5 animate-in fade-in">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-[#20201e]"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-3.5 py-2 bg-[#20201e] hover:bg-[#ce5d45] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Aplicar
              </button>
            </div>

            {presetImages.length > 0 && (
              <div>
                <span className="text-[10px] text-stone-400 block mb-1">
                  Fotos predeterminadas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetImages.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onImageChange(preset.url);
                        setUrlInputValue(preset.url);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#ce5d45] text-[10px] font-semibold text-stone-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
