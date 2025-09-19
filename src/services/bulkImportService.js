// src/services/bulkImportService.js
import * as XLSX from 'xlsx';
import { productService } from './productService';
import { storageService } from './storageService';
import { imageExtractionService } from './excelImageExtractor';

export const bulkImportService = {
  // Función principal para importar productos desde Excel CON imágenes
  async importProductsFromExcel(file, options = {}) {
    try {
      console.log('🚀 Iniciando importación masiva con imágenes...');
      
      const results = {
        successful: 0,
        failed: 0,
        errors: [],
        total: 0,
        imagesProcessed: 0,
        imagesUploaded: 0
      };
      
      // 1. Extraer productos y sus imágenes asociadas
      console.log('📊 Extrayendo datos y relacionando con imágenes...');
      let productsWithImages = [];
      let hasImages = false;
      
      try {
        const imageResult = await imageExtractionService.extractImages(file);
        if (imageResult.success && imageResult.productsWithImages) {
          productsWithImages = imageResult.productsWithImages;
          hasImages = true;
          console.log(`📸 ${productsWithImages.filter(p => p.imageBlob).length} productos con imágenes encontrados`);
        }
      } catch (error) {
        console.warn('⚠️ No se pudieron extraer imágenes, continuando sin ellas:', error);
        // Continuar sin imágenes
        const workbook = XLSX.read(await file.arrayBuffer());
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        productsWithImages = rawData.map(row => ({
          productData: row,
          imageBlob: null,
          imageName: null,
          rowNumber: rawData.indexOf(row) + 2
        }));
      }
      
      results.total = productsWithImages.length;
      console.log(`✅ ${results.total} productos encontrados en Excel`);
      
      // 2. Procesar productos en lotes
      const batchSize = hasImages ? 5 : 10; // Lotes más pequeños si hay imágenes
      
      for (let i = 0; i < productsWithImages.length; i += batchSize) {
        const batch = productsWithImages.slice(i, i + batchSize);
        console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsWithImages.length / batchSize)}`);
        
        await Promise.all(batch.map(async (item, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            // Convertir datos de Excel al formato Firebase
            const product = this.mapExcelRowToProduct(item.productData, globalIndex + 1, options);
            
            if (!product) {
              results.failed++;
              results.errors.push(`Producto ${globalIndex + 1}: Datos inválidos`);
              return;
            }
            
            // Subir imagen si existe
            let imageUrl = '/api/placeholder/300/300';
            if (item.imageBlob) {
              console.log(`📤 Subiendo imagen para producto ${globalIndex + 1}: ${product.name}`);
              results.imagesProcessed++;
              
              const imageResult = await storageService.uploadImageFromBlob(
                item.imageBlob, 
                product.sku || `product_${globalIndex}`,
                item.imageName || `image_${globalIndex}`
              );
              
              if (imageResult.success) {
                imageUrl = imageResult.url;
                product.hasRealImage = true;
                results.imagesUploaded++;
                console.log(`✅ Imagen subida: ${product.name}`);
              } else {
                console.warn(`⚠️ Error subiendo imagen para ${product.name}:`, imageResult.error);
                product.hasRealImage = false;
              }
            }
            
            // Asignar URL de imagen al producto
            product.imageUrl = imageUrl;
            
            // Crear producto en Firebase
            const result = await productService.addProduct(product);
            if (result.success) {
              results.successful++;
              console.log(`✅ Producto ${globalIndex + 1}: ${product.name} - Creado exitosamente`);
            } else {
              results.failed++;
              results.errors.push(`Producto ${globalIndex + 1}: ${result.error}`);
              console.error(`❌ Error creando producto ${globalIndex + 1}:`, result.error);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Producto ${globalIndex + 1}: ${error.message}`);
            console.error(`❌ Error procesando producto ${globalIndex + 1}:`, error);
          }
        }));
        
        // Pausa entre lotes para no sobrecargar Firebase
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      console.log(`🎉 Importación completada:`);
      console.log(`   ✅ ${results.successful} productos exitosos`);
      console.log(`   ❌ ${results.failed} productos con errores`);
      console.log(`   📸 ${results.imagesUploaded}/${results.imagesProcessed} imágenes subidas`);
      
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

  // Mapear fila de Excel al formato de producto Firebase (PRECIOS CORREGIDOS)
  mapExcelRowToProduct(row, index, options = {}) {
    try {
      // Extraer y limpiar datos del Excel
      const sku = row['SKU SHOW']?.toString().trim();
      const description = row['Description']?.toString().trim();
      const stock = parseInt(row['Cantidad']) || 0;
      
      // MAPEO DE PRECIOS CORREGIDO:
      // Precio Anaquel = PRECIO MÁS ALTO (original price)
      // Precio Medio Mayoreo = PRECIO MIEMBROS (precio de venta por defecto)  
      // Precio Mayoreo = PRECIO MÁS BAJO (mayoristas)
      const precioAnaquel = parseFloat(row['Precio Anaquel ']) || 0; // PRECIO ORIGINAL/MÁS ALTO
      const precioMedioMayoreo = parseFloat(row['Precio Medio Mayoreo ']) || 0; // PRECIO DEFAULT
      const precioMayoreo = parseFloat(row['Precio Mayoreo ']) || 0; // PRECIO MAYORISTA
      
      // Validaciones básicas
      if (!sku || !description || precioAnaquel <= 0 || precioMedioMayoreo <= 0) {
        console.warn(`⚠️ Producto ${index} omitido por datos incompletos`);
        return null;
      }
      
      // Parsear descripción para extraer información
      const productInfo = this.parseDescription(description);
      
      // Determinar categoría basada en el tipo
      const category = this.determineCategory(productInfo.type, sku);
      
      // Generar nombre del producto
      const name = this.generateProductName(productInfo, sku);
      
      // Calcular descuentos CORRECTOS:
      // Descuento miembro = diferencia entre precio anaquel y medio mayoreo
      const discountMiembro = precioAnaquel > precioMedioMayoreo
        ? Math.round(((precioAnaquel - precioMedioMayoreo) / precioAnaquel) * 100)
        : 0;
      
      // Descuento mayorista = diferencia entre precio anaquel y mayoreo
      const discountMayorista = precioAnaquel > precioMayoreo
        ? Math.round(((precioAnaquel - precioMayoreo) / precioAnaquel) * 100)
        : 0;
      
      // Crear objeto producto para Firebase
      const product = {
        // Información básica
        name: name,
        sku: sku,
        description: this.generateDescription(productInfo, sku),
        category: category,
        
        // SISTEMA DE PRECIOS CORREGIDO:
        pricing: {
          public: Math.round(precioAnaquel), // Precio Anaquel - Público general (MÁS ALTO)
          member: Math.round(precioMedioMayoreo), // Precio Medio Mayoreo - Socios 
          wholesale: Math.round(precioMayoreo) // Precio Mayoreo - Mayoristas (MÁS BAJO)
        },
        
        // Precios principales para compatibilidad con la UI actual
        originalPrice: Math.round(precioAnaquel), // PRECIO ORIGINAL = ANAQUEL (el más alto)
        price: Math.round(precioMedioMayoreo), // PRECIO DEFAULT = MEDIO MAYOREO
        wholesalePrice: Math.round(precioMayoreo), // PRECIO MAYORISTA = MAYOREO (el más bajo)
        
        // Descuentos calculados correctamente
        memberDiscount: discountMiembro, // Descuento para miembros vs precio anaquel
        wholesaleDiscount: discountMayorista, // Descuento mayorista vs precio anaquel
        discount: discountMiembro, // Descuento principal (miembros)
        
        // Inventario
        stock: stock,
        
        // Imagen (se asignará después)
        imageUrl: '/api/placeholder/300/300',
        hasRealImage: false,
        
        // Metadatos
        material: productInfo.material || 'Acero Inoxidable',
        color: productInfo.color || 'Dorado',
        size: productInfo.size || 'Único',
        
        // Estado
        featured: options.markAsFeatured ? (index <= 10) : false,
        rating: 4.5,
        
        // Datos Excel originales (para referencia)
        excel: {
          itemNo: row['Item No.'],
          skuInt: row['SKU INT'],
          skuProv: row['SKU PROV'],
          lote: row['Lote'],
          originalDescription: description,
          // PRECIOS ORIGINALES PARA REFERENCIA:
          precioAnaquel: precioAnaquel, // EL MÁS ALTO
          precioMedioMayoreo: precioMedioMayoreo, // MEDIO
          precioMayoreo: precioMayoreo // EL MÁS BAJO
        }
      };
      
      return product;
      
    } catch (error) {
      console.error(`❌ Error procesando producto ${index}:`, error);
      return null;
    }
  },

  // Parsear descripción del Excel para extraer información estructurada
  parseDescription(description) {
    const info = {
      material: '',
      type: '',
      color: '',
      size: ''
    };
    
    const lines = description.split('\r\n').map(line => line.trim());
    
    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      
      if (lineLower.includes('stainless steel') || lineLower.includes('acero inoxidable')) {
        info.material = 'Acero Inoxidable';
      } else if (lineLower.includes('gold') || lineLower.includes('oro')) {
        info.material = 'Oro';
      } else if (lineLower.includes('silver') || lineLower.includes('plata')) {
        info.material = 'Plata';
      }
      
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

  // Determinar categoría basada en tipo y SKU
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
      return 'Brazaletes'; // Default
    }
  },

  // Generar nombre comercial del producto
  generateProductName(productInfo, sku) {
    const parts = [];
    
    // Tipo de producto
    if (productInfo.type) {
      const typeSpanish = this.translateType(productInfo.type);
      parts.push(typeSpanish);
    } else {
      // Inferir del SKU
      if (sku.startsWith('BR')) parts.push('Brazalete');
      else if (sku.startsWith('RI')) parts.push('Anillo');
      else if (sku.startsWith('CO')) parts.push('Collar');
      else if (sku.startsWith('AR')) parts.push('Aretes');
      else parts.push('Pulsera');
    }
    
    // Material y color
    if (productInfo.material) {
      parts.push(productInfo.material);
    }
    
    if (productInfo.color && productInfo.color.toLowerCase().includes('18k')) {
      parts.push('Baño Oro 18k');
    } else if (productInfo.color) {
      parts.push(productInfo.color);
    }
    
    // SKU al final para unicidad
    parts.push(`(${sku})`);
    
    return parts.join(' ');
  },

  // Traducir tipos de inglés a español
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

  // Generar descripción comercial
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

  // Previsualizar productos antes de importar (CON imágenes)
  async previewImport(file, maxPreview = 5) {
    try {
      console.log('👀 Generando vista previa con imágenes...');
      
      // Intentar extraer con imágenes primero
      let productsWithImages = [];
      try {
        const imageResult = await imageExtractionService.extractImages(file);
        if (imageResult.success && imageResult.productsWithImages) {
          productsWithImages = imageResult.productsWithImages.slice(0, maxPreview);
        }
      } catch (error) {
        console.warn('⚠️ Vista previa sin imágenes:', error);
      }
      
      // Si no se pudieron extraer imágenes, usar método básico
      if (productsWithImages.length === 0) {
        const workbook = XLSX.read(await file.arrayBuffer());
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        productsWithImages = rawData.slice(0, maxPreview).map(row => ({
          productData: row,
          imageBlob: null,
          imageName: null,
          rowNumber: rawData.indexOf(row) + 2
        }));
      }
      
      const preview = productsWithImages.map((item, index) => {
        const product = this.mapExcelRowToProduct(item.productData, index + 1);
        if (product && item.imageBlob) {
          product.hasRealImage = true;
          product.imagePreview = URL.createObjectURL(item.imageBlob);
        }
        return product;
      }).filter(product => product !== null);
      
      return {
        success: true,
        preview,
        totalRows: productsWithImages.length,
        validProducts: preview.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};