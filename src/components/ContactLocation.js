// src/components/ContactLocation.js - Módulo de Contacto y Ubicación
import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle, AlertCircle, Clock, Navigation } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSiteConfig } from '../hooks/useSiteConfig';

const ContactLocation = () => {
  const { classes, isMinimal } = useTheme();
  const { config } = useSiteConfig();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Consulta General',
    message: ''
  });
  
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  // Datos de la tienda
  const storeData = {
    name: 'Rosa Oliva Joyería',
    address: 'Centro Comercial "Pabellón Violetas", Local 17, Calle Violetas #401, Colonia Reforma, Oaxaca de Juárez, Oaxaca, México, C.P. 68050',
    coordinates: {
      lat: 17.079152,
      lng: -96.710444
    },
    hours: {
      weekdays: 'Lunes a Viernes: 9:00 AM - 8:00 PM',
      saturday: 'Sábado: 10:00 AM - 6:00 PM',
      sunday: 'Domingo: Cerrado'
    }
  };

  // Email de contacto (configurable desde SiteConfig)
  const contactEmail = config?.contactEmail || 'info@rosaolivajoyeria.com';
  const phone = config?.socialMedia?.phone || '+5258904057';
  const whatsapp = config?.socialMedia?.whatsapp || phone;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // Validaciones
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Crear el contenido del email
      const emailBody = `
Nuevo mensaje de contacto de Rosa Oliva Joyería

Nombre: ${formData.name}
Email: ${formData.email}
Teléfono: ${formData.phone || 'No proporcionado'}
Asunto: ${formData.subject}

Mensaje:
${formData.message}

---
Enviado desde el formulario de contacto de rosaolivajoyeria.com
      `.trim();

      // Crear el mailto link
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(`Contacto Web - ${formData.subject}`)}&body=${encodeURIComponent(emailBody)}`;
      
      // Abrir cliente de email
      window.location.href = mailtoLink;

      // Mostrar éxito y limpiar formulario
      showNotification('Tu mensaje ha sido preparado. Se abrirá tu cliente de email.');
      
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'Consulta General',
          message: ''
        });
      }, 1000);

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      showNotification(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${storeData.coordinates.lat},${storeData.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const openInWaze = () => {
    const url = `https://waze.com/ul?ll=${storeData.coordinates.lat},${storeData.coordinates.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen">
      {/* Banner superior (imagen fija desde /public) */}
      <section className="w-full h-[40vh] md:h-[50vh] lg:h-[60vh] relative overflow-hidden">
        <img 
          src="/contact-banner.jpg" 
          alt="Contacto - Rosa Oliva Joyería"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback si no existe la imagen
            e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=900&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Contacto y Ubicación
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Visítanos o contáctanos.
            </p>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Notificación */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-800' 
              : 'bg-red-100 border border-red-400 text-red-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {notification.message}
            </div>
          </div>
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna izquierda: Información y Mapa */}
          <div className="space-y-6">
            
            {/* Información de la tienda */}
            <div className={`${classes.card} p-6`}>
              <h2 className="text-2xl font-bold mb-6">Información de la Tienda</h2>
              
              {/* Dirección */}
              <div className="flex items-start mb-4">
                <MapPin className={`w-6 h-6 mr-3 flex-shrink-0 ${isMinimal ? 'text-gray-900' : 'text-rosa-primaryText'}`} />
                <div>
                  <h3 className="font-semibold mb-1">Dirección</h3>
                  <p className="text-gray-600">{storeData.address}</p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start mb-4">
                <Phone className={`w-6 h-6 mr-3 flex-shrink-0 ${isMinimal ? 'text-gray-900' : 'text-rosa-primaryText'}`} />
                <div>
                  <h3 className="font-semibold mb-1">Teléfono</h3>
                  <a href={`tel:${phone}`} className="text-verde-oliva hover:underline">
                    {phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start mb-4">
                <Mail className={`w-6 h-6 mr-3 flex-shrink-0 ${isMinimal ? 'text-gray-900' : 'text-rosa-primaryText'}`} />
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a href={`mailto:${contactEmail}`} className="text-verde-oliva hover:underline">
                    {contactEmail}
                  </a>
                </div>
              </div>

              {/* Horarios */}
              <div className="flex items-start">
                <Clock className={`w-6 h-6 mr-3 flex-shrink-0 ${isMinimal ? 'text-gray-900' : 'text-rosa-primaryText'}`} />
                <div>
                  <h3 className="font-semibold mb-1">Horarios</h3>
                  <p className="text-gray-600 text-sm">{storeData.hours.weekdays}</p>
                  <p className="text-gray-600 text-sm">{storeData.hours.saturday}</p>
                  <p className="text-gray-600 text-sm">{storeData.hours.sunday}</p>
                </div>
              </div>
            </div>

            {/* Mapa de Google Maps */}
            <div className={`${classes.card} p-6`}>
              <h2 className="text-2xl font-bold mb-4">Cómo Llegar</h2>
              
              {/* Iframe de Google Maps */}
              <div className="relative w-full h-80 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3814.2!2d${storeData.coordinates.lng}!3d${storeData.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDA0JzQ1LjAiTiA5NsKwNDInMzcuNiJX!5e0!3m2!1ses!2smx!4v1234567890`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Rosa Oliva Joyería"
                />
              </div>

              {/* Botones de navegación */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openInGoogleMaps}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Navigation className="w-5 h-5" />
                  Google Maps
                </button>
                <button
                  onClick={openInWaze}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  <Navigation className="w-5 h-5" />
                  Waze
                </button>
              </div>
            </div>
          </div>

          {/* Columna derecha: Formulario de contacto */}
          <div className={`${classes.card} p-6`}>
            <h2 className="text-2xl font-bold mb-6">Envíanos un Mensaje</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-oliva focus:border-verde-oliva"
                  placeholder="Tu nombre"
                  disabled={sending}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-oliva focus:border-verde-oliva"
                  placeholder="tu@email.com"
                  disabled={sending}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-oliva focus:border-verde-oliva"
                  placeholder="+52 951 XXX XXXX"
                  disabled={sending}
                />
              </div>

              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-oliva focus:border-verde-oliva"
                  disabled={sending}
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Información de Productos">Información de Productos</option>
                  <option value="Pedido Personalizado">Pedido Personalizado</option>
                  <option value="Membresía">Membresía</option>
                  <option value="Queja">Queja</option>
                  <option value="Sugerencia">Sugerencia</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-oliva focus:border-verde-oliva resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={sending}
                />
              </div>

              {/* Botón enviar */}
              <button
                type="submit"
                disabled={sending}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  isMinimal 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'bg-verde-oliva text-white hover:bg-verde-oliva-hover'
                }`}
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Mensaje
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                * Campos requeridos
              </p>
            </form>

            {/* Métodos alternativos de contacto */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-4">O contáctanos por:</h3>
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                  WhatsApp
                </a>
                <a
                  href={`tel:${phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Llamar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLocation;