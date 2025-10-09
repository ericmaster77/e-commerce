import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

// Hook principal para productos
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await productService.getProducts();
      
      if (result.success) {
        setProducts(result.products);
        setError(null);
      } else {
        setError(result.error);
        // Fallback a datos locales si Firebase falla
        setProducts([]);
      }
      
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const addProduct = async (product) => {
    const result = await productService.addProduct(product);
    if (result.success) {
      setProducts(prev => [...prev, { id: result.id, ...product }]);
    }
    return result;
  };

  const updateProduct = async (id, updates) => {
    const result = await productService.updateProduct(id, updates);
    if (result.success) {
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? { ...product, ...updates } : product
        )
      );
    }
    return result;
  };

  const deleteProduct = async (id) => {
    const result = await productService.deleteProduct(id);
    if (result.success) {
      setProducts(prev => prev.filter(product => product.id !== id));
    }
    return result;
  };

  return { 
    products, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    refreshProducts: () => {
      setLoading(true);
      productService.getProducts().then(result => {
        if (result.success) {
          setProducts(result.products);
          setError(null);
        }
        setLoading(false);
      });
    }
  };
};

// Hook para productos destacados
export const useFeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true);
      const result = await productService.getFeaturedProducts();
      
      if (result.success) {
        setFeaturedProducts(result.products);
        setError(null);
      } else {
        setError(result.error);
        setFeaturedProducts([]);
      }
      
      setLoading(false);
    };

    fetchFeaturedProducts();
  }, []);

  return { featuredProducts, loading, error };
};

// Hook para productos por categoría
export const useProductsByCategory = (category) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category || category === 'Todos') {
      // Si es 'Todos', usar el hook principal
      return;
    }

    const fetchProductsByCategory = async () => {
      setLoading(true);
      const result = await productService.getProductsByCategory(category);
      
      if (result.success) {
        setProducts(result.products);
        setError(null);
      } else {
        setError(result.error);
        setProducts([]);
      }
      
      setLoading(false);
    };

    fetchProductsByCategory();
  }, [category]);

  return { products, loading, error };
};

// Hook para administración con tiempo real
// Hook para administración con tiempo real - CORREGIDO
// Hook para administración con tiempo real - VERSIÓN COMPLETA CORREGIDA
// Hook para administración - VERSIÓN CON RECARGA FORZADA
// Reemplaza el hook useAdminProducts en src/hooks/useFirestore.js

export const useAdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forceReload, setForceReload] = useState(0);

  // Función para calcular estadísticas
  const calculateStats = (products) => {
    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
      featuredCount: products.filter(p => p.featured).length,
      outOfStock: products.filter(p => (p.stock || 0) === 0).length,
      byCategory: products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {})
    };
  };

  useEffect(() => {
    let unsubscribe;

    const setupRealtimeListener = () => {
      console.log('🔄 Configurando listener en tiempo real para productos...');
      
      try {
        unsubscribe = productService.onProductsChange((fetchedProducts) => {
          console.log(`📦 Listener actualizado: ${fetchedProducts.length} productos`);
          console.log('📋 IDs de productos:', fetchedProducts.map(p => p.id));
          
          setProducts(fetchedProducts);
          setStats(calculateStats(fetchedProducts));
          setLoading(false);
          setError(null);
        });
      } catch (err) {
        console.error('❌ Error configurando listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        console.log('🔌 Desconectando listener de productos');
        unsubscribe();
      }
    };
  }, [forceReload]);

  const addProduct = async (productData, imageFile) => {
    console.log('➕ Agregando nuevo producto...');
    const result = await productService.createProductAdmin(productData, imageFile);
    
    if (result.success) {
      console.log(`✅ Producto creado con ID: ${result.id}`);
      // Forzar recarga del listener
      setTimeout(() => {
        console.log('🔄 Forzando recarga de productos...');
        setForceReload(prev => prev + 1);
      }, 1000);
    }
    
    return result;
  };

  const updateProduct = async (id, updates, imageFile, oldImageUrl) => {
    console.log(`✏️ Actualizando producto ${id}...`);
    const result = await productService.updateProductAdmin(id, updates, imageFile, oldImageUrl);
    
    if (result.success) {
      console.log(`✅ Producto ${id} actualizado`);
      // Forzar recarga
      setTimeout(() => {
        setForceReload(prev => prev + 1);
      }, 1000);
    }
    
    return result;
  };

  const deleteProduct = async (id, imageUrl) => {
    console.log(`🗑️ Hook: Iniciando eliminación de producto ${id}`);
    const result = await productService.deleteProductAdmin(id, imageUrl);
    
    if (result.success) {
      console.log(`✅ Hook: Producto ${id} eliminado de Firestore`);
      // Actualización inmediata en UI
      setProducts(prevProducts => {
        const filtered = prevProducts.filter(p => p.id !== id);
        console.log(`📦 Hook: Productos después de filtrar: ${filtered.length}`);
        setStats(calculateStats(filtered));
        return filtered;
      });
      
      // Forzar recarga del listener
      setTimeout(() => {
        setForceReload(prev => prev + 1);
      }, 1000);
    } else {
      console.error(`❌ Hook: Error eliminando producto ${id}:`, result.error);
    }
    
    return result;
  };

  return {
    products,
    stats,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    forceReload: () => setForceReload(prev => prev + 1)
  };
};
// Hook para inicialización de datos (usar solo una vez)
export const useDataInitialization = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const initializeData = async () => {
    setInitializing(true);
    
    try {
      const result = await productService.seedInitialProducts();
      if (result.success) {
        setInitialized(true);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setInitializing(false);
    }
  };

  return {
    initializeData,
    initializing,
    initialized
  };
};