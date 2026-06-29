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

async function checkWaitlist() {
  console.log("Checking waitlist table in Supabase...");
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('*');

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Found ${data.length} registered waitlist members:`);
    data.forEach(member => {
      console.log(`- Email: ${member.email} | Name: ${member.name} | Waitlist Number: #${member.waitlist_number}`);
    });
  }
}

checkWaitlist();
