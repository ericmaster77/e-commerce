// src/hooks/useConnectionSpeed.js - Detectar velocidad de conexión

import { useState, useEffect } from 'react';

export const useConnectionSpeed = () => {
  const [connectionSpeed, setConnectionSpeed] = useState('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [userPreference, setUserPreference] = useState(() => {
    // Cargar preferencia guardada
    return localStorage.getItem('video-preference') || 'auto';
  });

  useEffect(() => {
    // Detectar tipo de conexión usando Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(effectiveType);

        // Considerar conexiones 2g y slow-2g como lentas
        const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';
        setIsSlowConnection(isSlow);

        console.log('🌐 Tipo de conexión:', effectiveType);
        console.log('🐌 Conexión lenta:', isSlow);
      };

      updateConnectionInfo();

      // Escuchar cambios en la conexión
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    } else {
      // Si no hay API de conexión, asumir conexión normal
      console.log('⚠️ Network Information API no disponible');
      setConnectionSpeed('unknown');
      setIsSlowConnection(false);
    }
  }, []);

  const shouldShowVideo = () => {
    if (userPreference === 'always') return true;
    if (userPreference === 'never') return false;
    // Auto: mostrar video solo si NO es conexión lenta
    return !isSlowConnection;
  };

  const setVideoPreference = (preference) => {
    setUserPreference(preference);
    localStorage.setItem('video-preference', preference);
  };

  return {
    connectionSpeed,
    isSlowConnection,
    shouldShowVideo: shouldShowVideo(),
    userPreference,
    setVideoPreference,
    hasConnectionAPI: !!(navigator.connection || navigator.mozConnection || navigator.webkitConnection)
  };
};

export default useConnectionSpeed;