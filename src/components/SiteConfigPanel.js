// src/components/SiteConfigPanel.js
import React, { useState } from 'react';
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

  // Cargar datos cuando la configuración esté lista
  React.useEffect(() => {
    if (config && config.socialMedia) {
      setSocialData(config.socialMedia);
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
            {config?.banners?.map((banner) => (
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
                      <Upload className="w-12 h-12 text-rosa-secondary" />
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
                      {banner.active ? <EyeOff className="w-4 h-4"