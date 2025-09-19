// src/services/productService.js - ACTUALIZADO CON FIREBASE STORAGE
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
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { storageService } from './storageService';

export const productService = {
  // Obtener todos los productos
  async getProducts() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      );
      const products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          // Convertir timestamps a fechas
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      return { success: true, products };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return { success: false, error: error.message };
    }
  },

  // Agregar producto básico (sin imagen)
  async addProduct(product) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error al agregar producto:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto básico
  async updateProduct(id, updates) {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto básico
  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener productos por categoría
  async getProductsByCategory(category) {
    try {
      const q = query(
        collection(db, 'products'), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      return { success: true, products };
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener productos destacados
  async getFeaturedProducts() {
    try {
      const q = query(
        collection(db, 'products'), 
        where('featured', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      return { success: true, products };
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
      return { success: false, error: error.message };
    }
  },

  // Escuchar cambios en productos (tiempo real)
  onProductsChange(callback) {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      callback(products);
    });
  },

  // =================== FUNCIONES DE ADMINISTRACIÓN CON FIREBASE STORAGE ===================

  // Crear producto completo (con imagen) - SOLO ADMIN
  async createProductAdmin(productData, imageFile) {
    try {
      console.log('🔄 Creando producto con imagen...');
      
      // Primero crear el producto para obtener un ID
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        imageUrl: '/api/placeholder/300/300', // Placeholder temporal
        hasRealImage: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin'
      });

      let finalImageUrl = '/api/placeholder/300/300';
      let hasRealImage = false;

      // Si hay imagen, subirla usando el ID real del producto
      if (imageFile) {
        console.log(`📤 Subiendo imagen para producto ${docRef.id}`);
        
        // Validar imagen
        const validation = storageService.isValidImage(imageFile);
        if (!validation.isValid) {
          console.warn(`⚠️ Imagen inválida: ${validation.error}`);
        } else {
          // Subir imagen a Firebase Storage
          const uploadResult = await storageService.uploadProductImage(imageFile, docRef.id);
          
          if (uploadResult.success) {
            finalImageUrl = uploadResult.url;
            hasRealImage = true;
            console.log(`✅ Imagen subida exitosamente: ${finalImageUrl}`);
            
            // Actualizar producto con la URL real de la imagen
            await updateDoc(docRef, {
              imageUrl: finalImageUrl,
              hasRealImage: true,
              imagePath: uploadResult.path,
              imageSize: uploadResult.size,
              updatedAt: serverTimestamp()
            });
          } else {
            console.error(`❌ Error subiendo imagen: ${uploadResult.error}`);
          }
        }
      }

      return { 
        success: true, 
        id: docRef.id, 
        imageUrl: finalImageUrl,
        hasRealImage
      };
    } catch (error) {
      console.error('Error al crear producto (admin):', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto completo (con manejo de imagen) - SOLO ADMIN
  async updateProductAdmin(id, updates, newImageFile, oldImageUrl) {
    try {
      console.log(`🔄 Actualizando producto ${id}...`);
      
      let finalImageUrl = oldImageUrl || '/api/placeholder/300/300';
      let hasRealImage = !!(oldImageUrl && !oldImageUrl.includes('placeholder'));

      // Si hay nueva imagen
      if (newImageFile) {
        console.log(`📤 Subiendo nueva imagen para producto ${id}`);
        
        // Validar nueva imagen
        const validation = storageService.isValidImage(newImageFile);
        if (!validation.isValid) {
          console.warn(`⚠️ Nueva imagen inválida: ${validation.error}`);
        } else {
          // Subir nueva imagen
          const uploadResult = await storageService.uploadProductImage(newImageFile, id);
          
          if (uploadResult.success) {
            // Eliminar imagen anterior si existe y no es placeholder
            if (oldImageUrl && !oldImageUrl.includes('placeholder')) {
              console.log('🗑️ Eliminando imagen anterior...');
              await storageService.deleteImageByUrl(oldImageUrl);
            }
            
            finalImageUrl = uploadResult.url;
            hasRealImage = true;
            
            // Agregar información de imagen a las actualizaciones
            updates.imagePath = uploadResult.path;
            updates.imageSize = uploadResult.size;
            
            console.log(`✅ Nueva imagen subida: ${finalImageUrl}`);
          } else {
            console.error(`❌ Error subiendo nueva imagen: ${uploadResult.error}`);
            // Mantener imagen anterior en caso de error
          }
        }
      }

      // Actualizar producto en Firestore
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        imageUrl: finalImageUrl,
        hasRealImage,
        updatedAt: serverTimestamp()
      });

      return { 
        success: true, 
        imageUrl: finalImageUrl,
        hasRealImage
      };
    } catch (error) {
      console.error('Error al actualizar producto (admin):', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto completo (con imagen) - SOLO ADMIN
  async deleteProductAdmin(id, imageUrl) {
    try {
      console.log(`🗑️ Eliminando producto ${id}...`);
      
      // Eliminar imagen si existe y no es placeholder
      if (imageUrl && !imageUrl.includes('placeholder')) {
        console.log('🗑️ Eliminando imagen asociada...');
        const deleteResult = await storageService.deleteImageByUrl(imageUrl);
        if (!deleteResult.success) {
          console.warn(`⚠️ No se pudo eliminar imagen: ${deleteResult.error}`);
        } else {
          console.log('✅ Imagen eliminada correctamente');
        }
      }

      // Eliminar producto de Firestore
      await deleteDoc(doc(db, 'products', id));
      
      console.log(`✅ Producto ${id} eliminado completamente`);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar producto (admin):', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener estadísticas de productos (solo admin)
  async getProductStats() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      // Estadísticas básicas
      const stats = {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
        totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
        featuredCount: products.filter(p => p.featured).length,
        outOfStock: products.filter(p => (p.stock || 0) === 0).length,
        withRealImages: products.filter(p => p.hasRealImage).length,
        byCategory: products.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {})
      };

      // Estadísticas de imágenes
      stats.imageStats = {
        withImages: stats.withRealImages,
        withPlaceholder: stats.totalProducts - stats.withRealImages,
        imagePercentage: stats.totalProducts > 0 
          ? Math.round((stats.withRealImages / stats.totalProducts) * 100) 
          : 0
      };

      return { success: true, stats, products };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { success: false, error: error.message };
    }
  },

  // Función para inicializar productos de ejemplo
  async seedInitialProducts() {
    try {
      const sampleProducts = [
        {
          name: "Brazalete Dorado Elegance",
          price: 2500,
          originalPrice: 3500,
          discount: 28,
          category: "Brazaletes",
          description: "Brazalete dorado con textura única, inspirado en el legado de Rosa Oliva",
          rating: 4.8,
          stock: 15,
          featured: true,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 3500,
            member: 2500,
            wholesale: 2000
          }
        },
        {
          name: "Anillo Esmeralda Premium",
          price: 4200,
          originalPrice: 5600,
          discount: 25,
          category: "Anillos",
          description: "Anillo con esmeralda natural en oro de 18k",
          rating: 4.9,
          stock: 8,
          featured: true,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 5600,
            member: 4200,
            wholesale: 3500
          }
        },
        {
          name: "Collar Perlas Naturales",
          price: 3800,
          originalPrice: 4800,
          discount: 20,
          category: "Collares",
          description: "Collar de perlas naturales con certificado de autenticidad",
          rating: 4.7,
          stock: 12,
          featured: false,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 4800,
            member: 3800,
            wholesale: 3200
          }
        },
        {
          name: "Aretes Diamantes Deluxe",
          price: 6500,
          originalPrice: 8000,
          discount: 18,
          category: "Aretes",
          description: "Aretes con diamantes certificados en oro blanco",
          rating: 5.0,
          stock: 5,
          featured: true,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 8000,
            member: 6500,
            wholesale: 5500
          }
        },
        {
          name: "Pulsera Oro Rosa",
          price: 1800,
          originalPrice: 2200,
          discount: 18,
          category: "Pulseras",
          description: "Pulsera elegante en oro rosa de 14k",
          rating: 4.6,
          stock: 20,
          featured: false,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 2200,
            member: 1800,
            wholesale: 1500
          }
        },
        {
          name: "Gargantilla Minimalista",
          price: 1200,
          originalPrice: 1500,
          discount: 20,
          category: "Collares",
          description: "Gargantilla de diseño minimalista en plata sterling",
          rating: 4.5,
          stock: 25,
          featured: false,
          imageUrl: "/api/placeholder/300/300",
          hasRealImage: false,
          pricing: {
            public: 1500,
            member: 1200,
            wholesale: 1000
          }
        }
      ];

      // Verificar si ya existen productos
      const existingProducts = await this.getProducts();
      if (existingProducts.success && existingProducts.products.length > 0) {
        return { success: false, error: 'Ya existen productos en la base de datos' };
      }

      // Agregar productos de ejemplo
      const results = await Promise.all(
        sampleProducts.map(product => this.addProduct(product))
      );

      const successful = results.filter(r => r.success).length;
      return { 
        success: true, 
        message: `${successful} productos de ejemplo agregados exitosamente` 
      };
    } catch (error) {
      console.error('Error al inicializar productos:', error);
      return { success: false, error: error.message };
    }
  },

  // Función para limpiar imágenes huérfanas (mantenimiento)
  async cleanupOrphanedImages() {
    try {
      // Esta función se implementaría para limpiar imágenes que ya no están asociadas a productos
      console.log('🧹 Función de limpieza de imágenes huérfanas - Por implementar');
      return { success: true, message: 'Función por implementar' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};