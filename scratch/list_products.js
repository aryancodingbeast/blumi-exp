const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("Failed to parse Supabase URL or service role key!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  console.log("Fetching all products from Supabase...");
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, title, price, status, seller_id')
      .ilike('title', '%ZERO RUPEE%');

    if (error) {
      console.error("Fetch failed:", error);
    } else {
      console.log("Success! Products found in database:", data);
    }
  } catch (e) {
    console.error("Error running query:", e);
  }
}

listProducts();
