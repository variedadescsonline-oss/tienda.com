import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, Copy, Check } from 'lucide-react';
import { formatUSD, formatNIO, usdToNio } from '../utils/currency';

interface BarcodeRendererProps {
  value: string;
  productName?: string;
  priceUSD?: number;
  exchangeRate?: number;
  showPrintButton?: boolean;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  productName,
  priceUSD,
  exchangeRate = 36.8,
  showPrintButton = true,
  width = 1.6,
  height = 42,
  displayValue = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          lineColor: '#1a1a1a',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 11,
          font: 'monospace',
          textMargin: 3,
          margin: 6,
          background: '#ffffff',
        });
      } catch (err) {
        console.warn('Error generating barcode:', err);
      }
    }
  }, [value, width, height, displayValue]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=500');
    if (!printWindow) return;

    const nioPrice = priceUSD ? usdToNio(priceUSD, exchangeRate) : 0;
    const svgHtml = svgRef.current ? svgRef.current.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta de Código de Barra - VariedadesCS</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .label-card {
              background: #ffffff;
              border: 1px dashed #333;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              width: 260px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .store-name {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #20201e;
              margin-bottom: 4px;
            }
            .product-name {
              font-size: 12px;
              font-weight: 600;
              color: #444;
              margin-bottom: 8px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .prices {
              margin-top: 6px;
              font-size: 14px;
              font-weight: 800;
              color: #111;
            }
            .prices span {
              color: #ce5d45;
              font-size: 12px;
              font-weight: 600;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="store-name">VariedadesCS</div>
            ${productName ? `<div class="product-name">${productName}</div>` : ''}
            <div>${svgHtml}</div>
            ${
              priceUSD !== undefined
                ? `<div class="prices">
                    ${formatUSD(priceUSD)} <span>/ ${formatNIO(nioPrice)}</span>
                   </div>`
                : ''
            }
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-stone-200">
      <svg ref={svgRef} className="max-w-full overflow-hidden" />

      {(showPrintButton || productName) && (
        <div className="w-full mt-2 pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-[11px] font-medium py-1 px-2 rounded-lg hover:bg-stone-50"
            title="Copiar código"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {showPrintButton && (
            <button
              type="button"
              onClick={handlePrintLabel}
              className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-colors"
              title="Imprimir etiqueta"
            >
              <Printer className="w-3 h-3" />
              <span>Imprimir</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
