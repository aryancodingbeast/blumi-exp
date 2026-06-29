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
  console.error("Failed to parse Supabase url or service role key!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log("Fetching all products from Supabase...");
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, title, status, price');

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Found ${data.length} products total:`);
    data.forEach(p => {
      console.log(`- [${p.status}] ID: ${p.id} | Title: ${p.title} | Price: ₹${p.price}`);
    });
  }
}

checkProducts();
