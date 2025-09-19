import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const authService = {
  // Registro con perfil de usuario
  async register(email, password, displayName = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar perfil con nombre
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Crear documento de usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        isAdmin: this.checkAdminEmail(user.email),
        membershipType: 'free', // free, socio
        membershipExpiry: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profile: {
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        },
        preferences: {
          newsletter: true,
          notifications: true
        }
      });

      // Enviar email de verificación
      await sendEmailVerification(user);

      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName || email.split('@')[0],
          isAdmin: this.checkAdminEmail(user.email),
          emailVerified: user.emailVerified
        },
        message: 'Cuenta creada exitosamente. Por favor verifica tu email.'
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: this.getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Login
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        isAdmin: this.checkAdminEmail(user.email),
        emailVerified: user.emailVerified
      };

      if (userDoc.exists()) {
        const firestoreData = userDoc.data();
        userData = {
          ...userData,
          ...firestoreData,
          isAdmin: firestoreData.isAdmin || this.checkAdminEmail(user.email)
        };
      }

      return { 
        success: true, 
        user: userData,
        message: 'Inicio de sesión exitoso'
      };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: this.getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { 
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error) {
      console.error('Error en logout:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Observar cambios de autenticación
  onAuthChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado, obtener datos completos
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            isAdmin: this.checkAdminEmail(firebaseUser.email),
            emailVerified: firebaseUser.emailVerified
          };

          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            userData = {
              ...userData,
              ...firestoreData,
              isAdmin: firestoreData.isAdmin || this.checkAdminEmail(firebaseUser.email)
            };
          }

          callback(userData);
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          // Fallback a datos básicos de Firebase Auth
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            isAdmin: this.checkAdminEmail(firebaseUser.email),
            emailVerified: firebaseUser.emailVerified
          });
        }
      } else {
        // Usuario no autenticado
        callback(null);
      }
    });
  },

  // Recuperar contraseña
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.'
      };
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Actualizar perfil de usuario
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: 'Perfil actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verificar si el email es de administrador
  checkAdminEmail(email) {
    const adminEmails = [
      'admin@rosaolivajoyeria.com',
      'gerencia@rosaolivajoyeria.com',
      'admin@gmail.com' // Para desarrollo
    ];
    return adminEmails.includes(email.toLowerCase());
  },

  // Obtener usuario actual
  getCurrentUser() {
    return auth.currentUser;
  },

  // Verificar si hay usuario autenticado
  isAuthenticated() {
    return !!auth.currentUser;
  },

  // Reenviar email de verificación
  async resendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return {
          success: true,
          message: 'Email de verificación reenviado'
        };
      } else {
        return {
          success: false,
          error: 'No hay usuario autenticado'
        };
      }
    } catch (error) {
      console.error('Error al reenviar verificación:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Obtener mensajes de error amigables
  getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No existe una cuenta con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/network-request-failed': 'Error de conexión. Revisa tu internet',
    };

    return errorMessages[errorCode] || 'Error desconocido. Intenta nuevamente.';
  },

  // Funciones para membresías (implementar después)
  async updateMembership(userId, membershipType, expiryDate) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        membershipType,
        membershipExpiry: expiryDate,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: 'Membresía actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar membresía:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verificar estado de membresía
  async checkMembershipStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const now = new Date();
        const expiry = userData.membershipExpiry?.toDate();
        
        return {
          success: true,
          membershipType: userData.membershipType || 'free',
          isActive: !expiry || expiry > now,
          expiryDate: expiry
        };
      } else {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }
    } catch (error) {
      console.error('Error al verificar membresía:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};