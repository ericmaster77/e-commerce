import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

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

  return { products, loading, error, addProduct };
};