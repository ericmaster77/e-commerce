// src/components/QRGenerator.js - Generador de QR para Admin
import React, { useState, useRef } from 'react';
import { QrCode, Download, Printer, Copy, CheckCircle } from 'lucide-react';

const QRGenerator = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [qrSize, setQrSize] = useState(300);
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);

  // URL base - CAMBIAR POR TU DOMINIO REAL
  const baseUrl = window.location.origin;
  const searchUrl = `${baseUrl}/#/buscar-producto`;

  // Generar QR usando API pública de Google Charts (o puedes usar una librería)
  const generateQRUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(searchUrl)}`;
  };

  useState(() => {
    setQrUrl(generateQRUrl());
  }, []);

  const handleSizeChange = (newSize) => {
    setQrSize(newSize);
    setQrUrl(generateQRUrl());
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(searchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = generateQRUrl();
    link.download = 'rosa-oliva-qr-busqueda-productos.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Rosa Oliva - Búsqueda de Productos</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
            }
            .qr-container {
              border: 3px solid #2596be;
              padding: 20px;
              border-radius: 15px;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2596be;
              margin-bottom: 10px;
              font-size: 32px;
            }
            p {
              color: #90983d;
              font-size: 18px;
              margin: 10px 0;
            }
            .instructions {
              margin-top: 20px;
              padding: 15px;
              background: #f0f9ff;
              border-radius: 10px;
              max-width: 400px;
            }
            .instructions ol {
              text-align: left;
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Rosa Oliva Joyería</h1>
            <p><strong>Escanea para buscar productos</strong></p>
            <img src="${generateQRUrl()}" alt="QR Code" />
            <div class="instructions">
              <h3 style="color: #2596be; margin-bottom: 10px;">¿Cómo usar?</h3>
              <ol>
                <li>Escanea este código QR</li>
                <li>Busca el código en el anaquel</li>
                <li>Ingresa el código</li>
                <li>¡Descubre el producto!</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generador de QR</h1>
        <p className="text-gray-600">Genera códigos QR para que los clientes busquen productos en tienda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel Izquierdo - Configuración */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              ¿Cómo funciona?
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 ml-4">
              <li>1. El cliente escanea el QR en tu tienda</li>
              <li>2. Se abre la página de búsqueda automáticamente</li>
              <li>3. El cliente ingresa el código del anaquel (SKU)</li>
              <li>4. ¡Ve el producto con foto, precio y detalles!</li>
            </ol>
          </div>

          {/* URL del QR */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">URL del QR</h3>
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <code className="text-sm text-gray-700 flex-1 overflow-x-auto">
                {searchUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="Copiar URL"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-2">✓ URL copiada al portapapeles</p>
            )}
          </div>

          {/* Tamaño del QR */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tamaño del QR</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{qrSize} x {qrSize} px</span>
                <span className="text-xs text-gray-500">
                  {qrSize === 200 && 'Pequeño'}
                  {qrSize === 300 && 'Mediano (Recomendado)'}
                  {qrSize === 400 && 'Grande'}
                  {qrSize === 500 && 'Muy Grande'}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="500"
                step="100"
                value={qrSize}
                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>200px</span>
                <span>300px</span>
                <span>400px</span>
                <span>500px</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
            <div className="space-y-3">
              <button
                onClick={downloadQR}
                className="w-full bg-rosa-primary text-white py-3 rounded-lg hover:bg-rosa-dark transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Descargar QR</span>
              </button>
              <button
                onClick={printQR}
                className="w-full bg-rosa-secondary text-white py-3 rounded-lg hover:bg-rosa-dark transition-colors flex items-center justify-center space-x-2"
              >
                <Printer className="w-5 h-5" />
                <span>Imprimir QR</span>
              </button>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">💡 Recomendaciones</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Imprime el QR en tamaño 10x10 cm mínimo</li>
              <li>• Colócalo en un lugar visible de tu tienda</li>
              <li>• Asegúrate de que los códigos SKU estén en los anaqueles</li>
              <li>• Prueba el QR antes de mostrarlo a clientes</li>
            </ul>
          </div>
        </div>

        {/* Panel Derecho - Preview del QR */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8 sticky top-8">
            <h3 className="font-semibold text-gray-900 mb-6 text-center text-xl">
              Vista Previa del QR
            </h3>
            
            <div 
              ref={qrContainerRef}
              className="bg-gradient-to-br from-rosa-light to-white border-4 border-rosa-primary rounded-2xl p-6 text-center"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-rosa-primary mb-1">
                  Rosa Oliva Joyería
                </h2>
                <p className="text-rosa-dark font-medium">
                  Escanea para buscar productos
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl inline-block shadow-md">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="mx-auto"
                  style={{ width: qrSize, height: qrSize }}
                />
              </div>

              <div className="mt-6 bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  ¿Cómo usar?
                </p>
                <ol className="text-xs text-blue-800 text-left space-y-1 max-w-xs mx-auto">
                  <li>1️⃣ Escanea este código QR</li>
                  <li>2️⃣ Busca el código en el anaquel</li>
                  <li>3️⃣ Ingresa el código en tu teléfono</li>
                  <li>4️⃣ ¡Descubre el producto completo!</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Este QR redirige a:
              </p>
              <p className="text-xs text-gray-500 font-mono break-all mt-1">
                {searchUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;