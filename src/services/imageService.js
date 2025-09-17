// src/services/imageService.js - Para subida de imágenes
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const imageService = {
  // Subir imagen de producto
  async uploadProductImage(file, productId) {
    try {
      const imageRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Eliminar imagen
  async deleteProductImage(imageUrl) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// src/services/adminService.js - Para funciones administrativas
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const adminService = {
  // Verificar si usuario es admin
  async isUserAdmin(userId) {
    try {
      // En una implementación real, verificarías en Firestore o Firebase Auth custom claims
      const adminEmails = ['admin@rosaolivajoyeria.com', 'gerencia@rosaolivajoyeria.com'];
      // Por ahora simulamos con emails específicos
      return { success: true, isAdmin: adminEmails.includes(userId) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar estadísticas de admin
  async updateAdminStats(stats) {
    try {
      const statsRef = doc(db, 'admin', 'statistics');
      await updateDoc(statsRef, {
        ...stats,
        lastUpdated: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Actualizar productService.js con funciones de administración
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const productService = {
  // ... funciones existentes ...

  // Función específica para administradores: crear producto completo
  async createProductAdmin(productData, imageFile) {
    try {
      let imageUrl = '';
      
      // Si hay imagen, subirla primero
      if (imageFile) {
        const { imageService } = await import('./imageService');
        const tempId = Date.now();
        const imageResult = await imageService.uploadProductImage(imageFile, tempId);
        if (imageResult.success) {
          imageUrl = imageResult.url;
        }
      }

      // Crear producto en Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin' // En producción sería el userId del admin
      });

      return { success: true, id: docRef.id, imageUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto (solo admin)
  async updateProductAdmin(id, updates, newImageFile, oldImageUrl) {
    try {
      let imageUrl = oldImageUrl;

      // Si hay nueva imagen, subir y eliminar la anterior
      if (newImageFile) {
        const { imageService } = await import('./imageService');
        
        // Subir nueva imagen
        const imageResult = await imageService.uploadProductImage(newImageFile, id);
        if (imageResult.success) {
          imageUrl = imageResult.url;
          
          // Eliminar imagen anterior si existe
          if (oldImageUrl) {
            await imageService.deleteProductImage(oldImageUrl);
          }
        }
      }

      // Actualizar en Firestore
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        imageUrl,
        updatedAt: serverTimestamp()
      });

      return { success: true, imageUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto (solo admin)
  async deleteProductAdmin(id, imageUrl) {
    try {
      // Eliminar imagen si existe
      if (imageUrl) {
        const { imageService } = await import('./imageService');
        await imageService.deleteProductImage(imageUrl);
      }

      // Eliminar producto
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener estadísticas de productos (solo admin)
  async getProductStats() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = [];
      
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });

      const stats = {
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

      return { success: true, stats, products };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Hook personalizado para administrador
// src/hooks/useAdmin.js
import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { adminService } from '../services/adminService';

export const useAdmin = (user) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const result = await adminService.isUserAdmin(user.email);
        setIsAdmin(result.isAdmin || false);
      }
      setLoading(false);
    };
    
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
    }
  }, [isAdmin]);

  const loadProducts = async () => {
    const result = await productService.getProductStats();
    if (result.success) {
      setProducts(result.products);
      setStats(result.stats);
    }
  };

  const addProduct = async (productData, imageFile) => {
    const result = await productService.createProductAdmin(productData, imageFile);
    if (result.success) {
      await loadProducts(); // Recargar lista
    }
    return result;
  };

  const updateProduct = async (id, updates, imageFile, oldImageUrl) => {
    const result = await productService.updateProductAdmin(id, updates, imageFile, oldImageUrl);
    if (result.success) {
      await loadProducts(); // Recargar lista
    }
    return result;
  };

  const deleteProduct = async (id, imageUrl) => {
    const result = await productService.deleteProductAdmin(id, imageUrl);
    if (result.success) {
      await loadProducts(); // Recargar lista
    }
    return result;
  };

  return {
    isAdmin,
    products,
    stats,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: loadProducts
  };
};