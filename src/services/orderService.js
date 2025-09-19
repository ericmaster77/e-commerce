import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { productService } from './productService';

export const orderService = {
  // Crear una nueva orden
  async createOrder(orderData) {
    try {
      // Validar datos de entrada
      if (!orderData.userId || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return { success: false, error: 'Datos de orden inválidos' };
      }

      // Usar transacción para garantizar consistencia
      const result = await runTransaction(db, async (transaction) => {
        // 1. Verificar stock disponible para todos los productos
        const stockChecks = [];
        for (const item of orderData.items) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Producto ${item.name} no encontrado`);
          }
          
          const productData = productDoc.data();
          if (productData.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${productData.stock}, Solicitado: ${item.quantity}`);
          }
          
          stockChecks.push({
            ref: productRef,
            currentStock: productData.stock,
            orderQuantity: item.quantity
          });
        }

        // 2. Calcular total real basado en precios actuales
        let calculatedTotal = 0;
        const processedItems = [];
        
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData.items[i];
          const stockCheck = stockChecks[i];
          const productDoc = await transaction.get(stockCheck.ref);
          const currentProduct = productDoc.data();
          
          const itemTotal = currentProduct.price * item.quantity;
          calculatedTotal += itemTotal;
          
          processedItems.push({
            id: item.id,
            name: item.name,
            price: currentProduct.price, // Usar precio actual
            quantity: item.quantity,
            total: itemTotal,
            category: currentProduct.category
          });
        }

        // 3. Crear la orden
        const orderRef = collection(db, 'orders');
        const newOrder = await addDoc(orderRef, {
          userId: orderData.userId,
          userEmail: orderData.userEmail,
          userDisplayName: orderData.userDisplayName,
          items: processedItems,
          itemCount: processedItems.length,
          totalQuantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: calculatedTotal,
          tax: calculatedTotal * 0.16, // IVA 16% México
          total: calculatedTotal * 1.16,
          status: 'pending',
          paymentStatus: 'pending',
          shippingAddress: orderData.shippingAddress || null,
          billingAddress: orderData.billingAddress || null,
          notes: orderData.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Campos para tracking
          trackingNumber: null,
          estimatedDelivery: null,
          // Campos para admin
          adminNotes: ''
        });

        // 4. Actualizar stock de productos
        for (const stockCheck of stockChecks) {
          const newStock = stockCheck.currentStock - stockCheck.orderQuantity;
          transaction.update(stockCheck.ref, { 
            stock: newStock,
            updatedAt: serverTimestamp()
          });
        }

        return { orderId: newOrder.id, total: calculatedTotal * 1.16 };
      });

      return { 
        success: true, 
        orderId: result.orderId,
        total: result.total,
        message: 'Orden creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear orden:', error);
      return { 
        success: false, 
        error: error.message || 'Error al procesar la orden'
      };
    }
  },

  // Obtener órdenes de un usuario específico
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
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      return { success: true, orders };
    } catch (error) {
      console.error('Error al obtener órdenes del usuario:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener todas las órdenes (solo admin)
  async getAllOrders() {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      return { success: true, orders };
    } catch (error) {
      console.error('Error al obtener todas las órdenes:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener una orden específica
  async getOrder(orderId) {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (!orderDoc.exists()) {
        return { success: false, error: 'Orden no encontrada' };
      }
      
      const data = orderDoc.data();
      const order = {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
      
      return { success: true, order };
    } catch (error) {
      console.error('Error al obtener orden:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar el status de una orden (solo admin)
  async updateOrderStatus(orderId, status, adminNotes = '', trackingNumber = null) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      const updateData = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
      
      // Si se marca como enviado, agregar fecha estimada de entrega
      if (status === 'shipped') {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 días para entrega
        updateData.estimatedDelivery = estimatedDelivery;
      }
      
      await updateDoc(orderRef, updateData);
      
      return { 
        success: true, 
        message: `Orden actualizada a ${status}` 
      };
    } catch (error) {
      console.error('Error al actualizar status de orden:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancelar una orden
  async cancelOrder(orderId, reason = '') {
    try {
      // Usar transacción para restaurar stock si es necesario
      const result = await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Orden no encontrada');
        }
        
        const orderData = orderDoc.data();
        
        // Solo se puede cancelar si está pendiente o confirmada
        if (!['pending', 'confirmed'].includes(orderData.status)) {
          throw new Error(`No se puede cancelar una orden con status: ${orderData.status}`);
        }
        
        // Restaurar stock si la orden estaba confirmada
        if (orderData.status === 'confirmed') {
          for (const item of orderData.items) {
            const productRef = doc(db, 'products', item.id);
            const productDoc = await transaction.get(productRef);
            
            if (productDoc.exists()) {
              const currentStock = productDoc.data().stock;
              transaction.update(productRef, { 
                stock: currentStock + item.quantity,
                updatedAt: serverTimestamp()
              });
            }
          }
        }
        
        // Actualizar la orden
        transaction.update(orderRef, {
          status: 'cancelled',
          cancelReason: reason,
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true };
      });
      
      return { 
        success: true, 
        message: 'Orden cancelada exitosamente' 
      };
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener estadísticas de órdenes (solo admin)
  async getOrderStats() {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate()
        });
      });

      // Calcular estadísticas
      const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
        shippedOrders: orders.filter(o => o.status === 'shipped').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders
          .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
          .reduce((sum, o) => sum + (o.total || 0), 0),
        averageOrderValue: 0,
        // Estadísticas por mes (últimos 12 meses)
        monthlyStats: {},
        // Productos más vendidos
        topProducts: {}
      };

      // Calcular valor promedio de orden
      const completedOrders = orders.filter(o => 
        ['confirmed', 'shipped', 'delivered'].includes(o.status)
      );
      if (completedOrders.length > 0) {
        stats.averageOrderValue = stats.totalRevenue / completedOrders.length;
      }

      // Estadísticas mensuales
      const last12Months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        last12Months.push(monthKey);
        stats.monthlyStats[monthKey] = {
          orders: 0,
          revenue: 0
        };
      }

      // Procesar órdenes por mes
      completedOrders.forEach(order => {
        if (order.createdAt) {
          const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
          if (stats.monthlyStats[monthKey]) {
            stats.monthlyStats[monthKey].orders += 1;
            stats.monthlyStats[monthKey].revenue += order.total || 0;
          }
        }

        // Contar productos más vendidos
        order.items.forEach(item => {
          if (stats.topProducts[item.id]) {
            stats.topProducts[item.id].quantity += item.quantity;
            stats.topProducts[item.id].revenue += item.total || 0;
          } else {
            stats.topProducts[item.id] = {
              name: item.name,
              quantity: item.quantity,
              revenue: item.total || 0
            };
          }
        });
      });

      return { success: true, stats, orders: completedOrders };
    } catch (error) {
      console.error('Error al obtener estadísticas de órdenes:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener órdenes por status
  async getOrdersByStatus(status) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      return { success: true, orders };
    } catch (error) {
      console.error('Error al obtener órdenes por status:', error);
      return { success: false, error: error.message };
    }
  }
};