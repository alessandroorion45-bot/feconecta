-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-photos', 'community-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload community photos
CREATE POLICY "Authenticated users can upload community photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-photos');

-- Allow public access to view community photos
CREATE POLICY "Public can view community photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-photos');

-- Allow users to update their community photos
CREATE POLICY "Users can update community photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-photos');

-- Allow users to delete community photos
CREATE POLICY "Users can delete community photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-photos');