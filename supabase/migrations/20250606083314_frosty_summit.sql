/*
  # Create storage bucket for course images
  
  1. Storage Setup
    - Create course-images bucket with public access
    - This allows storing and serving course images
    
  Note: Storage policies are managed automatically by Supabase
  for public buckets, so we don't need to set them manually.
*/

-- Create the storage bucket for course images
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;