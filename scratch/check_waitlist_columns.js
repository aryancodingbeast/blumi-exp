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

async function checkColumns() {
  console.log("Checking columns of waitlist table...");
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Failed:", error);
  } else {
    console.log("Waitlist record sample:", data[0]);
  }
}

checkColumns();
