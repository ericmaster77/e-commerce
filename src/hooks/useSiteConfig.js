// src/hooks/useSiteConfig.js - ACTUALIZADO PARA FIRESTORE
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook para obtener solo los banners ACTIVOS
 * Este es el hook que usa BannerCarousel
 */
export const useActiveBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Query para obtener solo banners activos, ordenados por 'order'
      const bannersRef = collection(db, 'banners');
      const q = query(
        bannersRef,
        where('active', '==', true),
        orderBy('order', 'asc')
      );

      // Listener en tiempo real
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const bannersData = [];
          snapshot.forEach((doc) => {
            bannersData.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          console.log('✅ Banners activos cargados:', bannersData.length);
          setBanners(bannersData);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Error cargando banners:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      // Cleanup
      return () => unsubscribe();
    } catch (error) {
      console.error('❌ Error configurando listener de banners:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  return { banners, loading, error };
};

/**
 * Hook principal para toda la configuración del sitio
 * Incluye banners, redes sociales, etc.
 */
export const useSiteConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Listener para el documento principal de configuración
      const configRef = doc(db, 'siteConfig', 'main');
      
      const unsubscribe = onSnapshot(
        configRef,
        (doc) => {
          if (doc.exists()) {
            setConfig({
              id: doc.id,
              ...doc.data()
            });
            console.log('✅ Configuración del sitio cargada');
          } else {
            console.warn('⚠️ No existe documento de configuración');
            setConfig({});
          }
          setLoading(false);
        },
        (error) => {
          console.error('❌ Error cargando configuración:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('❌ Error configurando listener de config:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar redes sociales
   */
  const updateSocialMedia = async (socialData) => {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      await updateDoc(configRef, {
        socialMedia: socialData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Redes sociales actualizadas');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando redes sociales:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar banner (legacy - para mantener compatibilidad)
   * Nota: Ahora usamos el flujo de crear/eliminar banners directamente
   */
  const updateBanner = async (bannerId, bannerData, imageFile) => {
    try {
      // Esta función ya no se usa con el nuevo sistema
      // Los banners se crean/actualizan directamente en SiteConfigPanel
      console.warn('⚠️ updateBanner es legacy, usar SiteConfigPanel directamente');
      return { success: false, error: 'Función deprecada' };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Toggle banner activo/inactivo (legacy - para mantener compatibilidad)
   */
  const toggleBanner = async (bannerId, newState) => {
    try {
      const bannerRef = doc(db, 'banners', bannerId);
      await updateDoc(bannerRef, {
        active: newState,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Banner ${bannerId} ${newState ? 'activado' : 'desactivado'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error toggling banner:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar configuración general
   */
  const updateConfig = async (configData) => {
    try {
      const configRef = doc(db, 'siteConfig', 'main');
      await updateDoc(configRef, {
        ...configData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Configuración actualizada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    config,
    loading,
    error,
    updateSocialMedia,
    updateBanner,
    toggleBanner,
    updateConfig
  };
};

export default useSiteConfig;