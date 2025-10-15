// src/components/BannerUploadForm.js - Formulario para subir banners con video

import React, { useState } from 'react';
import { Upload, Image, Video, X, CheckCircle } from 'lucide-react';

const BannerUploadForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'image', // 'image' o 'video'
    active: true,
    order: 0
  });
  
  const [files, setFiles] = useState({
    image: null,
    video: null,
    thumbnail: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
    }
  };

  const uploadFile = async (file, path) => {
    return new Promise((resolve, reject) => {
      const storageRef = window.firebase.storage().ref();
      const fileRef = storageRef.child(path);
      const uploadTask = fileRef.put(file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await fileRef.getDownloadURL();
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // Validaciones
      if (formData.type === 'video' && !files.video) {
        throw new Error('Debes seleccionar un archivo de video');
      }
      if (formData.type === 'image' && !files.image) {
        throw new Error('Debes seleccionar una imagen');
      }

      const timestamp = Date.now();
      const bannerData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        active: formData.active,
        order: parseInt(formData.order),
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Subir archivos según el tipo
      if (formData.type === 'video') {
        // Subir video
        if (files.video) {
          const videoPath = `banners/videos/${timestamp}_${files.video.name}`;
          bannerData.videoUrl = await uploadFile(files.video, videoPath);
        }

        // Subir thumbnail (obligatorio para videos)
        if (files.thumbnail) {
          const thumbnailPath = `banners/thumbnails/${timestamp}_${files.thumbnail.name}`;
          bannerData.thumbnailUrl = await uploadFile(files.thumbnail, thumbnailPath);
          bannerData.imageUrl = bannerData.thumbnailUrl; // Fallback
        } else if (files.image) {
          const imagePath = `banners/images/${timestamp}_${files.image.name}`;
          bannerData.imageUrl = await uploadFile(files.image, imagePath);
          bannerData.thumbnailUrl = bannerData.imageUrl;
        }
      } else {
        // Subir solo imagen
        if (files.image) {
          const imagePath = `banners/images/${timestamp}_${files.image.name}`;
          bannerData.imageUrl = await uploadFile(files.image, imagePath);
        }
      }

      // Guardar en Firebase Database
      await window.firebase.database().ref('banners').push(bannerData);

      alert('Banner subido exitosamente');
      if (onSuccess) onSuccess();
      
      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        type: 'image',
        active: true,
        order: 0
      });
      setFiles({ image: null, video: null, thumbnail: null });
      
    } catch (error) {
      console.error('Error subiendo banner:', error);
      setError(error.message || 'Error al subir el banner');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Nuevo Banner</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tipo de Banner */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Banner *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'image' }))}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.type === 'image'
                ? 'border-rosa-primary bg-rosa-light'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Image className="w-8 h-8 mx-auto mb-2" />
            <div className="font-semibold">Imagen</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
            className={`p-4 border-2 rounded-lg transition-all ${
              formData.type === 'video'
                ? 'border-rosa-primary bg-rosa-light'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Video className="w-8 h-8 mx-auto mb-2" />
            <div className="font-semibold">Video</div>
          </button>
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Título del banner"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Descripción del banner"
        />
      </div>

      {/* Upload de archivos según tipo */}
      {formData.type === 'image' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'image')}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {files.image ? files.image.name : 'Haz clic para subir imagen'}
              </p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP (máx. 5MB)</p>
            </label>
          </div>
        </div>
      ) : (
        <>
          {/* Video */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video * (MP4, WebM)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {files.video ? files.video.name : 'Haz clic para subir video'}
                </p>
                <p className="text-xs text-gray-500 mt-1">MP4, WebM (máx. 50MB)</p>
              </label>
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail (Imagen de portada)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {files.thumbnail ? files.thumbnail.name : 'Haz clic para subir thumbnail'}
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG (recomendado)</p>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Orden */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Orden de aparición
        </label>
        <input
          type="number"
          name="order"
          value={formData.order}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
          min="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          0 = primero, números mayores aparecen después
        </p>
      </div>

      {/* Activo */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="active"
          id="active"
          checked={formData.active}
          onChange={handleInputChange}
          className="w-4 h-4 text-rosa-primary border-gray-300 rounded focus:ring-rosa-primary"
        />
        <label htmlFor="active" className="ml-2 text-sm text-gray-700">
          Banner activo (visible en el sitio)
        </label>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div>
          <div className="mb-2 text-sm text-gray-600">
            Subiendo... {Math.round(progress)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-rosa-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 bg-rosa-primary text-white py-3 rounded-lg hover:bg-rosa-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Guardar Banner</span>
            </>
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Nota sobre conexión lenta */}
      {formData.type === 'video' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Nota:</strong> El sistema detectará automáticamente si el usuario 
            tiene conexión lenta y mostrará el thumbnail en lugar del video para una 
            mejor experiencia.
          </p>
        </div>
      )}
    </form>
  );
};

export default BannerUploadForm;