import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  CameraDevice,
} from 'html5-qrcode';
import {
  X,
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  AlertCircle,
  Barcode,
  CheckCircle2,
  Sparkles,
  Zap,
  ZapOff,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  continuous?: boolean;
  lastScannedFeedback?: {
    code: string;
    productName?: string;
    success: boolean;
  } | null;
}

// Crisp register audio beep & haptic vibration
function playBeep(success = true) {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = success ? 1550 : 440;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // AudioContext blocked or not supported
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(success ? [80, 50, 80] : 200);
    } catch {
      // ignore
    }
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barra',
  subtitle = 'Apunta la cámara al código de la prenda, etiqueta o caja',
  continuous = false,
  lastScannedFeedback,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [recentScan, setRecentScan] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerId = 'barcode-camera-viewport';
  const lastScannedCodeRef = useRef<string | null>(null);
  const isCooldownRef = useRef(false);

  // Stop camera stream safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  // Handle a successfully decoded barcode
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      // In continuous mode, prevent firing multiple times for the exact same scan within 1.8s
      if (isCooldownRef.current && lastScannedCodeRef.current === cleanCode) {
        return;
      }

      playBeep(true);
      setRecentScan(cleanCode);
      lastScannedCodeRef.current = cleanCode;

      onScan(cleanCode);

      if (!continuous) {
        // Single scan: stop and close
        stopScanner().then(() => {
          onClose();
        });
      } else {
        // Continuous mode: brief pause/cooldown to prevent rapid multi-reads
        isCooldownRef.current = true;
        setIsCooldown(true);
        setTimeout(() => {
          isCooldownRef.current = false;
          setIsCooldown(false);
        }, 1600);
      }
    },
    [continuous, onScan, onClose, stopScanner]
  );

  // Start scanning using html5-qrcode
  const startScanner = useCallback(
    async (cameraId?: string) => {
      setIsStarting(true);
      setScannerError(null);

      try {
        await stopScanner();

        // Check for cameras
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        let targetCameraId: string | { facingMode: string } = { facingMode: 'environment' };

        if (cameraId) {
          targetCameraId = cameraId;
          setActiveCameraId(cameraId);
        } else if (devices && devices.length > 0) {
          // Prefer back/environment camera if found in device label
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('trasera') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          if (backCam) {
            targetCameraId = backCam.id;
            setActiveCameraId(backCam.id);
          } else {
            targetCameraId = devices[devices.length - 1].id;
            setActiveCameraId(devices[devices.length - 1].id);
          }
        }

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          targetCameraId,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // 1D retail barcodes are horizontal rectangles
              const width = Math.min(Math.floor(viewfinderWidth * 0.85), 360);
              const height = Math.min(Math.floor(viewfinderHeight * 0.5), 180);
              return { width: Math.max(width, 240), height: Math.max(height, 120) };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {
            // Frame scan miss (normal during video preview)
          }
        );

        // Check torch capabilities
        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          if (capabilities && 'torch' in capabilities) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }

        setIsStarting(false);
      } catch (err: unknown) {
        console.error('Error starting barcode camera:', err);
        const errMsg =
          err instanceof Error
            ? err.message
            : 'No se pudo acceder a la cámara. Revisa los permisos de tu navegador.';
        setScannerError(errMsg);
        setIsStarting(false);
      }
    },
    [handleDecodedText, stopScanner]
  );

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }] as any,
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Switch camera (front/back or alternate lens)
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      startScanner(nextCamera.id);
    }
  };

  // Fallback: Scan photo file from gallery/camera capture
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsStarting(true);
      const tempScanner =
        scannerRef.current ||
        new Html5Qrcode(readerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

      const result = await tempScanner.scanFile(file, true);
      handleDecodedText(result);
      setIsStarting(false);
    } catch (err) {
      console.warn('File barcode read failed:', err);
      playBeep(false);
      alert('No se detectó un código de barra legible en la imagen. Intenta con una foto más nítida y enfocada.');
      setIsStarting(false);
    }
  };

  // Manual code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedText(manualCode.trim());
    setManualCode('');
  };

  // Effect: start/stop on isOpen
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-backdrop"
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={() => {
        stopScanner();
        onClose();
      }}
    >
      <div
        id="barcode-scanner-modal"
        className="relative w-full max-w-lg bg-[#18181b] text-white rounded-3xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ce5d45] text-white flex items-center justify-center shadow-md shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>{title}</span>
                {continuous && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                    Modo Ráfaga POS
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400 truncate max-w-[240px] sm:max-w-xs">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
            title="Cerrar escáner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Code Mount Element */}
          <div
            id={readerId}
            className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {/* Aiming Reticle Overlay for Barcodes */}
          {!scannerError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Semi-dark mask around target */}
              <div className="relative w-full max-w-[320px] h-[150px] sm:h-[170px] rounded-2xl border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center">
                {/* Corner markers */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-[#ce5d45] rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-[#ce5d45] rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-[#ce5d45] rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-[#ce5d45] rounded-br-lg" />

                {/* Animated Red Laser Scanning Line */}
                <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse transition-all" />

                {/* Guidance text inside box */}
                <span className="text-[11px] font-bold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs text-center pointer-events-none">
                  Centra el código de barra aquí
                </span>
              </div>

              {/* Status or Cooldown Pill */}
              <div className="mt-4">
                {isCooldown ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold shadow-lg animate-bounce">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡Código detectado!
                  </span>
                ) : (
                  <span className="text-xs text-stone-300 bg-black/70 px-3 py-1 rounded-full border border-stone-700/80">
                    Soporta EAN-13, UPC, Code 128, QR y etiquetas comerciales
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isStarting && !scannerError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 text-stone-300 z-10">
              <RefreshCw className="w-8 h-8 text-[#ce5d45] animate-spin" />
              <p className="text-xs font-medium">Iniciando cámara trasera...</p>
            </div>
          )}

          {/* Error / Permission Blocked Message */}
          {scannerError && (
            <div className="absolute inset-0 bg-stone-950 p-6 flex flex-col items-center justify-center text-center z-20">
              <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-500/40 text-red-400 flex items-center justify-center mb-3">
                <CameraOff className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Permiso de cámara necesario
              </h4>
              <p className="text-xs text-stone-400 max-w-sm mb-4">
                {scannerError}. Asegúrate de conceder permiso de cámara a este sitio en tu navegador móvil.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="px-4 py-2 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#ce5d45] text-white text-xs font-bold hover:bg-[#b54c35] transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tomar Foto / Subir Imagen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Banner for Continuous / Recent Scan */}
        {(recentScan || lastScannedFeedback) && (
          <div
            className={`px-4 py-2.5 border-t text-xs flex items-center justify-between ${
              lastScannedFeedback?.success !== false
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200'
                : 'bg-amber-950/80 border-amber-800/80 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Barcode className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="font-mono font-bold">
                  {recentScan || lastScannedFeedback?.code}
                </span>
                {lastScannedFeedback?.productName && (
                  <span className="ml-2 font-medium truncate text-white">
                    — {lastScannedFeedback.productName}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 shrink-0">
              {lastScannedFeedback?.success !== false ? 'Escaneado' : 'No en stock'}
            </span>
          </div>
        )}

        {/* Camera Controls Toolbar */}
        <div className="p-3.5 sm:p-4 bg-[#121214] border-t border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Torch toggle if supported */}
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
                title="Encender linterna"
              >
                {torchOn ? <Zap className="w-3.5 h-3.5 fill-black" /> : <ZapOff className="w-3.5 h-3.5" />}
                <span>Linterna</span>
              </button>
            )}

            {/* Switch camera button if multiple exist */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Cambiar lente de cámara"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Cambiar Lente</span>
              </button>
            )}

            {/* Upload or take photo fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileScan}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Cargar foto o usar cámara nativa"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Foto / Galería</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors ml-auto"
          >
            Listo / Salir
          </button>
        </div>

        {/* Manual Code Input Option as Quick Fallback */}
        <div className="p-3 bg-stone-900 border-t border-stone-800 text-xs">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="¿Código dañado o borroso? Escríbelo aquí..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#ce5d45]"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white text-xs font-bold disabled:opacity-40 transition-colors"
            >
              Usar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
