const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('/Users/aryansingh/Developer/blumi/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("Failed to parse Supabase url or service role key from .env!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function migrateImages() {
  console.log("Starting product image migration to Supabase Storage...");

  // 1. Ensure 'products' storage bucket exists and is public
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets && buckets.some(b => b.name === 'products');
    if (!exists) {
      console.log("Creating public 'products' storage bucket...");
      const { error: createError } = await supabaseAdmin.storage.createBucket('products', {
        public: true,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (createError) throw createError;
      console.log("Bucket 'products' created successfully.");
    } else {
      console.log("Public bucket 'products' already exists.");
    }
  } catch (e) {
    console.error("Storage bucket check/creation failed:", e);
    process.exit(1);
  }

  // 2. Fetch all products from 'products' table
  const { data: products, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, title, images');

  if (fetchError) {
    console.error("Failed to fetch products from Supabase table:", fetchError);
    process.exit(1);
  }

  console.log(`Analyzing ${products.length} products for Base64 assets...`);

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const images = p.images || [];
    let updatedImages = [];
    let isMigrated = false;

    console.log(`Processing Product #${idx + 1}: ${p.title} (${p.id})`);

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const img = images[imgIdx];
      if (img && img.startsWith('data:image')) {
        // We have a Base64 string! Let's migrate it
        try {
          const matches = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
          if (!matches || matches.length !== 3) {
            console.error(`  - [ERR] Invalid base64 format on image index ${imgIdx}`);
            updatedImages.push(img); // keep original fallback
            continue;
          }

          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const fileExtension = contentType.split('/')[1] || 'webp';
          const fileName = `${p.id}/${imgIdx}.${fileExtension}`;

          console.log(`  - Uploading Image #${imgIdx + 1} (${(buffer.length / 1024).toFixed(1)} KB) to storage...`);
          
          const { error: uploadError } = await supabaseAdmin
            .storage
            .from('products')
            .upload(fileName, buffer, {
              contentType: contentType,
              upsert: true
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(fileName);

          console.log(`  - [OK] Public URL secured: ${publicUrl}`);
          updatedImages.push(publicUrl);
          isMigrated = true;
        } catch (uploadErr) {
          console.error(`  - [ERR] Failed to upload image index ${imgIdx}:`, uploadErr);
          updatedImages.push(img); // retain original if fails
        }
      } else {
        // Already a URL or empty, keep it
        updatedImages.push(img);
      }
    }

    if (isMigrated) {
      console.log(`  - Updating database row with new URLs...`);
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ images: updatedImages })
        .eq('id', p.id);

      if (updateError) {
        console.error(`  - [ERR] Database update failed for product ${p.title}:`, updateError);
      } else {
        console.log(`  - [SUCCESS] Product "${p.title}" successfully migrated to Supabase Storage!`);
      }
    } else {
      console.log(`  - No Base64 images found or already migrated. Skipping.`);
    }
  }

  console.log("\nAll done! Product image migration completed successfully.");
}

migrateImages();
