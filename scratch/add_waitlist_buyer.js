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

async function addWaitlistBuyer() {
  console.log("Upserting prefilled test buyer into waitlist table...");
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .upsert({
      email: 'buyer@revclo.com',
      name: 'REVCLO PREFERRED BUYER',
      waitlist_number: 1001
    }, { onConflict: 'email' })
    .select();

  if (error) {
    console.error("Failed to upsert waitlist record:", error);
  } else {
    console.log("Success! Upserted waitlist record:", data);
  }
}

addWaitlistBuyer();
