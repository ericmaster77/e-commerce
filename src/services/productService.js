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

  // Agregar producto
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

  // Actualizar producto
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

  // Eliminar producto
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

  // Funciones específicas para administradores
  async createProductAdmin(productData, imageFile) {
    try {
      let imageUrl = '';
      
      // Si hay imagen, subirla primero (implementaremos después)
      if (imageFile) {
        // Por ahora usar placeholder
        imageUrl = '/api/placeholder/300/300';
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
      console.error('Error al crear producto (admin):', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto (solo admin)
  async updateProductAdmin(id, updates, newImageFile, oldImageUrl) {
    try {
      let imageUrl = oldImageUrl;

      // Si hay nueva imagen, usar placeholder por ahora
      if (newImageFile) {
        imageUrl = '/api/placeholder/300/300';
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
      console.error('Error al actualizar producto (admin):', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto (solo admin)
  async deleteProductAdmin(id, imageUrl) {
    try {
      // Por ahora solo eliminar el producto
      // En el futuro aquí eliminaremos también la imagen de Storage
      await deleteDoc(doc(db, 'products', id));
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
      console.error('Error al obtener estadísticas:', error);
      return { success: false, error: error.message };
    }
  },

  // Función para inicializar productos de ejemplo (usar solo una vez)
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
          imageUrl: "/api/placeholder/300/300"
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
          imageUrl: "/api/placeholder/300/300"
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
          imageUrl: "/api/placeholder/300/300"
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
          imageUrl: "/api/placeholder/300/300"
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
          imageUrl: "/api/placeholder/300/300"
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
          imageUrl: "/api/placeholder/300/300"
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
        message: `${successful} productos agregados exitosamente` 
      };
    } catch (error) {
      console.error('Error al inicializar productos:', error);
      return { success: false, error: error.message };
    }
  }
};