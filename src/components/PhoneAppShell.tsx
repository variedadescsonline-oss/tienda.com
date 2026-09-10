import React, { useState, useEffect } from 'react';
import { Smartphone, Maximize2, Minimize2, Wifi, BatteryCharging } from 'lucide-react';

interface PhoneAppShellProps {
  children: React.ReactNode;
}

export const PhoneAppShell: React.FC<PhoneAppShellProps> = ({ children }) => {
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#141413] text-[#20201e] flex flex-col items-center justify-center relative overflow-x-hidden selection:bg-[#ce5d45] selection:text-white">
      {/* Subtle ambient lighting for desktop background */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ce5d45]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[#d89c35]/8 rounded-full blur-[120px]" />
      </div>

      {/* Top Desktop Indicator Bar (only visible on wide screens) */}
      <aside aria-label="Controles de vista previa" className="hidden sm:flex items-center justify-between w-full max-w-[440px] px-4 py-2.5 z-30 text-stone-400 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[11px] text-stone-300">
            VariedadesCS • Versión Móvil
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsFullWidth(!isFullWidth)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition-all border border-stone-700/60 shadow-xs"
          title={isFullWidth ? 'Cambiar a chasis de teléfono' : 'Expandir pantalla completa'}
        >
          {isFullWidth ? (
            <>
              <Minimize2 className="w-3 h-3" />
              <span>Modo Teléfono</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3 h-3" />
              <span>Simulador</span>
            </>
          )}
        </button>
      </aside>

      {/* Phone Device Chassis (or full-width when on actual mobile or toggled) */}
      <main
        className={`w-full transition-all duration-300 relative flex flex-col ${
          isFullWidth
            ? 'max-w-none min-h-screen bg-[#faf8f5]'
            : 'sm:max-w-[420px] sm:h-[90vh] sm:max-h-[890px] sm:min-h-[720px] sm:rounded-[48px] sm:border-[10px] sm:border-[#1c1c1a] sm:shadow-[0_25px_70px_rgba(0,0,0,0.7)] sm:ring-1 sm:ring-white/15 bg-[#faf8f5] sm:overflow-hidden'
        }`}
      >
        {/* Realistic Mobile Status Bar (Visible on the desktop phone mockup) */}
        {!isFullWidth && (
          <header className="hidden sm:flex items-center justify-between px-6 pt-3 pb-2 select-none shrink-0 z-30 text-[#20201e] bg-white/90 backdrop-blur-md border-b border-stone-100">
            {/* Clock */}
            <span className="text-xs font-bold font-mono tracking-tight text-stone-800">
              {currentTime}
            </span>

            {/* Dynamic Island / Speaker Pill */}
            <div className="h-4 w-24 bg-[#141413] rounded-full flex items-center justify-center gap-1.5 px-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#1e1e1c]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
            </div>

            {/* Icons: WiFi, Signal, Battery */}
            <div className="flex items-center gap-1.5 text-stone-700 text-xs">
              <span className="text-[10px] font-black tracking-tighter">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <BatteryCharging className="w-4 h-4 text-emerald-600" />
            </div>
          </header>
        )}

        {/* Scrollable Mobile Content Canvas */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col scroll-smooth">
          {children}
        </div>

        {/* Realistic Mobile Home Indicator Bar (Desktop Chassis only) */}
        {!isFullWidth && (
          <footer className="hidden sm:flex items-center justify-center py-1.5 bg-white shrink-0 z-40 border-t border-stone-100">
            <div className="w-28 h-1 bg-stone-300 rounded-full" />
          </footer>
        )}
      </main>

      {/* Bottom Footer Note for Desktop Viewers */}
      <p className="hidden sm:block text-[11px] text-stone-500 mt-2 mb-3">
        Optimizado exclusivamente para teléfonos inteligentes • Escanea códigos con la cámara
      </p>
    </div>
  );
};
