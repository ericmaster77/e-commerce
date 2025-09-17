import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, Eye, EyeOff } from 'lucide-react';

// Simulamos productos iniciales (en Firebase serían dinámicos)
const initialProducts = [
  {
    id: 1,
    name: "Brazalete Dorado Elegance",
    price: 2500,
    originalPrice: 3500,
    discount: 28,
    category: "Brazaletes",
    description: "Brazalete dorado con textura única, inspirado en el legado de Rosa Oliva",
    rating: 4.8,
    stock: 15,
    featured: true,
    imageUrl: "/api/placeholder/300/300"
  },
  {
    id: 2,
    name: "Anillo Esmeralda Premium",
    price: 4200,
    originalPrice: 5600,
    discount: 25,
    category: "Anillos",
    description: "Anillo con esmeralda natural en oro de 18k",
    rating: 4.9,
    stock: 8,
    featured: true,
    imageUrl: "/api/placeholder/300/300"
  },
  {
    id: 3,
    name: "Collar Perlas Naturales",
    price: 3800,
    originalPrice: 4800,
    discount: 20,
    category: "Collares",
    description: "Collar de perlas naturales con certificado de autenticidad",
    rating: 4.7,
    stock: 12,
    featured: false,
    imageUrl: "/api/placeholder/300/300"
  }
];

// Componente ProductForm
const ProductForm = ({ product, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
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

  const categories = ['Anillos', 'Collares', 'Brazaletes', 'Aretes', 'Pulseras'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // En una implementación real, aquí subirías a Firebase Storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setImagePreview(imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.price || formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'El stock debe ser mayor o igual a 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const discount = formData.originalPrice && formData.originalPrice > 0 
        ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
        : 0;
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : 0,
        stock: parseInt(formData.stock),
        discount,
        rating: product?.rating || 4.5,
        id: product?.id || Date.now()
      };
      
      onSave(productData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
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
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Imagen
                </label>
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
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
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
                min="0"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="2500"
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
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="3500"
              />
              <p className="text-xs text-gray-500 mt-1">Para mostrar descuento (opcional)</p>
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
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
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
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe las características, materiales y detalles especiales del producto..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Producto destacado (aparecerá en la página principal)
            </label>
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente ProductList
const ProductList = ({ products, onEdit, onDelete, onToggleVisibility }) => {
  const [showHidden, setShowHidden] = useState(false);
  
  const visibleProducts = showHidden ? products : products.filter(p => p.stock > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Productos ({visibleProducts.length})
        </h3>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          {showHidden ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showHidden ? 'Ocultar sin stock' : 'Mostrar sin stock'}
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {visibleProducts.map(product => (
          <div key={product.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {/* Imagen */}
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-amber-700 text-2xl">✨</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-semibold text-green-600">${product.price.toLocaleString()}</span>
                      {product.originalPrice > 0 && (
                        <>
                          <span className="text-gray-500 line-through">${product.originalPrice.toLocaleString()}</span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            -{product.discount}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-4 text-xs">
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
                    <span className="text-gray-500">Rating: {product.rating}⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📦</div>
          <p>No hay productos para mostrar</p>
        </div>
      )}
    </div>
  );
};

// Componente principal AdminPanel
const AdminPanel = () => {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stats, setStats] = useState({});

  // Calcular estadísticas
  useEffect(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const featuredCount = products.filter(p => p.featured).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    setStats({
      totalProducts,
      totalStock,
      totalValue,
      featuredCount,
      outOfStock
    });
  }, [products]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Editar producto existente
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      // Agregar nuevo producto
      setProducts(prev => [...prev, productData]);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona tu inventario de productos de Rosa Oliva Joyería</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          <div className="text-sm text-gray-600">Total Productos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.totalStock}</div>
          <div className="text-sm text-gray-600">Stock Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">${stats.totalValue?.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Valor Inventario</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-amber-600">{stats.featuredCount}</div>
          <div className="text-sm text-gray-600">Destacados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          <div className="text-sm text-gray-600">Sin Stock</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Productos</h2>
          <button
            onClick={handleAddProduct}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>

        {/* Lista de productos */}
        <ProductList 
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCancelForm}
          isEditing={!!editingProduct}
        />
      )}
    </div>
  );
};

export default AdminPanel;