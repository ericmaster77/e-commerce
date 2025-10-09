// src/services/siteConfigService.js
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
        // Retornar configuración por defecto si no existe
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
      
      // Redes sociales
      socialMedia: {
        facebook: '',
        instagram: '',
        whatsapp: '',
        email: 'info@rosaolivajoyeria.com',
        phone: '+52 951 XXX XXXX'
      },
      
      // Banners del carrusel (máximo 3)
      banners: [
        {
          id: 1,
          imageUrl: '',
          title: 'Banner 1',
          link: '',
          active: true,
          order: 1
        },
        {
          id: 2,
          imageUrl: '',
          title: 'Banner 2',
          link: '',
          active: true,
          order: 2
        },
        {
          id: 3,
          imageUrl: '',
          title: 'Banner 3',
          link: '',
          active: true,
          order: 3
        }
      ],
      
      // Información de contacto
      contact: {
        address: 'Oaxaca, México',
        city: 'Oaxaca',
        state: 'Oaxaca',
        country: 'México',
        zipCode: ''
      },
      
      // Configuración de la tienda
      storeSettings: {
        showPricesPublic: true,
        allowGuestCheckout: false,
        maintenanceMode: false
      },
      
      // Metadata
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

  // Subir imagen de banner
  async uploadBannerImage(file, bannerId) {
    try {
      console.log(`📤 Subiendo banner ${bannerId}...`);
      
      // Validar imagen
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Solo se permiten imágenes JPG, PNG o WebP'
        };
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return {
          success: false,
          error: 'La imagen debe ser menor a 2MB'
        };
      }
      
      // Subir a Firebase Storage
      const timestamp = Date.now();
      const fileName = `banner_${bannerId}_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `banners/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          bannerId: bannerId.toString(),
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`✅ Banner ${bannerId} subido: ${downloadURL}`);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error al subir banner:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Actualizar banner específico
  async updateBanner(bannerId, bannerData, imageFile = null) {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        // Crear configuración por defecto si no existe
        await setDoc(configRef, this.getDefaultConfig());
      }
      
      const currentConfig = configDoc.data() || this.getDefaultConfig();
      let banners = [...(currentConfig.banners || [])];
      
      // Encontrar el índice del banner
      const bannerIndex = banners.findIndex(b => b.id === bannerId);
      
      if (bannerIndex === -1) {
        return {
          success: false,
          error: 'Banner no encontrado'
        };
      }
      
      // Si hay nueva imagen, subirla
      let imageUrl = banners[bannerIndex].imageUrl;
      if (imageFile) {
        const uploadResult = await this.uploadBannerImage(imageFile, bannerId);
        if (uploadResult.success) {
          // Eliminar imagen anterior si existe
          if (imageUrl && !imageUrl.includes('placeholder')) {
            await this.deleteBannerImage(imageUrl);
          }
          imageUrl = uploadResult.url;
        } else {
          return uploadResult;
        }
      }
      
      // Actualizar datos del banner
      banners[bannerIndex] = {
        ...banners[bannerIndex],
        ...bannerData,
        imageUrl
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

  // Eliminar imagen de banner
  async deleteBannerImage(imageUrl) {
    try {
      if (!imageUrl || imageUrl.includes('placeholder')) {
        return { success: true };
      }
      
      // Extraer path de la URL
      const match = imageUrl.match(/o\/(.+?)\?/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
        console.log(`🗑️ Banner eliminado: ${path}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar banner:', error);
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