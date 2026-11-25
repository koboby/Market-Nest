-- Store media must pass through the WebP compression pipeline before storage.
update storage.buckets set allowed_mime_types = array['image/webp'] where id = 'store-media';
