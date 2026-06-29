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

async function checkFullOrders() {
  console.log("Fetching all orders and order_items...");
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(*))')
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error("Failed to fetch orders:", ordersError);
    return;
  }

  console.log(`Found ${orders.length} orders total:`);
  orders.forEach((o, idx) => {
    console.log(`Order #${idx + 1} | ID: ${o.id} | Status: ${o.status} | Total: ₹${o.total_amount}`);
    o.order_items?.forEach(item => {
      const prod = item.products;
      if (prod) {
        console.log(`  - Product ID: ${prod.id} | Title: ${prod.title} | Product Status: ${prod.status} | Item Price: ₹${item.price}`);
      } else {
        console.log(`  - Product ID: ${item.product_id} (Product not found in DB!)`);
      }
    });
  });
}

checkFullOrders();
