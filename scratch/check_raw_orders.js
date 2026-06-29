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

async function checkRawOrders() {
  console.log("Checking raw orders table...");
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed:", error);
    return;
  }

  orders.forEach((o, i) => {
    console.log(`Order #${i + 1} | ID: ${o.id} | Buyer: ${o.buyer_id} | Created: ${o.created_at} | Amount: ₹${o.total_amount}`);
  });
}

checkRawOrders();
