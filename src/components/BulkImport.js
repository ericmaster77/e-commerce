// src/components/BulkImport.js - ACTUALIZADO CON VISTA PREVIA DE IMÁGENES
import React, { useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, X, Eye, Download, RefreshCw, Image } from 'lucide-react';
import { bulkImportService } from '../services/bulkImportService';

const BulkImport = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [options, setOptions] = useState({
    markAsFeatured: false,
    imageBaseUrl: 'gs://rosa-oliva-ecommerce.firebasestorage.app',
    defaultToPlaceholder: true
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setIsGeneratingPreview(true);
    
    // Generar preview CON imágenes
    try {
      console.log('📊 Generando vista previa con imágenes...');
      const previewResult = await bulkImportService.previewImport(selectedFile, 5);
      
      if (previewResult.success) {
        setPreview(previewResult);
        console.log(`✅ Vista previa generada: ${previewResult.validProducts} productos válidos`);
      } else {
        alert(`Error al leer archivo: ${previewResult.error}`);
      }
    } catch (error) {
      console.error('Error en preview:', error);
      alert('Error al procesar el archivo');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const hasImagesCount = preview?.preview?.filter(p => p.hasRealImage || p.imagePreview).length || 0;
    const confirmMessage = `¿Estás seguro de importar ${preview?.totalRows || 0} productos?\n\n` +
      `📸 ${hasImagesCount} productos tienen imágenes\n` +
      `⚠️ Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      console.log('🚀 Iniciando importación masiva con imágenes...');
      const result = await bulkImportService.importProductsFromExcel(file, options);
      setImportResults(result);
      
      if (result.success) {
        onImportComplete && onImportComplete(result.results);
      }
    } catch (error) {
      console.error('Error en importación:', error);
      setImportResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setImportResults(null);
    setIsGeneratingPreview(false);
    
    // Limpiar URLs de objetos creadas para vista previa
    if (preview?.preview) {
      preview.preview.forEach(product => {
        if (product.imagePreview) {
          URL.revokeObjectURL(product.imagePreview);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importación Masiva de Productos</h2>
            <p className="text-gray-600">Sube tu archivo Excel con el inventario e imágenes embebidas</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isImporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de selección de archivo */}
        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona tu archivo Excel</h3>
            <p className="text-gray-600 mb-4">Arrastra y suelta tu archivo .xlsx con imágenes embebidas</p>
            <label className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer">
              <File className="w-5 h-5 mr-2" />
              Seleccionar Archivo Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">Formatos soportados: .xlsx, .xls (máximo 50MB)</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Asegúrate de que las imágenes estén embebidas en las celdas del Excel, no solo como vínculos.
              </p>
            </div>
          </div>
        )}

        {/* Información del archivo seleccionado */}
        {file && !importResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <File className="w-8 h-8 text-blue-600 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">{file.name}</h3>
                <p className="text-sm text-blue-700">
                  Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {preview && (
                  <div className="text-sm text-blue-700 mt-1">
                    📊 {preview.totalRows} productos • ✅ {preview.validProducts} válidos • 
                    📸 {preview.preview?.filter(p => p.hasRealImage || p.imagePreview).length || 0} con imagen
                  </div>
                )}
                {isGeneratingPreview && (
                  <div className="flex items-center text-sm text-blue-600 mt-2">
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Extrayendo imágenes y generando vista previa...
                  </div>
                )}
              </div>
              <button
                onClick={resetImport}
                className="text-blue-600 hover:text-blue-800"
                disabled={isImporting || isGeneratingPreview}
              >
                Cambiar archivo
              </button>
            </div>
          </div>
        )}

        {/* Configuración de importación */}
        {file && !importResults && !isGeneratingPreview && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Configuración de Importación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="markAsFeatured"
                  checked={options.markAsFeatured}
                  onChange={(e) => setOptions({...options, markAsFeatured: e.target.checked})}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded"
                  disabled={isImporting}
                />
                <label htmlFor="markAsFeatured" className="ml-2 text-sm text-gray-700">
                  Marcar primeros 10 productos como destacados
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="defaultToPlaceholder"
                  checked={options.defaultToPlaceholder}
                  onChange={(e) => setOptions({...options, defaultToPlaceholder: e.target.checked})}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded"
                  disabled={isImporting}
                />
                <label htmlFor="defaultToPlaceholder" className="ml-2 text-sm text-gray-700">
                  Usar placeholder si no hay imagen
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Vista previa de productos CON IMÁGENES */}
        {preview && preview.preview && preview.preview.length > 0 && !importResults && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Vista Previa con Imágenes (primeros 5 productos)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {preview.preview.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start space-x-4">
                    {/* Vista previa de imagen */}
                    <div className="w-20 h-20 flex-shrink-0">
                      {product.imagePreview ? (
                        <div className="relative">
                          <img 
                            src={product.imagePreview} 
                            alt={`Preview ${product.name}`}
                            className="w-full h-full object-cover rounded-lg border-2 border-green-200"
                          />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Image className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <span className="text-amber-700 text-2xl">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {product.category} • {product.material} • SKU: {product.sku}
                      </p>
                      
                      {/* Precios */}
                      <div className="text-xs space-y-1 mb-2">
                        <div className="flex justify-between">
                          <span className="text-red-600 font-medium">Anaquel (Original):</span>
                          <span className="font-bold">${product.originalPrice?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">Miembros (Default):</span>
                          <span className="font-bold">${product.price?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Mayoreo:</span>
                          <span className="font-bold">${product.wholesalePrice?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Indicadores */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Stock: {product.stock}
                        </span>
                        {product.discount > 0 && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            -{product.discount}%
                          </span>
                        )}
                        {product.imagePreview && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                            <Image className="w-3 h-3 mr-1" />
                            Con imagen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados de importación */}
        {importResults && (
          <div className="mb-6">
            <div className={`border rounded-lg p-4 ${
              importResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                {importResults.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 mr-3 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    importResults.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResults.success ? '🎉 ¡Importación Completada!' : '❌ Error en la Importación'}
                  </h3>
                  
                  {importResults.success && importResults.results && (
                    <div className="mt-2 space-y-1">
                      <p className="text-green-800">
                        ✅ <strong>{importResults.results.successful}</strong> productos importados exitosamente
                      </p>
                      <p className="text-green-700">
                        📸 <strong>{importResults.results.imagesUploaded}</strong> de <strong>{importResults.results.imagesProcessed}</strong> imágenes subidas
                      </p>
                      {importResults.results.failed > 0 && (
                        <p className="text-orange-800">
                          ⚠️ <strong>{importResults.results.failed}</strong> productos con errores
                        </p>
                      )}
                      <p className="text-green-600 text-sm">
                        📊 Total procesado: <strong>{importResults.results.total}</strong> productos
                      </p>
                    </div>
                  )}
                  
                  {!importResults.success && (
                    <p className="text-red-800 mt-2">{importResults.error}</p>
                  )}
                  
                  {/* Lista de errores */}
                  {importResults.results?.errors && importResults.results.errors.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-orange-800 font-medium">
                          Ver detalles de errores ({importResults.results.errors.length})
                        </summary>
                        <div className="mt-2 bg-white border rounded p-2 max-h-32 overflow-y-auto">
                          {importResults.results.errors.map((error, index) => (
                            <div key={index} className="text-red-700 text-xs mb-1">
                              {error}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between">
          <div>
            {importResults && importResults.success && (
              <button
                onClick={resetImport}
                className="flex items-center px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Importar Otro Archivo
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
              disabled={isImporting}
            >
              {importResults ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {file && !importResults && !isGeneratingPreview && (
              <button
                onClick={handleImport}
                disabled={isImporting || !preview}
                className="flex items-center px-6 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {preview?.totalRows || 0} Productos
                    {preview && preview.preview?.filter(p => p.imagePreview).length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-amber-700 rounded text-xs">
                        📸 Con Imágenes
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso durante importación */}
        {isImporting && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-amber-600 h-3 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Procesando productos e imágenes...</span>
              <span>Esto puede tomar varios minutos</span>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
              💡 Las imágenes se están extrayendo del Excel y subiendo a Firebase Storage
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport;