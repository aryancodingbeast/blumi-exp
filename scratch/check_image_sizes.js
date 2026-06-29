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

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkImageSizes() {
  console.log("Analyzing product image sizes in Supabase...");
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, title, images');

  if (error) {
    console.error("Query failed:", error);
    return;
  }

  let totalSizeChars = 0;
  console.log(`Found ${data.length} products total. Image sizes analysis:`);
  data.forEach((p, idx) => {
    let imagesCount = p.images ? p.images.length : 0;
    let sizeChars = 0;
    if (p.images) {
      p.images.forEach(img => {
        if (img) sizeChars += img.length;
      });
    }
    totalSizeChars += sizeChars;
    const isBase64 = p.images && p.images[0] && p.images[0].startsWith('data:image');
    console.log(`- Product #${idx + 1}: ID ${p.id.slice(0, 8)}... | ${p.title} | ${imagesCount} images | Size: ${(sizeChars / 1024 / 1024).toFixed(2)} MB | Format: ${isBase64 ? 'Base64 (INLINE)' : 'URL'}`);
  });

  console.log("\n==========================================");
  console.log(`Total Database Image Payload Size: ${(totalSizeChars / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Egress per standard catalog fetch: ${(totalSizeChars / 1024 / 1024).toFixed(2)} MB`);
  console.log("==========================================");
}

checkImageSizes();
