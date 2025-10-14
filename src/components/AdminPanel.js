// src/components/AdminPanel.js - ACTUALIZADO CON CAMPO SKU
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, Eye, EyeOff, RefreshCw, AlertCircle, FileSpreadsheet, QrCode } from 'lucide-react';
import { useAdminProducts } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import BulkImport from './BulkImport';

// Componente ProductForm - CON CAMPO SKU
const ProductForm = ({ product, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '', // ✅ AGREGADO
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    category: product?.category || 'Anillos',
    description: product?.description || '',
    stock: product?.stock || '',
    featured: product?.featured || false,
    imageUrl: product?.imageUrl || ''
  });

  const [imagePreview, setImagePreview] = useState(product?.imageUrl || '');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const categories = ['Anillos', 'Collares', 'Brazaletes', 'Aretes', 'Pulseras'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen debe ser menor a 5MB' }));
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'Solo se permiten imágenes JPG, PNG o WebP' }));
        return;
      }

      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (formData.name.length > 100) newErrors.name = 'El nombre debe tener menos de 100 caracteres';
    
    // ✅ VALIDACIÓN DE SKU
    if (!formData.sku.trim()) {
      newErrors.sku = 'El código SKU es requerido';
    } else if (formData.sku.length > 20) {
      newErrors.sku = 'El SKU debe tener menos de 20 caracteres';
    }
    
    if (!formData.price || formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (formData.price > 1000000) newErrors.price = 'El precio debe ser menor a $1,000,000';
    
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (formData.description.length > 500) newErrors.description = 'La descripción debe tener menos de 500 caracteres';
    
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'El stock debe ser mayor o igual a 0';
    if (formData.stock > 10000) newErrors.stock = 'El stock debe ser menor a 10,000';

    if (formData.originalPrice && formData.originalPrice < formData.price) {
      newErrors.originalPrice = 'El precio original debe ser mayor al precio de venta';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const discount = formData.originalPrice && formData.originalPrice > 0 
        ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
        : 0;
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : 0,
        stock: parseInt(formData.stock),
        discount,
        rating: product?.rating || 4.5
      };
      
      await onSave(productData, selectedImageFile);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setErrors({ submit: 'Error al guardar el producto. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button 
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Producto</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-xs text-center">Sin imagen</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Imagen
                </label>
                <p className="text-xs text-gray-500 mt-1">Máximo 5MB. JPG, PNG o WebP.</p>
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Anillo de Oro 18k"
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* ✅ CAMPO SKU AGREGADO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código SKU / Anaquel *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-mono ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: BR-001, A-123"
                disabled={isSubmitting}
                maxLength={20}
              />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
              <p className="text-xs text-gray-500 mt-1">
                📍 Este código aparecerá en el anaquel físico
              </p>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              disabled={isSubmitting}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta * (MXN)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                max="1000000"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="2500"
                disabled={isSubmitting}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Original (MXN)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                min="0"
                max="1000000"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="3500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Para mostrar descuento (opcional)</p>
              {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Disponible *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                max="10000"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
                disabled={isSubmitting}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe las características, materiales y detalles especiales del producto..."
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              <p className="text-xs text-gray-500 ml-auto">{formData.description.length}/500</p>
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              disabled={isSubmitting}
            />
            <label className="ml-2 text-sm text-gray-700">
              Producto destacado (aparecerá en la página principal)
            </label>
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente ProductList - SIN CAMBIOS (ya tiene SKU)
const ProductList = ({ products, onEdit, onDelete, loading }) => {
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  
  let filteredProducts = products;
  
  if (!showHidden) {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }
  
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedCategory !== 'Todos') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  const ProductImage = ({ product }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageLoad = () => {
      setImageLoading(false);
      setImageError(false);
    };

    const handleImageError = () => {
      setImageLoading(false);
      setImageError(true);
    };

    const shouldShowRealImage = product.hasRealImage && 
      product.imageUrl && 
      !product.imageUrl.includes('placeholder') && 
      !imageError;

    return (
      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden border-2 border-gray-200">
        {shouldShowRealImage ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="text-amber-700 text-lg">📸</div>
                </div>
              </div>
            )}
            <img 
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!imageError && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-amber-700 text-2xl">✨</div>
              <div className="text-xs text-amber-600">Rosa</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos por nombre, descripción o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div className="flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
          >
            {showHidden ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showHidden ? 'Ocultar sin stock' : 'Mostrar sin stock'}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos ({filteredProducts.length})
          </h3>
          {loading && (
            <div className="flex items-center text-sm text-amber-600">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              Cargando...
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <ProductImage product={product} />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <span>{product.category}</span>
                      {product.sku && (
                        <>
                          <span>•</span>
                          <span className="font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                            SKU: {product.sku}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-green-600">
                          ${(product.pricing?.public || product.price || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">Público</span>
                      </div>
                      
                      {product.pricing?.member && (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-blue-600">
                            ${product.pricing.member.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">Socios</span>
                        </div>
                      )}
                      
                      {product.pricing?.wholesale && (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-purple-600">
                            ${product.pricing.wholesale.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">Mayoreo</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar producto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
                          const imageUrlString = typeof product.imageUrl === 'string' 
                            ? product.imageUrl 
                            : '';
                          onDelete(product.id, imageUrlString);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Stock: {product.stock}
                    </span>
                    
                    {product.featured && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Destacado
                      </span>
                    )}
                    
                    {product.hasRealImage && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center">
                        <span className="mr-1">📸</span>
                        Con imagen
                      </span>
                    )}
                    
                    <span className="text-gray-500">Rating: {product.rating}⭐</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-x-2">
                    {product.excel?.lote && (
                      <span>Lote: {product.excel.lote}</span>
                    )}
                    {product.createdAt && (
                      <span>Creado: {new Date(product.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📦</div>
          <p>No hay productos que coincidan con los filtros</p>
          {searchTerm && (
            <p className="text-sm mt-2">
              Búsqueda: "{searchTerm}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal AdminPanel - AGREGADO BOTÓN QR
const AdminPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { products, stats, loading, error, addProduct, updateProduct, deleteProduct } = useAdminProducts();
  const { user, isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = async (productData, imageFile) => {
    try {
      let result;
      if (editingProduct) {
        const oldImageUrl = typeof editingProduct.imageUrl === 'string' 
          ? editingProduct.imageUrl 
          : '';
          
        result = await updateProduct(
          editingProduct.id, 
          productData, 
          imageFile, 
          oldImageUrl
        );
        if (result.success) {
          showNotification('Producto actualizado exitosamente');
        }
      } else {
        result = await addProduct(productData, imageFile);
        if (result.success) {
          showNotification('Producto creado exitosamente');
        }
      }

      if (result.success) {
        setShowForm(false);
        setEditingProduct(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId, imageUrl) => {
    try {
      const imageUrlString = typeof imageUrl === 'string' ? imageUrl : '';
      
      const result = await deleteProduct(productId, imageUrlString);
      if (result.success) {
        showNotification('Producto eliminado exitosamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleBulkImportComplete = (results) => {
    showNotification(
      `Importación completada: ${results.successful} productos agregados, ${results.failed} errores`,
      results.failed > 0 ? 'warning' : 'success'
    );
    setShowBulkImport(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-400' : 
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-400' :
          'bg-red-100 text-red-800 border border-red-400'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {notification.message}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
            <p className="text-gray-600">Gestiona tu inventario de productos de Rosa Oliva Joyería</p>
          </div>
          <div className="text-sm text-gray-500">
            Conectado como: {user?.displayName || user?.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</div>
          <div className="text-sm text-gray-600">Total Productos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.totalStock || 0}</div>
          <div className="text-sm text-gray-600">Stock Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">${(stats.totalValue || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Valor Inventario</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-amber-600">{stats.featuredCount || 0}</div>
          <div className="text-sm text-gray-600">Destacados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock || 0}</div>
          <div className="text-sm text-gray-600">Sin Stock</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Productos</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              title="Importación masiva desde Excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Importar Excel
            </button>
            <button
              onClick={handleAddProduct}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>

        <ProductList 
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          loading={loading}
        />
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCancelForm}
          isEditing={!!editingProduct}
        />
      )}

      {showBulkImport && (
        <BulkImport
          onClose={() => setShowBulkImport(false)}
          onImportComplete={handleBulkImportComplete}
        />
      )}
    </div>
  );
};

export default AdminPanel;