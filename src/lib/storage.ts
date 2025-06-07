import { supabase } from './supabaseClient';

export const uploadCourseImage = async (file: File): Promise<string> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Поддерживаются только изображения форматов: JPEG, PNG, GIF, WebP');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Размер файла не должен превышать 5MB');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `courses/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Ошибка загрузки: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-images')
      .getPublicUrl(data.path);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Не удалось загрузить изображение');
  }
};

export const deleteCourseImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    
    // Find the path after 'course-images'
    const bucketIndex = pathSegments.findIndex(segment => segment === 'course-images');
    if (bucketIndex === -1 || bucketIndex === pathSegments.length - 1) {
      console.warn('Invalid image URL format:', imageUrl);
      return;
    }
    
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');
    console.log('Deleting file:', filePath);

    const { error } = await supabase.storage
      .from('course-images')
      .remove([filePath]);

    if (error) {
      console.warn('Delete error:', error.message);
      // Don't throw error for delete failures as it's not critical
    } else {
      console.log('File deleted successfully');
    }
  } catch (error) {
    console.warn('Delete error:', error);
    // Don't throw error for delete failures as it's not critical
  }
};

export const getCourseImageUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('course-images')
    .getPublicUrl(`courses/${fileName}`);
  
  return data.publicUrl;
};

// Helper function to check if storage is properly configured
export const checkStorageConfiguration = async (): Promise<boolean> => {
  try {
    // Try to list files in the bucket to check if it exists and is accessible
    const { data, error } = await supabase.storage
      .from('course-images')
      .list('courses', { limit: 1 });

    if (error) {
      console.error('Storage configuration error:', error);
      return false;
    }

    console.log('Storage is properly configured');
    return true;
  } catch (error) {
    console.error('Storage check failed:', error);
    return false;
  }
};