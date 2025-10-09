// src/services/storageService.js - VERSIÓN CORREGIDA COMPLETA
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageService = {
  // Subir imagen de producto desde archivo
  async uploadProductImage(file, productId) {
    try {
      // Crear referencia única para la imagen
      const timestamp = Date.now();
      const fileName = `${productId}_${timestamp}.${this.getFileExtension(file.name)}`;
      const imageRef = ref(storage, `products/${fileName}`);
      
      console.log(`📤 Subiendo imagen: ${fileName}`);
      console.log(`📏 Tamaño del archivo: ${file.size} bytes`);
      
      // Subir archivo
      const snapshot = await uploadBytes(imageRef, file, {
        contentType: file.type,
        customMetadata: {
          productId: productId.toString(),
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // ✅ SOLUCIÓN: Usar file.size directamente
      const fileSize = file.size || 0;
      
      console.log(`✅ Imagen subida exitosamente: ${downloadURL}`);
      console.log(`📏 Tamaño guardado: ${fileSize} bytes`);
      
      return { 
        success: true, 
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: fileSize  // ✅ GARANTIZADO que no es undefined
      };
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Subir imagen desde Blob (para imágenes extraídas del Excel)
  async uploadImageFromBlob(blob, productId, originalName = 'image') {
    try {
      const timestamp = Date.now();
      const extension = this.getBlobExtension(blob.type) || 'jpg';
      const fileName = `${productId}_${timestamp}_${originalName}.${extension}`;
      const imageRef = ref(storage, `products/${fileName}`);
      
      console.log(`📤 Subiendo imagen desde blob: ${fileName}`);
      console.log(`📏 Tamaño del blob: ${blob.size} bytes`);
      
      const snapshot = await uploadBytes(imageRef, blob, {
        contentType: blob.type,
        customMetadata: {
          productId: productId.toString(),
          uploadedAt: new Date().toISOString(),
          source: 'excel_embedded'
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // ✅ SOLUCIÓN: Usar blob.size directamente
      const blobSize = blob.size || 0;
      
      console.log(`✅ Imagen desde blob subida: ${downloadURL}`);
      console.log(`📏 Tamaño guardado: ${blobSize} bytes`);
      
      return { 
        success: true, 
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: blobSize  // ✅ GARANTIZADO que no es undefined
      };
    } catch (error) {
      console.error('❌ Error subiendo imagen desde blob:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Subir múltiples imágenes en lote
  async uploadMultipleImages(imageBlobs, productIds) {
    const results = [];
    const batchSize = 5;
    
    for (let i = 0; i < imageBlobs.length; i += batchSize) {
      const batch = imageBlobs.slice(i, i + batchSize);
      const batchProductIds = productIds.slice(i, i + batchSize);
      
      console.log(`📦 Subiendo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageBlobs.length / batchSize)}`);
      
      const batchPromises = batch.map((blob, index) => {
        if (blob) {
          return this.uploadImageFromBlob(blob, batchProductIds[index], `image_${i + index}`);
        } else {
          return Promise.resolve({ success: false, error: 'No image blob provided' });
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  },

  // Eliminar imagen
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      
      console.log(`🗑️ Imagen eliminada: ${imagePath}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Eliminar imagen por URL
  async deleteImageByUrl(imageUrl) {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.log('⚠️ URL de imagen inválida o vacía');
        return { success: true };
      }

      if (imageUrl.includes('placeholder') || imageUrl.includes('/api/')) {
        console.log('⚠️ Imagen placeholder, no se elimina');
        return { success: true };
      }

      const path = this.extractPathFromUrl(imageUrl);
      if (path) {
        console.log(`🔍 Path extraído: ${path}`);
        return await this.deleteImage(path);
      }
      
      console.log('⚠️ No se pudo extraer path de la URL');
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando imagen por URL:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Funciones auxiliares
  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  },

  getBlobExtension(mimeType) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    return extensions[mimeType] || 'jpg';
  },

  extractPathFromUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        console.warn('⚠️ URL no es un string válido:', url);
        return null;
      }

      if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/o\/(.+?)\?/);
        if (match) {
          const decodedPath = decodeURIComponent(match[1]);
          console.log(`🔍 Path decodificado: ${decodedPath}`);
          return decodedPath;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error extrayendo path:', error);
      return null;
    }
  },

  // Validar si el archivo es una imagen válida
  isValidImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return {
      isValid: validTypes.includes(file.type) && file.size <= maxSize,
      error: !validTypes.includes(file.type) 
        ? 'Tipo de archivo no válido. Use JPG, PNG, WebP o GIF.' 
        : file.size > maxSize 
        ? 'El archivo es muy grande. Máximo 10MB.'
        : null
    };
  },

  // Redimensionar imagen antes de subir (opcional)
  async resizeImage(blob, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, blob.type, quality);
      };
      
      img.src = URL.createObjectURL(blob);
    });
  }
};