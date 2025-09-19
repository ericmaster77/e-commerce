import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Configurar listener para cambios de autenticación
    const unsubscribe = authService.onAuthChange((user) => {
      setUser(user);
      setLoading(false);
      setAuthError(null);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      const result = await authService.login(email, password);
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el login';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName = '') => {
    try {
      setLoading(true);
      setAuthError(null);
      const result = await authService.register(email, password, displayName);
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el registro';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const result = await authService.logout();
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error durante el cierre de sesión';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      const result = await authService.resetPassword(email);
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error al enviar email de recuperación';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      setAuthError(null);
      const result = await authService.updateUserProfile(user.uid, updates);
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error al actualizar perfil';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setAuthError(null);
      const result = await authService.resendVerificationEmail();
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error al reenviar email de verificación';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const checkMembershipStatus = async () => {
    try {
      if (!user) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      const result = await authService.checkMembershipStatus(user.uid);
      return result;
    } catch (error) {
      return { success: false, error: 'Error al verificar membresía' };
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Funciones de utilidad
  const isAdmin = () => {
    return user?.isAdmin || false;
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isMember = () => {
    return user?.membershipType === 'socio' && user?.membershipExpiry && new Date(user.membershipExpiry) > new Date();
  };

  const value = {
    // Estado
    user,
    loading,
    authError,
    
    // Funciones de autenticación
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    resendVerificationEmail,
    
    // Funciones de membresía
    checkMembershipStatus,
    
    // Funciones de utilidad
    isAdmin,
    isAuthenticated,
    isMember,
    clearAuthError,
    
    // Información derivada
    userDisplayName: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
    userEmail: user?.email,
    userId: user?.uid,
    emailVerified: user?.emailVerified || false,
    membershipType: user?.membershipType || 'free'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};