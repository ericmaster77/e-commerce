// src/services/bulkImportService.js - SIMPLIFICADO SIN IMÁGENES
import * as XLSX from 'xlsx';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const bulkImportService = {
  /**
   * Importa productos desde Excel SIN imágenes
   * Usa Firestore directamente, sin intermediarios
   * 
   * Lógica de precios:
   * - originalPrice = Precio Anaquel * 1.15 (+15%)
   * - price = Precio Anaquel
   * - discount = 15%
   */
  async importProductsFromExcel(file, options = {}) {
    try {
      console.log('🚀 Iniciando importación masiva...');
      
      const results = {
        successful: 0,
        failed: 0,
        errors: [],
        total: 0,
        skipped: 0
      };
      
      // 1. Leer archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      results.total = rawData.length;
      console.log(`✅ ${results.total} productos encontrados en Excel`);
      
      // 2. Procesar productos en lotes
      const batchSize = 5;
      const processedSkus = new Set();
      
      for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize);
        console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(rawData.length / batchSize)}`);
        
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const row = batch[batchIndex];
          const globalIndex = i + batchIndex;
          
          try {
            // Mapear producto
            const product = this.mapExcelRowToProduct(row, globalIndex + 1, options);
            
            if (!product) {
              results.failed++;
              results.skipped++;
              results.errors.push(`Producto ${globalIndex + 1}: Datos inválidos o incompletos`);
              continue;
            }
            
            // Verificar duplicados por SKU
            if (processedSkus.has(product.sku)) {
              console.warn(`⚠️ SKU duplicado omitido: ${product.sku}`);
              results.skipped++;
              continue;
            }
            processedSkus.add(product.sku);
            
            // ✅ Crear producto directamente en Firestore sin pasar por productService
            const docRef = await addDoc(collection(db, 'products'), {
              ...product,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            results.successful++;
            console.log(`✅ Producto ${globalIndex + 1}: ${product.name} - Creado (ID: ${docRef.id})`);
            
          } catch (error) {
            results.failed++;
            results.errors.push(`Producto ${globalIndex + 1}: ${error.message}`);
            console.error(`❌ Error procesando producto ${globalIndex + 1}:`, error);
          }
          
          // Pequeña pausa entre productos
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🎉 Importación completada:`);
      console.log(`   ✅ ${results.successful} productos exitosos`);
      console.log(`   ❌ ${results.failed} productos con errores`);
      console.log(`   ⏭️ ${results.skipped} productos omitidos`);
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('❌ Error en importación masiva:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Mapea una fila de Excel a un objeto producto
   * 
   * Lógica de precios:
   * - originalPrice = Precio Anaquel * 1.15 (15% más)
   * - price = Precio Anaquel (precio final de venta)
   * - discount = 15%
   */
  mapExcelRowToProduct(row, index, options = {}) {
    try {
      // Extraer datos del Excel
      const sku = row['SKU SHOW']?.toString().trim();
      const description = row['Description']?.toString().trim();
      const stock = parseInt(row['Cantidad']) || 0;
      const precioAnaquel = parseFloat(row['Precio Anaquel ']) || 0;
      
      // Validar datos obligatorios
      if (!sku || !description || precioAnaquel <= 0) {
        console.warn(`⚠️ Producto ${index} omitido - SKU: ${sku || 'N/A'}, Precio: ${precioAnaquel}`);
        return null;
      }
      
      // Parsear información del producto
      const productInfo = this.parseDescription(description);
      const category = this.determineCategory(productInfo.type, sku);
      const name = this.generateProductName(productInfo, sku);
      
      // Calcular precios
      const originalPrice = Math.round(precioAnaquel * 1.15);
      const price = Math.round(precioAnaquel);
      const discount = 15;
      
      // ✅ Crear objeto producto SIN campos que requieran validación
      const product = {
        name: name,
        sku: sku,
        description: this.generateDescription(productInfo, sku),
        category: category,
        
        // Precios simplificados
        originalPrice: originalPrice,
        price: price,
        discount: discount,
        
        stock: stock,
        
        // ✅ Imagen placeholder FIJA - SIN validación
        imageUrl: '/api/placeholder/300/300',
        hasRealImage: false,
        
        // Atributos del producto
        material: productInfo.material || 'Acero Inoxidable',
        color: productInfo.color || 'Dorado',
        size: productInfo.size || 'Único',
        
        // Configuración
        featured: options.markAsFeatured ? (index <= 10) : false,
        rating: 4.5,
        
        // Datos adicionales del Excel
        excel: {
          itemNo: row['Item No.'] || '',
          skuInt: row['SKU INT'] || '',
          skuProv: row['SKU PROV'] || '',
          lote: row['Lote'] || '',
          originalDescription: description,
          precioAnaquel: precioAnaquel
        }
      };
      
      return product;
      
    } catch (error) {
      console.error(`❌ Error mapeando producto ${index}:`, error);
      return null;
    }
  },

  /**
   * Parsea la descripción del Excel
   */
  parseDescription(description) {
    const info = {
      material: '',
      type: '',
      color: '',
      size: ''
    };
    
    if (!description) return info;
    
    const lines = description.split('\r\n').map(line => line.trim());
    
    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      
      // Detectar material
      if (lineLower.includes('stainless steel') || lineLower.includes('acero inoxidable')) {
        info.material = 'Acero Inoxidable';
      } else if (lineLower.includes('gold') || lineLower.includes('oro')) {
        info.material = 'Oro';
      } else if (lineLower.includes('silver') || lineLower.includes('plata')) {
        info.material = 'Plata';
      }
      
      // Extraer campos estructurados
      if (line.startsWith('Type:')) {
        info.type = line.replace('Type:', '').trim();
      } else if (line.startsWith('Color:')) {
        info.color = line.replace('Color:', '').trim();
      } else if (line.startsWith('Size:')) {
        info.size = line.replace('Size:', '').trim();
      }
    });
    
    return info;
  },

  /**
   * Determina la categoría del producto
   */
  determineCategory(type, sku) {
    const typeUpper = type?.toUpperCase() || '';
    const skuUpper = sku?.toUpperCase() || '';
    
    if (typeUpper.includes('BRACELET') || skuUpper.startsWith('BR')) {
      return 'Brazaletes';
    } else if (typeUpper.includes('RING') || skuUpper.startsWith('RI')) {
      return 'Anillos';
    } else if (typeUpper.includes('NECKLACE') || typeUpper.includes('COLLAR') || skuUpper.startsWith('CO')) {
      return 'Collares';
    } else if (typeUpper.includes('EARRING') || skuUpper.startsWith('AR')) {
      return 'Aretes';
    } else if (typeUpper.includes('CHAIN') || skuUpper.startsWith('PU')) {
      return 'Pulseras';
    } else {
      return 'Brazaletes';
    }
  },

  /**
   * Genera el nombre del producto
   */
  generateProductName(productInfo, sku) {
    const parts = [];
    
    // Tipo de producto
    if (productInfo.type) {
      const typeSpanish = this.translateType(productInfo.type);
      parts.push(typeSpanish);
    } else {
      // Determinar por SKU
      if (sku.startsWith('BR')) parts.push('Brazalete');
      else if (sku.startsWith('RI')) parts.push('Anillo');
      else if (sku.startsWith('CO')) parts.push('Collar');
      else if (sku.startsWith('AR')) parts.push('Aretes');
      else parts.push('Pulsera');
    }
    
    // Material
    if (productInfo.material) {
      parts.push(productInfo.material);
    }
    
    // Color
    if (productInfo.color && productInfo.color.toLowerCase().includes('18k')) {
      parts.push('Baño Oro 18k');
    } else if (productInfo.color) {
      parts.push(productInfo.color);
    }
    
    // SKU al final
    parts.push(`(${sku})`);
    
    return parts.join(' ');
  },

  /**
   * Traduce tipos de producto
   */
  translateType(type) {
    const translations = {
      'Bracelet': 'Brazalete',
      'Ring': 'Anillo', 
      'Necklace': 'Collar',
      'Earring': 'Aretes',
      'Chain': 'Pulsera',
      'Pendant': 'Dije'
    };
    
    return translations[type] || type;
  },

  /**
   * Genera descripción del producto
   */
  generateDescription(productInfo, sku) {
    const parts = [];
    
    parts.push('Joyería de alta calidad Rosa Oliva.');
    
    if (productInfo.material) {
      parts.push(`Elaborado en ${productInfo.material.toLowerCase()}.`);
    }
    
    if (productInfo.color && productInfo.color.toLowerCase().includes('18k')) {
      parts.push('Con elegante baño de oro 18k que garantiza durabilidad y brillo duradero.');
    }
    
    if (productInfo.size && productInfo.size !== 'Único') {
      parts.push(`Medida: ${productInfo.size}.`);
    }
    
    parts.push('Perfecto para uso diario o ocasiones especiales.');
    parts.push(`Código: ${sku}`);
    
    return parts.join(' ');
  },

  /**
   * Vista previa de importación
   */
  async previewImport(file, maxPreview = 5) {
    try {
      console.log('👀 Generando vista previa...');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      const previewData = rawData.slice(0, maxPreview);
      
      const preview = previewData.map((row, index) => {
        return this.mapExcelRowToProduct(row, index + 1);
      }).filter(product => product !== null);
      
      console.log(`✅ Vista previa generada: ${preview.length} productos válidos de ${rawData.length} totales`);
      
      return {
        success: true,
        preview,
        totalRows: rawData.length,
        validProducts: preview.length
      };
      
    } catch (error) {
      console.error('❌ Error generando vista previa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};