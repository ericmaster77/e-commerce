// src/services/storageService.js
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
      
      console.log(`✅ Imagen subida exitosamente: ${downloadURL}`);
      
      return { 
        success: true, 
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.totalBytes
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
      
      const snapshot = await uploadBytes(imageRef, blob, {
        contentType: blob.type,
        customMetadata: {
          productId: productId.toString(),
          uploadedAt: new Date().toISOString(),
          source: 'excel_embedded'
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`✅ Imagen desde blob subida: ${downloadURL}`);
      
      return { 
        success: true, 
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.totalBytes
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
    const batchSize = 5; // Subir de 5 en 5 para no saturar
    
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
      
      // Pausa entre lotes
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
      if (!imageUrl || imageUrl.includes('placeholder')) {
        return { success: true }; // No hay nada que eliminar
      }

      // Extraer path de la URL de Firebase Storage
      const path = this.extractPathFromUrl(imageUrl);
      if (path) {
        return await this.deleteImage(path);
      }
      
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
      // Para URLs de Firebase Storage
      if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/o\/(.+?)\?/);
        return match ? decodeURIComponent(match[1]) : null;
      }
      return null;
    } catch (error) {
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
        // Calcular nuevas dimensiones manteniendo proporción
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
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob
        canvas.toBlob(resolve, blob.type, quality);
      };
      
      img.src = URL.createObjectURL(blob);
    });
  }
};