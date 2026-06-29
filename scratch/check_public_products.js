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
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Failed to parse Supabase url or anon key!");
  process.exit(1);
}

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

async function checkPublicProducts() {
  console.log("Fetching products with PUBLIC anon key...");
  const { data, error } = await supabasePublic
    .from('products')
    .select('id, title, status, price')
    .in('status', ['ACTIVE', 'SOLD']);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Found ${data.length} products total using PUBLIC client:`);
    const active = data.filter(p => p.status === 'ACTIVE');
    const sold = data.filter(p => p.status === 'SOLD');
    console.log(`- ACTIVE: ${active.length}`);
    console.log(`- SOLD: ${sold.length}`);
    if (sold.length > 0) {
      console.log("Sold items returned:");
      sold.forEach(p => console.log(`  * ${p.title} (${p.status})`));
    } else {
      console.log("No sold items returned under public anon key!");
    }
  }
}

checkPublicProducts();
