// src/services/mercadoPagoService.js
// Servicio de integración con Mercado Pago para React + Firebase

import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Configuración de Mercado Pago
 * IMPORTANTE: Usa variables de entorno para las keys
 */
const MP_CONFIG = {
  publicKey: process.env.REACT_APP_MP_PUBLIC_KEY,
  accessToken: process.env.REACT_APP_MP_ACCESS_TOKEN, // Solo para backend
};

class MercadoPagoService {
  /**
   * Crea una preferencia de pago en Mercado Pago
   * Esta función debe llamarse desde Firebase Functions por seguridad
   * 
   * @param {Object} orderData - Datos del pedido
   * @returns {Promise<Object>} - { success, preferenceId, initPoint, error }
   */
  static async createPreference(orderData) {
    try {
      const {
        orderId,
        items,
        payer,
        backUrls,
        notificationUrl
      } = orderData;

      // Esta llamada debe hacerse desde Firebase Functions
      // Por ahora, simularemos el endpoint
      const response = await fetch(
        'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/createMercadoPagoPreference',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            items,
            payer,
            backUrls,
            notificationUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        preferenceId: data.id,
        initPoint: data.init_point, // URL de pago
        sandboxInitPoint: data.sandbox_init_point
      };

    } catch (error) {
      console.error('Error creando preferencia MP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Formatea los items del carrito al formato de Mercado Pago
   * @param {Array} cartItems - Items del carrito
   * @returns {Array} - Items formateados para MP
   */
  static formatItems(cartItems) {
    return cartItems.map(item => ({
      id: item.id,
      title: item.name,
      description: item.description || '',
      picture_url: item.imageUrl || '',
      category_id: 'accessories', // Cambia según tu categoría
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: 'MXN'
    }));
  }

  /**
   * Formatea datos del pagador
   * @param {Object} userData - Datos del usuario
   * @returns {Object} - Datos formateados para MP
   */
  static formatPayer(userData) {
    return {
      name: userData.fullName || '',
      email: userData.email || '',
      phone: {
        area_code: '52',
        number: userData.phone || ''
      },
      address: {
        street_name: userData.address || '',
        street_number: '',
        zip_code: userData.zipCode || ''
      }
    };
  }

  /**
   * Genera las URLs de retorno (success, failure, pending)
   * @param {string} orderId - ID del pedido
   * @returns {Object} - URLs de retorno
   */
  static generateBackUrls(orderId) {
    const baseUrl = window.location.origin;
    return {
      success: `${baseUrl}/payment/success?order=${orderId}`,
      failure: `${baseUrl}/payment/failure?order=${orderId}`,
      pending: `${baseUrl}/payment/pending?order=${orderId}`
    };
  }

  /**
   * Procesa el webhook de Mercado Pago
   * Esta función debe ejecutarse en Firebase Functions
   */
  static async processWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      // Solo procesar notificaciones de pago
      if (type !== 'payment') {
        return { success: true, message: 'Not a payment notification' };
      }

      const paymentId = data.id;

      // Consultar detalles del pago
      // Esto debe hacerse desde Firebase Functions con el accessToken
      const paymentInfo = await this.getPaymentInfo(paymentId);

      if (!paymentInfo.success) {
        throw new Error('Error obteniendo info del pago');
      }

      return {
        success: true,
        paymentInfo: paymentInfo.data
      };

    } catch (error) {
      console.error('Error procesando webhook MP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene información de un pago
   * Debe ejecutarse desde Firebase Functions
   */
  static async getPaymentInfo(paymentId) {
    try {
      // Esta llamada debe hacerse desde Firebase Functions
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MP_CONFIG.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          status_detail: data.status_detail,
          transaction_amount: data.transaction_amount,
          net_amount: data.transaction_details?.net_received_amount,
          date_approved: data.date_approved,
          payment_method_id: data.payment_method_id,
          payment_type_id: data.payment_type_id,
          installments: data.installments,
          external_reference: data.external_reference, // Tu orderId
          payer: {
            email: data.payer?.email,
            identification: data.payer?.identification
          }
        }
      };

    } catch (error) {
      console.error('Error obteniendo info de pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mapea el status de Mercado Pago a tu sistema
   * @param {string} mpStatus - Status de MP
   * @returns {string} - Status interno
   */
  static mapPaymentStatus(mpStatus) {
    const statusMap = {
      'approved': 'paid',
      'pending': 'pending_payment',
      'authorized': 'pending_payment',
      'in_process': 'pending_payment',
      'in_mediation': 'pending_payment',
      'rejected': 'payment_failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'refunded'
    };

    return statusMap[mpStatus] || 'pending_payment';
  }
}

export default MercadoPagoService;