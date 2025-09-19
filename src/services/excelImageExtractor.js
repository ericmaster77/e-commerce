// src/services/excelImageExtractor.js
// NOTA: Necesitas instalar ExcelJS: npm install exceljs

import ExcelJS from 'exceljs';

export const excelImageExtractor = {
  // Extraer todas las imágenes embebidas del Excel
  async extractImagesFromExcel(file) {
    try {
      console.log('🔍 Extrayendo imágenes del archivo Excel...');
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.worksheets[0];
      const images = [];
      const imageMap = new Map(); // Para relacionar imágenes con filas
      
      // Buscar todas las imágenes en la hoja
      worksheet.getImages().forEach((image, index) => {
        try {
          const imageData = workbook.model.media[image.imageId];
          
          if (imageData) {
            // Crear blob de la imagen
            const blob = new Blob([imageData.buffer], { 
              type: `image/${imageData.extension}` 
            });
            
            // Obtener información de posición de la imagen
            const range = image.range;
            const topLeftRow = range.tl.row + 1; // +1 porque ExcelJS usa índice 0
            
            console.log(`📸 Imagen ${index + 1} encontrada en fila aproximada ${topLeftRow}`);
            
            images.push({
              blob,
              extension: imageData.extension,
              size: imageData.buffer.length,
              row: topLeftRow,
              name: `image_${index + 1}.${imageData.extension}`
            });
            
            // Mapear imagen a fila (aproximado)
            imageMap.set(topLeftRow, blob);
          }
        } catch (error) {
          console.warn(`⚠️ Error procesando imagen ${index + 1}:`, error);
        }
      });
      
      console.log(`✅ ${images.length} imágenes extraídas del Excel`);
      
      return {
        success: true,
        images,
        imageMap
      };
    } catch (error) {
      console.error('❌ Error extrayendo imágenes del Excel:', error);
      return {
        success: false,
        error: error.message,
        images: [],
        imageMap: new Map()
      };
    }
  },

  // Relacionar imágenes con productos basado en posición
  async matchImagesWithProducts(file, maxRows = 1000) {
    try {
      console.log('🔗 Relacionando imágenes con productos...');
      
      // Extraer datos de productos con XLSX (más confiable para datos)
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer());
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: "",
        range: maxRows 
      });
      
      // Extraer imágenes con ExcelJS
      const { images, imageMap } = await this.extractImagesFromExcel(file);
      
      // Relacionar productos con imágenes
      const productsWithImages = rawData.map((row, index) => {
        const rowNumber = index + 2; // +2 porque empezamos en fila 2 (después del header)
        
        // Buscar imagen más cercana a esta fila
        let closestImage = null;
        let minDistance = Infinity;
        
        for (const image of images) {
          const distance = Math.abs(image.row - rowNumber);
          if (distance < minDistance && distance <= 3) { // Máximo 3 filas de diferencia
            minDistance = distance;
            closestImage = image;
          }
        }
        
        return {
          productData: row,
          imageBlob: closestImage?.blob || null,
          imageName: closestImage?.name || null,
          rowNumber,
          imageDistance: minDistance === Infinity ? null : minDistance
        };
      });
      
      const withImages = productsWithImages.filter(p => p.imageBlob).length;
      console.log(`🎯 ${withImages}/${rawData.length} productos tienen imagen asociada`);
      
      return {
        success: true,
        productsWithImages,
        totalProducts: rawData.length,
        productsWithImage: withImages
      };
    } catch (error) {
      console.error('❌ Error relacionando imágenes con productos:', error);
      return {
        success: false,
        error: error.message,
        productsWithImages: []
      };
    }
  }
};

// Fallback: Extractor básico si ExcelJS no está disponible
export const basicImageExtractor = {
  // Método alternativo usando FileReader y detección manual
  async tryExtractImages(file) {
    try {
      console.log('🔄 Usando método alternativo para extraer imágenes...');
      
      // Leer archivo como ArrayBuffer
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Buscar signatures de archivos de imagen
      const images = [];
      const jpegSignature = [0xFF, 0xD8, 0xFF];
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      
      // Buscar JPEGs
      for (let i = 0; i < uint8Array.length - 10; i++) {
        if (this.matchesSignature(uint8Array, i, jpegSignature)) {
          const endIndex = this.findJpegEnd(uint8Array, i);
          if (endIndex > i) {
            const imageData = uint8Array.slice(i, endIndex);
            images.push({
              blob: new Blob([imageData], { type: 'image/jpeg' }),
              extension: 'jpg',
              size: imageData.length,
              position: i,
              name: `extracted_${images.length + 1}.jpg`
            });
          }
        }
      }
      
      // Buscar PNGs
      for (let i = 0; i < uint8Array.length - 10; i++) {
        if (this.matchesSignature(uint8Array, i, pngSignature)) {
          const endIndex = this.findPngEnd(uint8Array, i);
          if (endIndex > i) {
            const imageData = uint8Array.slice(i, endIndex);
            images.push({
              blob: new Blob([imageData], { type: 'image/png' }),
              extension: 'png',
              size: imageData.length,
              position: i,
              name: `extracted_${images.length + 1}.png`
            });
          }
        }
      }
      
      console.log(`📸 ${images.length} imágenes extraídas con método alternativo`);
      
      return {
        success: true,
        images
      };
    } catch (error) {
      console.error('❌ Error en extracción alternativa:', error);
      return {
        success: false,
        error: error.message,
        images: []
      };
    }
  },

  matchesSignature(data, offset, signature) {
    for (let i = 0; i < signature.length; i++) {
      if (data[offset + i] !== signature[i]) {
        return false;
      }
    }
    return true;
  },

  findJpegEnd(data, start) {
    for (let i = start + 2; i < data.length - 1; i++) {
      if (data[i] === 0xFF && data[i + 1] === 0xD9) {
        return i + 2;
      }
    }
    return -1;
  },

  findPngEnd(data, start) {
    // Buscar el chunk IEND del PNG
    const iendSignature = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
    for (let i = start + 8; i < data.length - 8; i++) {
      if (this.matchesSignature(data, i, iendSignature)) {
        return i + 8;
      }
    }
    return -1;
  }
};

// Servicio principal que combina ambos métodos
export const imageExtractionService = {
  async extractImages(file, preferredMethod = 'exceljs') {
    try {
      if (preferredMethod === 'exceljs') {
        try {
          // Intentar con ExcelJS primero
          const result = await excelImageExtractor.matchImagesWithProducts(file);
          if (result.success && result.productsWithImages.length > 0) {
            return result;
          }
        } catch (error) {
          console.warn('⚠️ ExcelJS no disponible, usando método alternativo:', error);
        }
      }
      
      // Fallback al método básico
      return await basicImageExtractor.tryExtractImages(file);
    } catch (error) {
      console.error('❌ Error en extracción de imágenes:', error);
      return {
        success: false,
        error: error.message,
        productsWithImages: []
      };
    }
  }
};