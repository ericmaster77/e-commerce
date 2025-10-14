// src/services/siteConfigService.js - CON SOPORTE DE VIDEO
import { db, storage } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const siteConfigService = {
  // Obtener configuración del sitio
  async getSiteConfig() {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        return {
          success: true,
          config: configDoc.data()
        };
      } else {
        return {
          success: true,
          config: this.getDefaultConfig()
        };
      }
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      return {
        success: false,
        error: error.message,
        config: this.getDefaultConfig()
      };
    }
  },

  // Configuración por defecto
  getDefaultConfig() {
    return {
      siteName: 'Rosa Oliva Joyería',
      siteDescription: 'Un Legado que Impulsa Nuevos Comienzos',
      
      socialMedia: {
        facebook: '',
        instagram: '',
        whatsapp: '',
        email: 'info@rosaolivajoyeria.com',
        phone: '+52 951 XXX XXXX'
      },
      
      banners: [
        {
          id: 1,
          imageUrl: '',
          mediaType: 'image', // 'image' o 'video'
          title: 'Banner 1',
          link: '',
          active: true,
          order: 1
        },
        {
          id: 2,
          imageUrl: '',
          mediaType: 'image',
          title: 'Banner 2',
          link: '',
          active: true,
          order: 2
        },
        {
          id: 3,
          imageUrl: '',
          mediaType: 'image',
          title: 'Banner 3',
          link: '',
          active: true,
          order: 3
        }
      ],
      
      contact: {
        address: 'Oaxaca, México',
        city: 'Oaxaca',
        state: 'Oaxaca',
        country: 'México',
        zipCode: ''
      },
      
      storeSettings: {
        showPricesPublic: true,
        allowGuestCheckout: false,
        maintenanceMode: false
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Actualizar configuración general
  async updateSiteConfig(updates) {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      
      await setDoc(configRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Configuración actualizada');
      
      return {
        success: true,
        message: 'Configuración actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Actualizar redes sociales
  async updateSocialMedia(socialMediaData) {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      
      await setDoc(configRef, {
        socialMedia: socialMediaData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Redes sociales actualizadas');
      
      return {
        success: true,
        message: 'Redes sociales actualizadas exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar redes sociales:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // ✅ ACTUALIZADO: Subir imagen o video de banner
  async uploadBannerMedia(file, bannerId) {
    try {
      console.log(`📤 Subiendo media para banner ${bannerId}...`);
      
      // ✅ Validar tipo de archivo (imagen o video)
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      const validTypes = [...imageTypes, ...videoTypes];
      
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF) o videos (MP4, WebM, OGG, MOV)'
        };
      }
      
      // ✅ Validar tamaño (máximo 50MB para videos, 5MB para imágenes)
      const isVideo = videoTypes.includes(file.type);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      
      if (file.size > maxSize) {
        const maxSizeMB = isVideo ? '50MB' : '5MB';
        return {
          success: false,
          error: `El archivo debe ser menor a ${maxSizeMB}`
        };
      }
      
      // Subir a Firebase Storage
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `banner_${bannerId}_${timestamp}.${extension}`;
      const storageRef = ref(storage, `banners/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          bannerId: bannerId.toString(),
          mediaType: isVideo ? 'video' : 'image',
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`✅ Media subida: ${downloadURL}`);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        mediaType: isVideo ? 'video' : 'image'
      };
    } catch (error) {
      console.error('Error al subir media:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // ✅ ACTUALIZADO: Actualizar banner con soporte de video
  async updateBanner(bannerId, bannerData, mediaFile = null) {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        await setDoc(configRef, this.getDefaultConfig());
      }
      
      const currentConfig = configDoc.data() || this.getDefaultConfig();
      let banners = [...(currentConfig.banners || [])];
      
      const bannerIndex = banners.findIndex(b => b.id === bannerId);
      
      if (bannerIndex === -1) {
        return {
          success: false,
          error: 'Banner no encontrado'
        };
      }
      
      // Si hay nuevo archivo (imagen o video), subirlo
      let mediaUrl = banners[bannerIndex].imageUrl;
      let mediaType = banners[bannerIndex].mediaType || 'image';
      
      if (mediaFile) {
        const uploadResult = await this.uploadBannerMedia(mediaFile, bannerId);
        if (uploadResult.success) {
          // Eliminar archivo anterior si existe
          if (mediaUrl && !mediaUrl.includes('placeholder')) {
            await this.deleteBannerMedia(mediaUrl);
          }
          mediaUrl = uploadResult.url;
          mediaType = uploadResult.mediaType;
        } else {
          return uploadResult;
        }
      }
      
      // Actualizar datos del banner
      banners[bannerIndex] = {
        ...banners[bannerIndex],
        ...bannerData,
        imageUrl: mediaUrl,
        mediaType: mediaType
      };
      
      // Guardar en Firestore
      await setDoc(configRef, {
        banners,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Banner ${bannerId} actualizado`);
      
      return {
        success: true,
        message: 'Banner actualizado exitosamente',
        banner: banners[bannerIndex]
      };
    } catch (error) {
      console.error('Error al actualizar banner:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Renombrado de función para consistencia
  async deleteBannerMedia(mediaUrl) {
    try {
      if (!mediaUrl || mediaUrl.includes('placeholder')) {
        return { success: true };
      }
      
      const match = mediaUrl.match(/o\/(.+?)\?/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        const mediaRef = ref(storage, path);
        await deleteObject(mediaRef);
        console.log(`🗑️ Media eliminada: ${path}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar media:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Activar/Desactivar banner
  async toggleBanner(bannerId, active) {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        return {
          success: false,
          error: 'Configuración no encontrada'
        };
      }
      
      const currentConfig = configDoc.data();
      let banners = [...(currentConfig.banners || [])];
      
      const bannerIndex = banners.findIndex(b => b.id === bannerId);
      if (bannerIndex === -1) {
        return {
          success: false,
          error: 'Banner no encontrado'
        };
      }
      
      banners[bannerIndex].active = active;
      
      await setDoc(configRef, {
        banners,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Banner ${bannerId} ${active ? 'activado' : 'desactivado'}`);
      
      return {
        success: true,
        message: `Banner ${active ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      console.error('Error al cambiar estado del banner:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Obtener solo banners activos (para el frontend)
  async getActiveBanners() {
    try {
      const config = await this.getSiteConfig();
      if (config.success) {
        const activeBanners = (config.config.banners || [])
          .filter(banner => banner.active && banner.imageUrl)
          .sort((a, b) => a.order - b.order);
        
        return {
          success: true,
          banners: activeBanners
        };
      }
      return config;
    } catch (error) {
      console.error('Error al obtener banners activos:', error);
      return {
        success: false,
        error: error.message,
        banners: []
      };
    }
  },

  // Inicializar configuración (usar solo una vez)
  async initializeSiteConfig() {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        await setDoc(configRef, {
          ...this.getDefaultConfig(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Configuración del sitio inicializada');
        
        return {
          success: true,
          message: 'Configuración inicializada exitosamente'
        };
      }
      
      return {
        success: false,
        message: 'La configuración ya existe'
      };
    } catch (error) {
      console.error('Error al inicializar configuración:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};