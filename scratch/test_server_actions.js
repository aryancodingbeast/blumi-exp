// Self-contained simulation script

// Since Next server actions require a runtime, let's create a quick script that executes the logic or queries the DB using supabaseAdmin as done in the action.
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

async function testQuery() {
  console.log("Simulating server action getProducts() database query with supabaseAdmin...");
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, title, description, price, images, status, created_at')
    .in('status', ['ACTIVE', 'SOLD'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Success! Fetched ${data.length} products total using admin query.`);
    const active = data.filter(p => p.status === 'ACTIVE');
    const sold = data.filter(p => p.status === 'SOLD');
    console.log(`- ACTIVE: ${active.length}`);
    console.log(`- SOLD: ${sold.length}`);
    console.log("Sold items list:");
    sold.forEach(p => console.log(`  * ${p.title} (${p.status})`));
  }
}

testQuery();
