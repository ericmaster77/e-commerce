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
export const useAdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const setupRealtimeListener = () => {
      // Configurar listener en tiempo real
      unsubscribe = productService.onProductsChange((products) => {
        setProducts(products);
        
        // Calcular estadísticas
        const newStats = {
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
        
        setStats(newStats);
        setLoading(false);
        setError(null);
      });
    };

    // Función de fallback si el tiempo real falla
    const fetchProductsOnce = async () => {
      const result = await productService.getProductStats();
      if (result.success) {
        setProducts(result.products);
        setStats(result.stats);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };

    try {
      setupRealtimeListener();
    } catch (error) {
      console.warn('Tiempo real no disponible, usando fetch único:', error);
      fetchProductsOnce();
    }

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const addProduct = async (productData, imageFile) => {
    const result = await productService.createProductAdmin(productData, imageFile);
    // No necesitamos actualizar el estado manualmente porque el listener en tiempo real lo hará
    return result;
  };

  const updateProduct = async (id, updates, imageFile, oldImageUrl) => {
    const result = await productService.updateProductAdmin(id, updates, imageFile, oldImageUrl);
    // El listener actualizará automáticamente
    return result;
  };

  const deleteProduct = async (id, imageUrl) => {
    const result = await productService.deleteProductAdmin(id, imageUrl);
    // El listener actualizará automáticamente
    return result;
  };

  return {
    products,
    stats,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct
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