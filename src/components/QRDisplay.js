// src/components/QRDisplay.js - Componente para mostrar QR en la página

import React, { useState } from 'react';
import { Download, X, Copy, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const QRDisplay = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { classes, isMinimal } = useTheme();
  
  // URL del QR (usando API pública)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(url)}`;
  const qrUrlHD = `https://api.qrserver.com/v1/create-qr-code/?size=2000x2000&data=${encodeURIComponent(url)}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (size) => {
    const link = document.createElement('a');
    link.href = size === 'hd' ? qrUrlHD : qrUrl;
    link.download = `rosaolivajoyeria-qr${size === 'hd' ? '-hd' : ''}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md ${classes.cartBg} shadow-xl overflow-y-auto`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${classes.cartHeader}`}>
            <h2 className={`${classes.sectionTitle} text-lg font-semibold`}>
              Código QR del Sitio
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {/* QR Code */}
            <div className={`p-6 rounded-xl ${
              isMinimal 
                ? 'bg-white border-4 border-black' 
                : 'bg-white border-4 border-rosa-primary'
            } mb-6 text-center`}>
              <img 
                src={qrUrl}
                alt="QR Code"
                className="w-full max-w-xs mx-auto"
              />
            </div>

            {/* URL */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${classes.sectionTitle} mb-2`}>
                URL del sitio:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={url}
                  readOnly
                  className={`flex-1 p-3 border rounded-lg ${classes.filterInput} bg-gray-50`}
                />
                <button
                  onClick={handleCopyUrl}
                  className={`p-3 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : isMinimal 
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-rosa-primary text-white hover:bg-rosa-dark'
                  }`}
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleDownload('normal')}
                className={`${classes.buttonPrimary} w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2`}
              >
                <Download className="w-5 h-5" />
                Descargar QR (800x800)
              </button>
              
              <button
                onClick={() => handleDownload('hd')}
                className={`${classes.buttonSecondary} w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2`}
              >
                <Download className="w-5 h-5" />
                Descargar QR HD (2000x2000)
              </button>
            </div>

            {/* Instructions */}
            <div className={`mt-6 p-4 rounded-lg ${
              isMinimal ? 'bg-gray-100' : 'bg-rosa-light'
            }`}>
              <h3 className={`${classes.sectionTitle} font-semibold mb-2 text-sm`}>
                💡 Instrucciones:
              </h3>
              <ul className={`${classes.missionText} text-sm space-y-1`}>
                <li>• Descarga el QR en la resolución que necesites</li>
                <li>• Imprímelo en material publicitario</li>
                <li>• Comparte en redes sociales</li>
                <li>• Úsalo en tu tienda física</li>
              </ul>
            </div>

            {/* Info adicional */}
            <div className={`mt-4 p-4 rounded-lg ${
              isMinimal ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`${classes.missionText} text-xs`}>
                <strong>Nota:</strong> Este QR code dirige a tu sitio web principal. 
                Los clientes pueden escanearlo para acceder directamente desde sus dispositivos móviles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;