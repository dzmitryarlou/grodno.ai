import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadCourseImage, deleteCourseImage, checkStorageConfiguration } from '../lib/storage';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageDeleted?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImageUrl, 
  onImageUploaded, 
  onImageDeleted 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check storage configuration on component mount
    checkStorageConfiguration().then(setStorageReady);
  }, []);

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = file.type.toLowerCase();
    
    if (!allowedTypes.includes(fileType)) {
      setError('Поддерживаются только изображения форматов: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      console.log('Starting upload for file:', file.name, file.type, file.size);
      
      // Delete old image if exists
      if (currentImageUrl && onImageDeleted) {
        console.log('Deleting old image:', currentImageUrl);
        await deleteCourseImage(currentImageUrl);
      }

      // Upload new image
      const imageUrl = await uploadCourseImage(file);
      console.log('Upload completed, URL:', imageUrl);
      onImageUploaded(imageUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Ошибка при загрузке изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl || !onImageDeleted) return;

    setIsUploading(true);
    try {
      await deleteCourseImage(currentImageUrl);
      onImageDeleted();
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении изображения');
    } finally {
      setIsUploading(false);
    }
  };

  if (storageReady === false) {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Изображение курса
        </label>
        <div className="border-2 border-red-300 rounded-lg p-6 bg-red-50">
          <div className="flex items-center text-red-600">
            <AlertCircle size={20} className="mr-2" />
            <span>Хранилище изображений не настроено. Обратитесь к администратору.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Изображение курса
      </label>

      {currentImageUrl ? (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Course preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
            onError={(e) => {
              console.error('Image failed to load:', currentImageUrl);
              setError('Не удалось загрузить изображение');
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
            title="Удалить изображение"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={isUploading || storageReady === false}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Загрузка...' : 'Выбрать изображение'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              или перетащите файл сюда
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, GIF, WebP до 5MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {storageReady === null && (
        <div className="text-sm text-gray-500">
          Проверка конфигурации хранилища...
        </div>
      )}
    </div>
  );
};

export default ImageUpload;