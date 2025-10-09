// src/services/bulkImportService.js - CORREGIDO
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
        imagesUploaded: 0,
        skipped: 0
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
      const batchSize = hasImages ? 3 : 5;
      const processedSkus = new Set();
      
      for (let i = 0; i < productsWithImages.length; i += batchSize) {
        const batch = productsWithImages.slice(i, i + batchSize);
        console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsWithImages.length / batchSize)}`);
        
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const item = batch[batchIndex];
          const globalIndex = i + batchIndex;
          
          try {
            // ✅ CORRECCIÓN: mapExcelRowToProduct ahora NO incluye campo 'id'
            const product = this.mapExcelRowToProduct(item.productData, globalIndex + 1, options);
            
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
            
            // Subir imagen si existe
            let imageUrl = '/api/placeholder/300/300';
            let hasRealImage = false;
            
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
                hasRealImage = true;
                results.imagesUploaded++;
                console.log(`✅ Imagen subida: ${product.name}`);
              } else {
                console.warn(`⚠️ Error subiendo imagen para ${product.name}:`, imageResult.error);
              }
            }
            
            // Asignar URL de imagen al producto
            product.imageUrl = imageUrl;
            product.hasRealImage = hasRealImage;
            
            // ✅ CORRECCIÓN: Crear producto SIN campo 'id'
            // Firebase generará el ID automáticamente
            const result = await productService.addProduct(product);
            
            if (result.success) {
              results.successful++;
              console.log(`✅ Producto ${globalIndex + 1}: ${product.name} - Creado exitosamente (ID: ${result.id})`);
            } else {
              results.failed++;
              results.errors.push(`Producto ${globalIndex + 1} (${product.sku}): ${result.error}`);
              console.error(`❌ Error creando producto ${globalIndex + 1}:`, result.error);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Producto ${globalIndex + 1}: ${error.message}`);
            console.error(`❌ Error procesando producto ${globalIndex + 1}:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`🎉 Importación completada:`);
      console.log(`   ✅ ${results.successful} productos exitosos`);
      console.log(`   ❌ ${results.failed} productos con errores`);
      console.log(`   ⏭️ ${results.skipped} productos omitidos`);
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

  // ✅ CORRECCIÓN: mapExcelRowToProduct NO incluye campo 'id'
  mapExcelRowToProduct(row, index, options = {}) {
    try {
      const sku = row['SKU SHOW']?.toString().trim();
      const description = row['Description']?.toString().trim();
      const stock = parseInt(row['Cantidad']) || 0;
      
      const precioAnaquel = parseFloat(row['Precio Anaquel ']) || 0;
      const precioMedioMayoreo = parseFloat(row['Precio Medio Mayoreo ']) || 0;
      const precioMayoreo = parseFloat(row['Precio Mayoreo ']) || 0;
      
      if (!sku || !description || precioAnaquel <= 0 || precioMedioMayoreo <= 0) {
        console.warn(`⚠️ Producto ${index} omitido por datos incompletos`);
        return null;
      }
      
      const productInfo = this.parseDescription(description);
      const category = this.determineCategory(productInfo.type, sku);
      const name = this.generateProductName(productInfo, sku);
      
      const discountMiembro = precioAnaquel > precioMedioMayoreo
        ? Math.round(((precioAnaquel - precioMedioMayoreo) / precioAnaquel) * 100)
        : 0;
      
      const discountMayorista = precioAnaquel > precioMayoreo
        ? Math.round(((precioAnaquel - precioMayoreo) / precioAnaquel) * 100)
        : 0;
      
      // ✅ CORRECCIÓN: NO incluir campo 'id'
      // Firebase lo generará automáticamente al crear el documento
      const product = {
        name: name,
        sku: sku,
        description: this.generateDescription(productInfo, sku),
        category: category,
        
        pricing: {
          public: Math.round(precioAnaquel),
          member: Math.round(precioMedioMayoreo),
          wholesale: Math.round(precioMayoreo)
        },
        
        originalPrice: Math.round(precioAnaquel),
        price: Math.round(precioMedioMayoreo),
        wholesalePrice: Math.round(precioMayoreo),
        
        memberDiscount: discountMiembro,
        wholesaleDiscount: discountMayorista,
        discount: discountMiembro,
        
        stock: stock,
        
        imageUrl: '/api/placeholder/300/300',
        hasRealImage: false,
        
        material: productInfo.material || 'Acero Inoxidable',
        color: productInfo.color || 'Dorado',
        size: productInfo.size || 'Único',
        
        featured: options.markAsFeatured ? (index <= 10) : false,
        rating: 4.5,
        
        excel: {
          itemNo: row['Item No.'],
          skuInt: row['SKU INT'],
          skuProv: row['SKU PROV'],
          lote: row['Lote'],
          originalDescription: description,
          precioAnaquel: precioAnaquel,
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

  generateProductName(productInfo, sku) {
    const parts = [];
    
    if (productInfo.type) {
      const typeSpanish = this.translateType(productInfo.type);
      parts.push(typeSpanish);
    } else {
      if (sku.startsWith('BR')) parts.push('Brazalete');
      else if (sku.startsWith('RI')) parts.push('Anillo');
      else if (sku.startsWith('CO')) parts.push('Collar');
      else if (sku.startsWith('AR')) parts.push('Aretes');
      else parts.push('Pulsera');
    }
    
    if (productInfo.material) {
      parts.push(productInfo.material);
    }
    
    if (productInfo.color && productInfo.color.toLowerCase().includes('18k')) {
      parts.push('Baño Oro 18k');
    } else if (productInfo.color) {
      parts.push(productInfo.color);
    }
    
    parts.push(`(${sku})`);
    
    return parts.join(' ');
  },

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

  async previewImport(file, maxPreview = 5) {
    try {
      console.log('👀 Generando vista previa con imágenes...');
      
      let productsWithImages = [];
      try {
        const imageResult = await imageExtractionService.extractImages(file);
        if (imageResult.success && imageResult.productsWithImages) {
          productsWithImages = imageResult.productsWithImages.slice(0, maxPreview);
        }
      } catch (error) {
        console.warn('⚠️ Vista previa sin imágenes:', error);
      }
      
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