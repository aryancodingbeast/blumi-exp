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

async function checkOrderDetail() {
  console.log("Checking raw order_items in Supabase...");
  const { data: orderItems, error } = await supabaseAdmin
    .from('order_items')
    .select('*');

  if (error) {
    console.error("Failed to query order_items:", error);
    return;
  }

  console.log(`Found ${orderItems.length} order_items total:`);
  orderItems.forEach(item => {
    console.log(`- OrderID: ${item.order_id} | ProductID: ${item.product_id} | Price: ₹${item.price}`);
  });
}

checkOrderDetail();
