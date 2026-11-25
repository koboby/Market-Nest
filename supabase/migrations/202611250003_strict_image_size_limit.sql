-- Keep the Storage API hard limit strictly below 100 KB (100 KiB).
update storage.buckets set file_size_limit = 102399 where id = 'store-media';
