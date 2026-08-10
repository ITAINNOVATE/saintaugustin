-- 1. Create a public bucket for composition videos/audios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('compositions', 'compositions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to the bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING ( bucket_id = 'compositions' );

-- 3. Allow anonymous/authenticated uploads
CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'compositions' );

-- 4. Allow anonymous/authenticated updates
CREATE POLICY "Anon Update" ON storage.objects FOR UPDATE 
USING ( bucket_id = 'compositions' );

-- 5. Allow anonymous/authenticated deletes
CREATE POLICY "Anon Delete" ON storage.objects FOR DELETE 
USING ( bucket_id = 'compositions' );
