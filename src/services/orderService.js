import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export const orderService = {
  // Crear orden
  async createOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, orderId: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener órdenes de usuario
  async getUserOrders(userId) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};