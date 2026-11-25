-- Interpret 100 KB as 100,000 bytes and keep every uploaded image strictly below it.
update storage.buckets set file_size_limit = 99999 where id = 'store-media';
