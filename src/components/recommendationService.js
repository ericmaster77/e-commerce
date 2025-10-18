// src/services/recommendationService.js
import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export const recommendationService = {
  // Market Basket Analysis
  async getProductRecommendations(userId, currentProductId = null) {
    try {
      // 1. Obtener historial de compras del usuario
      const userOrders = await this.getUserPurchaseHistory(userId);
      const purchasedProducts = this.extractPurchasedProducts(userOrders);
      
      // 2. Encontrar patrones de compra frecuentes
      const frequentPairs = await this.findFrequentItemPairs();
      
      // 3. Obtener productos relacionados
      let recommendations = [];
      
      if (currentProductId) {
        // Recomendaciones basadas en el producto actual
        recommendations = await this.getComplementaryProducts(currentProductId, frequentPairs);
      } else {
        // Recomendaciones basadas en el historial
        recommendations = await this.getHistoryBasedRecommendations(purchasedProducts, frequentPairs);
      }
      
      // 4. Filtrar productos ya comprados
      const filteredRecommendations = recommendations.filter(
        prod => !purchasedProducts.some(p => p.id === prod.id)
      );
      
      // 5. Ordenar por relevancia
      return this.rankRecommendations(filteredRecommendations, purchasedProducts);
      
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return [];
    }
  },

  async getUserPurchaseHistory(userId) {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', 'in', ['delivered', 'shipped', 'confirmed']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  },

  extractPurchasedProducts(orders) {
    const products = new Map();
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!products.has(item.id)) {
          products.set(item.id, {
            ...item,
            purchaseCount: 1,
            totalSpent: item.price * item.quantity
          });
        } else {
          const existing = products.get(item.id);
          products.set(item.id, {
            ...existing,
            purchaseCount: existing.purchaseCount + 1,
            totalSpent: existing.totalSpent + (item.price * item.quantity)
          });
        }
      });
    });
    
    return Array.from(products.values());
  },

  async findFrequentItemPairs() {
    // Análisis de cestas de compra
    const allOrders = await getDocs(collection(db, 'orders'));
    const baskets = [];
    
    allOrders.forEach(doc => {
      const order = doc.data();
      if (order.items && order.items.length > 1) {
        baskets.push(order.items.map(item => item.id));
      }
    });
    
    // Calcular pares frecuentes
    const pairFrequency = new Map();
    
    baskets.forEach(basket => {
      for (let i = 0; i < basket.length; i++) {
        for (let j = i + 1; j < basket.length; j++) {
          const pair = [basket[i], basket[j]].sort().join('-');
          pairFrequency.set(pair, (pairFrequency.get(pair) || 0) + 1);
        }
      }
    });
    
    // Ordenar por frecuencia
    return Array.from(pairFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100); // Top 100 pares
  },

  async getComplementaryProducts(productId, frequentPairs) {
    const relatedIds = new Set();
    
    frequentPairs.forEach(([pair, frequency]) => {
      const [id1, id2] = pair.split('-');
      if (id1 === productId) {
        relatedIds.add(id2);
      } else if (id2 === productId) {
        relatedIds.add(id1);
      }
    });
    
    // Obtener productos relacionados
    const products = [];
    for (const id of relatedIds) {
      const prod = await this.getProductById(id);
      if (prod) products.push(prod);
    }
    
    return products;
  },

  async getHistoryBasedRecommendations(purchasedProducts, frequentPairs) {
    const recommendedIds = new Set();
    
    // Para cada producto comprado, buscar sus complementarios
    purchasedProducts.forEach(product => {
      frequentPairs.forEach(([pair, frequency]) => {
        const [id1, id2] = pair.split('-');
        if (id1 === product.id) {
          recommendedIds.add(id2);
        } else if (id2 === product.id) {
          recommendedIds.add(id1);
        }
      });
    });
    
    // Obtener productos
    const products = [];
    for (const id of recommendedIds) {
      const prod = await this.getProductById(id);
      if (prod) products.push(prod);
    }
    
    return products.slice(0, 10);
  },

  async getProductById(productId) {
    try {
      const q = query(collection(db, 'products'), where('id', '==', productId), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      return null;
    }
  },

  rankRecommendations(recommendations, userHistory) {
    // Calcular puntajes basados en:
    // 1. Categorías preferidas del usuario
    // 2. Rango de precio similar a compras anteriores
    // 3. Rating del producto
    
    const avgPrice = userHistory.reduce((sum, p) => sum + p.price, 0) / userHistory.length || 0;
    const categories = new Map();
    
    userHistory.forEach(p => {
      categories.set(p.category, (categories.get(p.category) || 0) + 1);
    });
    
    return recommendations.map(product => {
      let score = 0;
      
      // Bonus por categoría favorita
      if (categories.has(product.category)) {
        score += categories.get(product.category) * 10;
      }
      
      // Bonus por precio similar
      const priceDiff = Math.abs(product.price - avgPrice) / avgPrice;
      if (priceDiff < 0.3) score += 20;
      else if (priceDiff < 0.5) score += 10;
      
      // Bonus por rating alto
      score += (product.rating || 4) * 5;
      
      // Bonus si es destacado
      if (product.featured) score += 15;
      
      return { ...product, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);
  },

  // Sistema de recordatorio de cashback
  async checkUnusedCashback() {
    try {
      const usersWithCashback = await getDocs(
        query(
          collection(db, 'users'),
          where('cashbackBalance', '>', 0)
        )
      );
      
      const reminders = [];
      const now = new Date();
      
      usersWithCashback.forEach(doc => {
        const user = doc.data();
        const lastPurchase = user.lastPurchaseDate?.toDate();
        
        if (lastPurchase) {
          const daysSinceLastPurchase = Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastPurchase > 30) {
            reminders.push({
              userId: doc.id,
              email: user.email,
              name: user.displayName,
              cashbackBalance: user.cashbackBalance,
              daysSinceLastPurchase,
              priority: daysSinceLastPurchase > 60 ? 'high' : 'medium'
            });
          }
        }
      });
      
      return reminders;
    } catch (error) {
      console.error('Error verificando cashback:', error);
      return [];
    }
  }
};