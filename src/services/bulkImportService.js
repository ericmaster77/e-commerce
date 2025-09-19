// src/services/bulkImportService.js
import * as XLSX from 'xlsx';
import { productService } from './productService';

export const bulkImportService = {
  // Función principal para importar productos desde Excel
  async importProductsFromExcel(file, options = {}) {
    try {
      console.log('🚀 Iniciando importación masiva...');
      
      // Leer archivo Excel
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      console.log(`📊 ${rawData.length} productos encontrados en Excel`);
      
      // Convertir datos de Excel al formato Firebase
      const products = rawData.map((row, index) => {
        return this.mapExcelRowToProduct(row, index + 1, options);
      }).filter(product => product !== null); // Filtrar productos inválidos
      
      console.log(`✅ ${products.length} productos válidos procesados`);
      
      // Importar productos en lotes para evitar límites de Firestore
      const batchSize = 10;
      const results = {
        successful: 0,
        failed: 0,
        errors: [],
        total: products.length
      };
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
        
        await Promise.all(batch.map(async (product, batchIndex) => {
          try {
            const result = await productService.addProduct(product);
            if (result.success) {
              results.successful++;
              console.log(`✅ Producto ${i + batchIndex + 1}: ${product.name}`);
            } else {
              results.failed++;
              results.errors.push(`Error en producto ${i + batchIndex + 1}: ${result.error}`);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Error en producto ${i + batchIndex + 1}: ${error.message}`);
          }
        }));
        
        // Pausa entre lotes para no sobrecargar Firebase
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🎉 Importación completada: ${results.successful} éxitos, ${results.failed} errores`);
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

  // Mapear fila de Excel al formato de producto Firebase
  mapExcelRowToProduct(row, index, options = {}) {
    try {
      // Extraer y limpiar datos del Excel
      const sku = row['SKU SHOW']?.toString().trim();
      const description = row['Description']?.toString().trim();
      const stock = parseInt(row['Cantidad']) || 0;
      const imagen = row['IMAGEN']?.toString().trim() || '';
      
      // Los 3 precios ya están en MXN
      const precioPublico = parseFloat(row['Precio Anaquel ']) || 0; // Precio general
      const precioMedioMayoreo = parseFloat(row['Precio Medio Mayoreo ']) || 0; // Precio miembros
      const precioMayoreo = parseFloat(row['Precio Mayoreo ']) || 0; // Precio mayorista
      
      // Validaciones básicas
      if (!sku || !description || precioPublico <= 0) {
        console.warn(`⚠️ Producto ${index} omitido por datos incompletos`);
        return null;
      }
      
      // Parsear descripción para extraer información
      const productInfo = this.parseDescription(description);
      
      // Determinar categoría basada en el tipo
      const category = this.determineCategory(productInfo.type, sku);
      
      // Generar nombre del producto
      const name = this.generateProductName(productInfo, sku);
      
      // Procesar URL de imagen
      const imageUrl = this.processImageUrl(imagen, sku);
      
      // Calcular descuentos
      const discountMiembro = precioMedioMayoreo > 0 && precioPublico > precioMedioMayoreo
        ? Math.round(((precioPublico - precioMedioMayoreo) / precioPublico) * 100)
        : 0;
      
      const discountMayorista = precioMayoreo > 0 && precioPublico > precioMayoreo
        ? Math.round(((precioPublico - precioMayoreo) / precioPublico) * 100)
        : 0;
      
      // Crear objeto producto para Firebase
      const product = {
        // Información básica
        name: name,
        sku: sku,
        description: this.generateDescription(productInfo, sku),
        category: category,
        
        // Sistema de precios (3 niveles)
        pricing: {
          public: Math.round(precioPublico), // Precio Anaquel - Público general
          member: Math.round(precioMedioMayoreo), // Precio Medio Mayoreo - Socios
          wholesale: Math.round(precioMayoreo) // Precio Mayoreo - Mayoristas
        },
        
        // Precios principales para compatibilidad con la UI actual
        price: Math.round(precioPublico), // Precio público por defecto
        originalPrice: precioMedioMayoreo > 0 ? Math.round(precioMedioMayoreo) : 0,
        wholesalePrice: Math.round(precioMayoreo),
        
        // Descuentos calculados
        memberDiscount: discountMiembro, // Descuento para miembros
        wholesaleDiscount: discountMayorista, // Descuento mayorista
        discount: discountMiembro, // Descuento principal (miembros)
        
        // Inventario
        stock: stock,
        
        // Imagen
        imageUrl: imageUrl,
        hasRealImage: !!(imagen && imagen !== ''),
        
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
          originalImagePath: imagen,
          precioAnaquel: precioPublico,
          precioMedioMayoreo: precioMedioMayoreo,
          precioMayoreo: precioMayoreo
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
      if (line.toLowerCase().includes('stainless steel')) {
        info.material = 'Acero Inoxidable';
      } else if (line.startsWith('Type:')) {
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
      return 'Brazaletes'; // Default para la mayoría
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
      parts.push('Acero Inoxidable');
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

  // Procesar URL de imagen desde Excel
  processImageUrl(imagenOriginal, sku, options = {}) {
    if (!imagenOriginal || imagenOriginal.trim() === '') {
      return '/api/placeholder/300/300'; // Placeholder por defecto
    }
    
    const imagen = imagenOriginal.trim();
    
    // Si ya es una URL completa, usarla directamente
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    
    // Si es un nombre de archivo, construir URL base
    // Usar Firebase Storage URL o URL personalizada
    const baseImageUrl = options.imageBaseUrl || 'https://firebasestorage.googleapis.com/v0/b/rosa-oliva-ecommerce.firebasestorage.app/o/products%2F';
    
    // Si es solo el nombre del archivo sin extensión, agregar .jpg por defecto
    let fileName = imagen;
    if (!fileName.includes('.')) {
      fileName += '.jpg';
    }
    
    // Para Firebase Storage, agregar el token de acceso al final
    if (baseImageUrl.includes('firebasestorage.googleapis.com')) {
      return `${baseImageUrl}${encodeURIComponent(fileName)}?alt=media`;
    }
    
    return `${baseImageUrl}${fileName}`;
  },

  // Previsualizar productos antes de importar
  async previewImport(file, maxPreview = 5) {
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      const preview = rawData.slice(0, maxPreview).map((row, index) => {
        return this.mapExcelRowToProduct(row, index + 1);
      }).filter(product => product !== null);
      
      return {
        success: true,
        preview,
        totalRows: rawData.length,
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