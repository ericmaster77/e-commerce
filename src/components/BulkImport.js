// src/components/BulkImport.js
import React, { useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, X, Eye, Download, RefreshCw } from 'lucide-react';
import { bulkImportService } from '../services/bulkImportService';

const BulkImport = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [options, setOptions] = useState({
    markAsFeatured: false,
    imageBaseUrl: 'gs://rosa-oliva-ecommerce.firebasestorage.app', // URL base para imágenes
    defaultToPlaceholder: true // Usar placeholder si no hay imagen
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    
    // Generar preview
    try {
      const previewResult = await bulkImportService.previewImport(selectedFile, 5);
      if (previewResult.success) {
        setPreview(previewResult);
      } else {
        alert(`Error al leer archivo: ${previewResult.error}`);
      }
    } catch (error) {
      console.error('Error en preview:', error);
      alert('Error al procesar el archivo');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    if (!window.confirm(`¿Estás seguro de importar ${preview?.totalRows || 0} productos? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
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
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importación Masiva de Productos</h2>
            <p className="text-gray-600">Sube tu archivo Excel con el inventario</p>
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
            <p className="text-gray-600 mb-4">Arrastra y suelta tu archivo .xlsx aquí, o</p>
            <label className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer">
              <File className="w-5 h-5 mr-2" />
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">Formatos soportados: .xlsx, .xls (máximo 50MB)</p>
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
                  <p className="text-sm text-blue-700">
                    {preview.totalRows} filas encontradas, {preview.validProducts} productos válidos
                  </p>
                )}
              </div>
              <button
                onClick={resetImport}
                className="text-blue-600 hover:text-blue-800"
                disabled={isImporting}
              >
                Cambiar archivo
              </button>
            </div>
          </div>
        )}

        {/* Configuración de importación */}
        {file && !importResults && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Configuración de Importación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Base para Imágenes
                </label>
                <input
                  type="url"
                  value={options.imageBaseUrl}
                  onChange={(e) => setOptions({...options, imageBaseUrl: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  disabled={isImporting}
                  placeholder="https://storage.googleapis.com/rosa-oliva-images/"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL base donde están hospedadas las imágenes de productos
                </p>
              </div>
              
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
                    Usar imagen placeholder si no hay imagen
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista previa de productos */}
        {preview && preview.preview && preview.preview.length > 0 && !importResults && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Vista Previa (primeros 5 productos)
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {preview.preview.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category} • {product.material}</p>
                      <p className="text-sm text-gray-500 mt-1">{product.description.substring(0, 100)}...</p>
                      {product.hasRealImage && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                          📸 Con imagen
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-green-600">
                          Público: ${product.pricing.public.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600">
                          Miembros: ${product.pricing.member.toLocaleString()}
                          {product.memberDiscount > 0 && (
                            <span className="text-xs ml-1 bg-blue-100 text-blue-800 px-1 rounded">
                              -{product.memberDiscount}%
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-purple-600">
                          Mayoreo: ${product.pricing.wholesale.toLocaleString()}
                          {product.wholesaleDiscount > 0 && (
                            <span className="text-xs ml-1 bg-purple-100 text-purple-800 px-1 rounded">
                              -{product.wholesaleDiscount}%
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Stock: {product.stock}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
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
                    {importResults.success ? '¡Importación Completada!' : 'Error en la Importación'}
                  </h3>
                  
                  {importResults.success && importResults.results && (
                    <div className="mt-2">
                      <p className="text-green-800">
                        ✅ {importResults.results.successful} productos importados exitosamente
                      </p>
                      {importResults.results.failed > 0 && (
                        <p className="text-orange-800">
                          ⚠️ {importResults.results.failed} productos con errores
                        </p>
                      )}
                      <p className="text-green-700 text-sm">
                        Total procesado: {importResults.results.total} productos
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
            
            {file && !importResults && (
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
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso durante importación */}
        {isImporting && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-amber-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Procesando productos... Esto puede tomar varios minutos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport;