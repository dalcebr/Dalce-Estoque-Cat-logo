-- ============================================================
-- 009 — Supabase Storage buckets for product images and catalog logos
-- ============================================================
-- NOTE: Supabase Storage buckets are normally created via the Dashboard
-- or Management API. The INSERT INTO storage.buckets below works when
-- executed as a Postgres superuser (e.g. via the SQL Editor in the
-- Supabase Dashboard). If the buckets already exist, the ON CONFLICT
-- clause will skip creation.
--
-- Both buckets are PUBLIC so that catalog visitors (anon) can read images.
-- Write access is restricted to authenticated users, scoped to their own
-- store folder (path prefix = store_id from profiles).
-- ============================================================

-- Create the buckets (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('catalog-logos',  'catalog-logos',  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Policies for product-images
-- ============================================================

-- Anyone can read (needed for public catalog pages)
CREATE POLICY "product-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated users can upload to their own store folder
CREATE POLICY "product-images: store upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Authenticated users can update (overwrite) files in their store folder
CREATE POLICY "product-images: store update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Authenticated users can delete files in their store folder
CREATE POLICY "product-images: store delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- Policies for catalog-logos
-- ============================================================

CREATE POLICY "catalog-logos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-logos');

CREATE POLICY "catalog-logos: store upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-logos'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "catalog-logos: store update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'catalog-logos'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "catalog-logos: store delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catalog-logos'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
