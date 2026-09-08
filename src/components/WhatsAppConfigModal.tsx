import React, { useState } from 'react';
import { X, Phone, Check, AlertCircle } from 'lucide-react';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNumber: string;
  onSaveNumber: (newNumber: string) => void;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  currentNumber,
  onSaveNumber,
}) => {
  const [inputVal, setInputVal] = useState(currentNumber);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputVal.replace(/[^0-9+]/g, '');
    onSaveNumber(cleaned || '584120000000');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="whatsapp-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="whatsapp-modal-panel"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="display-font text-xl font-bold text-[#20201e]">
              Número de WhatsApp
            </h3>
            <p className="text-xs text-stone-500">
              Configura el número al que llegarán los pedidos
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Número con código de país:
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ej: 584121234567 o +584121234567"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold text-[#20201e] focus:outline-none focus:border-[#20201e] focus:ring-1 focus:ring-[#20201e]"
              required
            />
            <p className="mt-1.5 text-[11px] text-stone-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#d89c35]" />
              <span>Incluye código de país sin espacios ni guiones (ej. Venezuela 58, Colombia 57, EE.UU. 1).</span>
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saved}
              className="flex-1 py-3 rounded-xl bg-[#20201e] text-white hover:bg-[#ce5d45] text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Número</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
