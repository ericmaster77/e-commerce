// src/components/SiteConfigPanel.js - VERSIÓN COMPLETA CON UPLOAD DE BANNERS
import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff, AlertCircle, Facebook, Instagram, MessageCircle, Mail, Phone, RefreshCw, Plus, Trash2, Film, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { useTheme } from '../contexts/ThemeContext';

const SiteConfigPanel = () => {
  const { config, loading: configLoading, error: configError, updateSocialMedia } = useSiteConfig();
  const { classes, isMinimal } = useTheme();
  
  const [activeTab, setActiveTab] = useState('banners');
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para redes sociales
  const [socialData, setSocialData] = useState({
    facebook: '',
    instagram: '',
    whatsapp: '',
    email: '',
    contactEmail: '',
    phone: ''
  });
  
  // Estados para banners
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Cargar datos cuando la configuración esté lista
  useEffect(() => {
    if (config?.socialMedia) {
      setSocialData(config.socialMedia);
    }
  }, [config]);

  // Cargar banners
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const bannersRef = collection(db, 'banners');
      const q = query(bannersRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const bannersData = [];
      querySnapshot.forEach((doc) => {
        bannersData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📋 Banners cargados:', bannersData.length);
      setBanners(bannersData);
    } catch (error) {
      console.error('Error cargando banners:', error);
      showNotification('Error al cargar banners', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleToggleActive = async (bannerId, currentStatus) => {
    try {
      const bannerRef = doc(db, 'banners', bannerId);
      await updateDoc(bannerRef, {
        active: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Banner ${bannerId} ${!currentStatus ? 'activado' : 'desactivado'}`);
      showNotification(`Banner ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      loadBanners();
    } catch (error) {
      console.error('Error actualizando banner:', error);
      showNotification('Error al actualizar banner', 'error');
    }
  };

  const handleDeleteBanner = async (bannerId, imageUrl, videoUrl) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) {
      return;
    }

    try {
      // Eliminar archivos de Storage
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log('🗑️ Imagen eliminada de Storage');
        } catch (error) {
          console.warn('No se pudo eliminar la imagen:', error);
        }
      }

      if (videoUrl) {
        try {
          const videoRef = ref(storage, videoUrl);
          await deleteObject(videoRef);
          console.log('🗑️ Video eliminado de Storage');
        } catch (error) {
          console.warn('No se pudo eliminar el video:', error);
        }
      }

      // Eliminar documento de Firestore
      await deleteDoc(doc(db, 'banners', bannerId));
      console.log('✅ Banner eliminado de Firestore');
      
      showNotification('Banner eliminado exitosamente');
      loadBanners();
    } catch (error) {
      console.error('Error eliminando banner:', error);
      showNotification('Error al eliminar banner', 'error');
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    loadBanners();
    showNotification('Banner creado exitosamente');
  };

  if (configLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className={`w-12 h-12 ${isMinimal ? 'text-gray-900' : 'text-rosa-secondary'} animate-spin mx-auto mb-4`} />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-red-800">Error al cargar configuración: {configError}</p>
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
                ? `${isMinimal ? 'border-gray-900 text-gray-900' : 'border-rosa-secondary text-rosa-secondary'}`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Banners del Carrusel
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? `${isMinimal ? 'border-gray-900 text-gray-900' : 'border-rosa-secondary text-rosa-secondary'}`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Redes Sociales
          </button>
        </nav>
      </div>

      {/* Tab Content: Banners */}
      {activeTab === 'banners' && (
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Banners</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Crea y administra los banners del carrusel principal. Soporta imágenes y videos.
                </p>
              </div>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                  isMinimal 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'bg-rosa-secondary text-white hover:bg-rosa-dark'
                }`}
              >
                {showUploadForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {showUploadForm ? 'Cancelar' : 'Nuevo Banner'}
              </button>
            </div>

            {showUploadForm && (
              <div className="mb-6">
                <BannerUploadForm 
                  onSuccess={handleUploadSuccess}
                  onCancel={() => setShowUploadForm(false)}
                />
              </div>
            )}

            {/* Lista de Banners */}
            {banners.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay banners configurados
                </h3>
                <p className="text-gray-500">
                  Haz clic en "Nuevo Banner" para crear tu primer banner
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className={`border rounded-lg p-4 transition-all ${
                      banner.active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {banner.mediaType === 'video' ? (
                          <div className="relative w-full h-full">
                            <img
                              src={banner.thumbnailUrl || banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Film className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {banner.title || 'Sin título'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {banner.description || 'Sin descripción'}
                            </p>
                            {banner.link && (
                              <a
                                href={banner.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                🔗 {banner.link}
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              banner.mediaType === 'video'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {banner.mediaType === 'video' ? '🎥 Video' : '🖼️ Imagen'}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              Orden: {banner.order}
                            </span>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 mb-3">
                          Creado: {banner.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(banner.id, banner.active)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              banner.active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {banner.active ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Activar
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(
                              banner.id, 
                              banner.imageUrl, 
                              banner.videoUrl
                            )}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Redes Sociales */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
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
            {/* Email de Contacto */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Email de Contacto (Quejas y Sugerencias)
              </label>
              <input
                type="email"
                name="contactEmail"
                value={socialData.contactEmail}
                onChange={handleSocialChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-secondary"
                placeholder="arturounda21@gmail.com"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-2">
                Este email recibirá los mensajes del formulario de contacto.
              </p>
            </div>
            {/* Botón guardar */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center font-semibold ${
                  isMinimal 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'bg-rosa-secondary text-white hover:bg-rosa-dark'
                }`}
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

// ✅ Componente BannerUploadForm integrado
const BannerUploadForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    type: 'image',
    active: true,
    order: 0
  });
  
  const [files, setFiles] = useState({
    media: null,
    thumbnail: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const { isMinimal } = useTheme();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === 'media') {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        
        const isImage = validImageTypes.includes(file.type);
        const isVideo = validVideoTypes.includes(file.type);
        
        if (!isImage && !isVideo) {
          setError('Formato no válido. Use: JPG, PNG, WebP, GIF, MP4, WebM, OGG');
          return;
        }

        const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
          setError(`Archivo muy grande. Máximo: ${isVideo ? '50MB' : '5MB'}`);
          return;
        }

        setFormData(prev => ({
          ...prev,
          type: isVideo ? 'video' : 'image'
        }));
      }
      
      setFiles(prev => ({ ...prev, [fileType]: file }));
      setError('');
    }
  };

  const uploadFile = async (file, path) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      if (!files.media) {
        throw new Error('Debes seleccionar un archivo');
      }

      if (formData.type === 'video' && !files.thumbnail) {
        throw new Error('Los videos requieren un thumbnail');
      }

      const timestamp = Date.now();
      
      const mediaPath = `banners/${formData.type}s/${timestamp}_${files.media.name}`;
      const mediaUrl = await uploadFile(files.media, mediaPath);

      let thumbnailUrl = null;
      if (formData.type === 'video' && files.thumbnail) {
        const thumbnailPath = `banners/thumbnails/${timestamp}_${files.thumbnail.name}`;
        thumbnailUrl = await uploadFile(files.thumbnail, thumbnailPath);
      }

      const bannerData = {
        title: formData.title || 'Banner sin título',
        description: formData.description || '',
        link: formData.link || '',
        imageUrl: formData.type === 'video' ? thumbnailUrl : mediaUrl,
        mediaType: formData.type,
        active: formData.active,
        order: parseInt(formData.order) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (formData.type === 'video') {
        bannerData.videoUrl = mediaUrl;
        bannerData.thumbnailUrl = thumbnailUrl;
      }

      const bannersRef = collection(db, 'banners');
      await addDoc(bannersRef, bannerData);
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error subiendo banner:', error);
      setError(error.message || 'Error al subir el banner');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'image' }))}
          className={`p-4 border-2 rounded-lg transition-all ${
            formData.type === 'image'
              ? isMinimal ? 'border-gray-900 bg-gray-100' : 'border-rosa-secondary bg-rosa-light'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Imagen</div>
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
          className={`p-4 border-2 rounded-lg transition-all ${
            formData.type === 'video'
              ? isMinimal ? 'border-gray-900 bg-gray-100' : 'border-rosa-secondary bg-rosa-light'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Film className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Video</div>
        </button>
      </div>

      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        placeholder="Título del banner"
        className="w-full p-3 border border-gray-300 rounded-lg"
      />

      <textarea
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Descripción (opcional)"
        rows={2}
        className="w-full p-3 border border-gray-300 rounded-lg"
      />

      <input
        type="url"
        name="link"
        value={formData.link}
        onChange={handleInputChange}
        placeholder="Link (opcional)"
        className="w-full p-3 border border-gray-300 rounded-lg"
      />

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept={formData.type === 'video' ? 'video/*' : 'image/*'}
          onChange={(e) => handleFileChange(e, 'media')}
          className="hidden"
          id="media-upload"
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">
            {files.media ? `✅ ${files.media.name}` : `Subir ${formData.type === 'video' ? 'video' : 'imagen'}`}
          </p>
        </label>
      </div>

      {formData.type === 'video' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'thumbnail')}
            className="hidden"
            id="thumbnail-upload"
          />
          <label htmlFor="thumbnail-upload" className="cursor-pointer">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {files.thumbnail ? `✅ ${files.thumbnail.name}` : 'Subir thumbnail *'}
            </p>
          </label>
        </div>
      )}

      <input
        type="number"
        name="order"
        value={formData.order}
        onChange={handleInputChange}
        placeholder="Orden (0 = primero)"
        className="w-full p-3 border border-gray-300 rounded-lg"
        min="0"
      />

      <label className="flex items-center">
        <input
          type="checkbox"
          name="active"
          checked={formData.active}
          onChange={handleInputChange}
          className="mr-2"
        />
        Banner activo
      </label>

      {uploading && (
        <div>
          <div className="text-sm mb-2">Subiendo... {Math.round(progress)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isMinimal ? 'bg-gray-900' : 'bg-rosa-secondary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={uploading}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
            isMinimal 
              ? 'bg-gray-900 text-white hover:bg-gray-800' 
              : 'bg-rosa-secondary text-white hover:bg-rosa-dark'
          }`}
        >
          {uploading ? 'Subiendo...' : 'Guardar Banner'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default SiteConfigPanel;