// src/components/SiteConfigPanel.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff, AlertCircle, Facebook, Instagram, MessageCircle, Mail, Phone, MapPin, RefreshCw } from 'lucide-react';
import { useSiteConfig } from '../hooks/useSiteConfig';

const SiteConfigPanel = () => {
  const { config, loading, error, updateSocialMedia, updateBanner, toggleBanner, updateConfig } = useSiteConfig();
  
  const [activeTab, setActiveTab] = useState('banners');
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para redes sociales
  const [socialData, setSocialData] = useState({
    facebook: '',
    instagram: '',
    whatsapp: '',
    email: '',
    phone: ''
  });
  
  // Estados para banners
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    link: '',
    active: true
  });
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  // Banners por defecto si no existen
  const defaultBanners = [
    { id: 1, imageUrl: '', title: 'Banner 1', link: '', active: true, order: 1 },
    { id: 2, imageUrl: '', title: 'Banner 2', link: '', active: true, order: 2 },
    { id: 3, imageUrl: '', title: 'Banner 3', link: '', active: true, order: 3 }
  ];

  // Cargar datos cuando la configuración esté lista
  useEffect(() => {
    if (config) {
      if (config.socialMedia) {
        setSocialData(config.socialMedia);
      }
    }
  }, [config]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Manejar cambios en redes sociales
  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setSocialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar redes sociales
  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const result = await updateSocialMedia(socialData);
    
    if (result.success) {
      showNotification('Redes sociales actualizadas exitosamente');
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
    
    setIsSaving(false);
  };

  // Manejar imagen de banner
  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño
      if (file.size > 2 * 1024 * 1024) {
        showNotification('La imagen debe ser menor a 2MB', 'error');
        return;
      }
      
      setBannerImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Editar banner
  const handleEditBanner = (banner) => {
    setSelectedBanner(banner);
    setBannerForm({
      title: banner.title,
      link: banner.link || '',
      active: banner.active
    });
    setBannerPreview(banner.imageUrl || '');
    setBannerImage(null);
  };

  // Guardar banner
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!selectedBanner) return;
    
    setIsSaving(true);
    
    const result = await updateBanner(
      selectedBanner.id,
      bannerForm,
      bannerImage
    );
    
    if (result.success) {
      showNotification('Banner actualizado exitosamente');
      setSelectedBanner(null);
      setBannerForm({ title: '', link: '', active: true });
      setBannerImage(null);
      setBannerPreview('');
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
    
    setIsSaving(false);
  };

  // Activar/Desactivar banner
  const handleToggleBanner = async (bannerId, currentState) => {
    const result = await toggleBanner(bannerId, !currentState);
    
    if (result.success) {
      showNotification(`Banner ${!currentState ? 'activado' : 'desactivado'} exitosamente`);
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-rosa-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-red-800">Error al cargar configuración: {error}</p>
        </div>
      </div>
    );
  }

  // Usar banners de la config o los por defecto
  const banners = config?.banners || defaultBanners;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-400' : 
          'bg-red-100 text-red-800 border border-red-400'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración del Sitio</h1>
        <p className="text-gray-600">Gestiona los banners, redes sociales y configuración general</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'banners'
                ? 'border-rosa-secondary text-rosa-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Banners del Carrusel
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? 'border-rosa-secondary text-rosa-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Redes Sociales
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'banners' && (
        <div>
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📸 Especificaciones de imagen:</strong><br />
              • Tamaño recomendado: 1920x600px (Desktop), 768x500px (Mobile)<br />
              • Formato: JPG, PNG o WebP<br />
              • Peso máximo: 2MB<br />
              • Los banners se muestran en orden en un carrusel automático
            </p>
          </div>

          {/* Banners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                {/* Banner Image */}
                <div className="relative h-40 bg-gradient-to-br from-rosa-light to-rosa-primary">
                  {banner.imageUrl ? (
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-rosa-secondary mx-auto mb-2" />
                        <p className="text-rosa-dark text-sm">Sin imagen</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      banner.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {banner.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{banner.title}</h3>
                  {banner.link && (
                    <p className="text-sm text-gray-600 mb-3 truncate">
                      🔗 {banner.link}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditBanner(banner)}
                      className="flex-1 bg-rosa-secondary text-white px-3 py-2 rounded text-sm hover:bg-rosa-dark transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleBanner(banner.id, banner.active)}
                      className={`p-2 rounded ${
                        banner.active 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={banner.active ? 'Desactivar' : 'Activar'}
                    >
                      {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Editor de Banner (Modal) */}
          {selectedBanner && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Editar {selectedBanner.title}</h3>
                
                <form onSubmit={handleSaveBanner} className="space-y-4">
                  {/* Vista previa actual */}
                  {bannerPreview && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa</label>
                      <img 
                        src={bannerPreview} 
                        alt="Preview" 
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Subir nueva imagen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Imagen {!bannerPreview && '(Requerida)'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageChange}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tamaño recomendado: 1920x600px • Máximo 2MB
                    </p>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isSaving}
                    />
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link (opcional)
                    </label>
                    <input
                      type="url"
                      value={bannerForm.link}
                      onChange={(e) => setBannerForm({...bannerForm, link: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="https://..."
                      disabled={isSaving}
                    />
                  </div>

                  {/* Activo */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bannerForm.active}
                      onChange={(e) => setBannerForm({...bannerForm, active: e.target.checked})}
                      className="w-4 h-4 text-rosa-secondary border-gray-300 rounded"
                      disabled={isSaving}
                    />
                    <label className="ml-2 text-sm text-gray-700">Banner activo</label>
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-rosa-secondary text-white py-2 rounded-lg hover:bg-rosa-dark transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBanner(null);
                        setBannerForm({ title: '', link: '', active: true });
                        setBannerPreview('');
                        setBannerImage(null);
                      }}
                      disabled={isSaving}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Redes Sociales */}
      {activeTab === 'social' && (
        <div>
          <form onSubmit={handleSaveSocial} className="space-y-6">
            {/* Facebook */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Facebook className="w-5 h-5 mr-2 text-blue-600" />
                Facebook
              </label>
              <input
                type="url"
                name="facebook"
                value={socialData.facebook}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="https://facebook.com/rosaolivajoyeria"
                disabled={isSaving}
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                Instagram
              </label>
              <input
                type="url"
                name="instagram"
                value={socialData.instagram}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="https://instagram.com/rosaolivajoyeria"
                disabled={isSaving}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                WhatsApp
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={socialData.whatsapp}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="+52 951 123 4567"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">Incluye código de país (ej: +52)</p>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-5 h-5 mr-2 text-gray-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={socialData.email}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="info@rosaolivajoyeria.com"
                disabled={isSaving}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-5 h-5 mr-2 text-gray-600" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={socialData.phone}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="+52 951 XXX XXXX"
                disabled={isSaving}
              />
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-rosa-secondary text-white px-6 py-3 rounded-lg hover:bg-rosa-dark transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SiteConfigPanel;