// src/hooks/useSiteConfig.js
import { useState, useEffect } from 'react';
import { siteConfigService } from '../services/siteConfigService';

export const useSiteConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const result = await siteConfigService.getSiteConfig();
    
    if (result.success) {
      setConfig(result.config);
      setError(null);
    } else {
      setError(result.error);
      setConfig(siteConfigService.getDefaultConfig());
    }
    
    setLoading(false);
  };

  const updateConfig = async (updates) => {
    const result = await siteConfigService.updateSiteConfig(updates);
    if (result.success) {
      await loadConfig();
    }
    return result;
  };

  const updateSocialMedia = async (socialMediaData) => {
    const result = await siteConfigService.updateSocialMedia(socialMediaData);
    if (result.success) {
      await loadConfig();
    }
    return result;
  };

  const updateBanner = async (bannerId, bannerData, imageFile) => {
    const result = await siteConfigService.updateBanner(bannerId, bannerData, imageFile);
    if (result.success) {
      await loadConfig();
    }
    return result;
  };

  const toggleBanner = async (bannerId, active) => {
    const result = await siteConfigService.toggleBanner(bannerId, active);
    if (result.success) {
      await loadConfig();
    }
    return result;
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    updateSocialMedia,
    updateBanner,
    toggleBanner,
    refreshConfig: loadConfig
  };
};

// Hook para obtener solo los banners activos (frontend)
export const useActiveBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    const result = await siteConfigService.getActiveBanners();
    
    if (result.success) {
      setBanners(result.banners);
    }
    
    setLoading(false);
  };

  return {
    banners,
    loading,
    refreshBanners: loadBanners
  };
};