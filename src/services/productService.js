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
  orderBy 
} from 'firebase/firestore';

export const productService = {
  // Obtener todos los productos
  async getProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, products };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Agregar producto
  async addProduct(product) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto
  async updateProduct(id, updates) {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto
  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener productos por categoría
  async getProductsByCategory(category) {
    try {
      const q = query(
        collection(db, 'products'), 
        where('category', '==', category)
      );
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, products };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};