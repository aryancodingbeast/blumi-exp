const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function addTenRupeeItems() {
  console.log("Fetching first registered seller profile...");
  let sellerId = '854a48cd-d31e-4a7e-a622-58d1f44b73d8'; // default fallback
  
  try {
    const { data: sellers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'SELLER')
      .limit(1);

    if (sellers && sellers.length > 0) {
      sellerId = sellers[0].id;
    }
  } catch (e) {
    console.error("Failed to find seller profile:", e);
  }
  
  console.log(`Using Seller ID: ${sellerId}`);

  // Create 10 distinct ₹10 test products matching the streetwear design aesthetics
  const testItems = Array.from({ length: 10 }).map((_, i) => ({
    title: `₹10 TEST DRIP #${String(i + 1).padStart(2, '0')}`,
    description: `[TESTING ARTIFACT] Exclusive ₹10 test piece ${i + 1}/10. Specially engineered for checkout concurrency audits and waitlist coupon validations. Size L, Circular Streetwear.`,
    price: 10,
    images: [`https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop`],
    seller_id: sellerId,
    status: 'ACTIVE'
  }));

  console.log("Inserting 10 test items into Supabase products table...");
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(testItems)
    .select('id, title');

  if (error) {
    console.error("Failed to insert items:", error);
  } else {
    console.log(`Success! Inserted ${data.length} test items:`);
    data.forEach(item => {
      console.log(`- ID: ${item.id} | Title: ${item.title}`);
    });
  }
}

addTenRupeeItems();
