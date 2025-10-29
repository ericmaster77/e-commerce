// src/components/CheckoutMercadoPago.js
// Componente de Checkout con integración de Mercado Pago

import React, { useState, useContext, useEffect } from 'react';
import { CreditCard, Package, MapPin, Mail, User, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import MercadoPagoService from '../services/mercadoPagoService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const CheckoutMercadoPago = ({ onClose }) => {
  const { cartItems, getTotalPrice, clearCart } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  
  const [step, setStep] = useState(1); // 1: Datos, 2: Confirmar, 3: Pago
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');

  const [shippingData, setShippingData] = useState({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Calcular totales
  const subtotal = getTotalPrice();
  const shipping = 150; // Envío fijo por ahora
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateShippingData = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (let field of required) {
      if (!shippingData[field]?.trim()) {
        setError(`El campo ${field} es obligatorio`);
        return false;
      }
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      setError('Email inválido');
      return false;
    }

    // Validar teléfono (10 dígitos)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(shippingData.phone.replace(/\s/g, ''))) {
      setError('Teléfono debe tener 10 dígitos');
      return false;
    }

    setError('');
    return true;
  };

  const handleContinueToConfirm = () => {
    if (validateShippingData()) {
      setStep(2);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crear el pedido en Firestore
      const orderData = {
        userId: currentUser?.uid || 'guest',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku || '',
          imageUrl: item.imageUrl || ''
        })),
        shippingData,
        subtotal,
        shipping,
        total,
        status: 'pending_payment',
        paymentMethod: 'mercadopago',
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      const newOrderId = orderRef.id;
      setOrderId(newOrderId);

      console.log('Pedido creado:', newOrderId);

      // 2. Formatear datos para Mercado Pago
      const mpItems = MercadoPagoService.formatItems(cartItems);
      const mpPayer = MercadoPagoService.formatPayer(shippingData);
      const backUrls = MercadoPagoService.generateBackUrls(newOrderId);

      // 3. Crear preferencia de pago
      // NOTA: Esta función debe llamar a tu Firebase Function
      const preferenceResult = await MercadoPagoService.createPreference({
        orderId: newOrderId,
        items: mpItems,
        payer: mpPayer,
        backUrls,
        notificationUrl: `${process.env.REACT_APP_FUNCTIONS_URL}/mercadoPagoWebhook`
      });

      if (!preferenceResult.success) {
        throw new Error(preferenceResult.error || 'Error al crear preferencia de pago');
      }

      // 4. Guardar información de pago en el pedido
      await addDoc(collection(db, 'orders', newOrderId), {
        mercadoPagoPreferenceId: preferenceResult.preferenceId,
        paymentUrl: preferenceResult.initPoint,
        updatedAt: serverTimestamp()
      });

      // 5. Mostrar URL de pago
      setPaymentUrl(preferenceResult.initPoint);
      setStep(3);

      // Limpiar carrito
      clearCart();

    } catch (err) {
      console.error('Error al procesar pago:', err);
      setError(err.message || 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso 1: Datos de envío
  const renderShippingForm = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <MapPin className="w-6 h-6" />
        Información de Envío
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Nombre Completo *
          </label>
          <input
            type="text"
            name="fullName"
            value={shippingData.fullName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Juan Pérez García"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-1" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={shippingData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="phone"
            value={shippingData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="5512345678"
            maxLength="10"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <input
            type="text"
            name="address"
            value={shippingData.address}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Calle, Número, Colonia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad *
          </label>
          <input
            type="text"
            name="city"
            value={shippingData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ciudad de México"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <input
            type="text"
            name="state"
            value={shippingData.state}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="CDMX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código Postal *
          </label>
          <input
            type="text"
            name="zipCode"
            value={shippingData.zipCode}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="01000"
            maxLength="5"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleContinueToConfirm}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Continuar
      </button>
    </div>
  );

  // Renderizar paso 2: Confirmación
  const renderConfirmation = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Confirmar Pedido
      </h2>

      {/* Resumen de productos */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-lg">Productos ({cartItems.length})</h3>
        {cartItems.map(item => (
          <div key={item.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
            </div>
            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Datos de envío */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Enviar a:</h3>
        <div className="text-sm space-y-1">
          <p><strong>{shippingData.fullName}</strong></p>
          <p>{shippingData.address}</p>
          <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
          <p>Tel: {shippingData.phone}</p>
          <p>Email: {shippingData.email}</p>
        </div>
      </div>

      {/* Totales */}
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío:</span>
          <span>${shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-2">
          <strong>💳 Paga con Mercado Pago</strong>
        </p>
        <div className="text-xs text-gray-600 space-y-1">
          <p>✅ Tarjetas de crédito y débito</p>
          <p>✅ Meses sin intereses disponibles</p>
          <p>✅ Pago seguro y protegido</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          disabled={loading}
        >
          Regresar
        </button>
        <button
          onClick={handleProcessPayment}
          disabled={loading}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Ir a Pagar
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Renderizar paso 3: Pago en Mercado Pago
  const renderPaymentLink = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Pedido Creado!
        </h2>
        <p className="text-gray-600">
          Tu pedido <strong>#{orderId.slice(-8).toUpperCase()}</strong> ha sido registrado.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
        <img 
          src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png"
          alt="Mercado Pago"
          className="h-12 mx-auto"
        />
        <p className="text-sm text-gray-700">
          Serás redirigido a <strong>Mercado Pago</strong> para completar tu pago de forma segura.
        </p>
        <div className="text-xs text-gray-600">
          <p>✅ Pago 100% seguro y protegido</p>
          <p>✅ Acepta tarjetas, transferencias, efectivo</p>
          <p>✅ Meses sin intereses disponibles</p>
        </div>
      </div>

      <a
        href={paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-5 h-5" />
        Pagar con Mercado Pago
      </a>

      <p className="text-xs text-gray-500">
        También puedes copiar y pegar este enlace en tu navegador:<br />
        <span className="text-blue-500 break-all">{paymentUrl}</span>
      </p>

      <button
        onClick={onClose}
        className="text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Cerrar
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Indicador de pasos */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(num => (
              <React.Fragment key={num}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-12 h-1 ${
                      step > num ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenido según el paso */}
        {step === 1 && renderShippingForm()}
        {step === 2 && renderConfirmation()}
        {step === 3 && renderPaymentLink()}
      </div>
    </div>
  );
};

export default CheckoutMercadoPago;