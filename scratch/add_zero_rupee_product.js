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

async function manageZeroRupeeProducts() {
  console.log("Re-activating original zero rupee product...");
  try {
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('products')
      .update({ status: 'ACTIVE' })
      .eq('id', 'f496d4c4-236e-4c99-9cbb-42e32a5244fb')
      .select();

    if (updateError) {
      console.error("Failed to reactivate original item:", updateError);
    } else {
      console.log("Original zero rupee item reactivated successfully:", updateData);
    }

    console.log("Inserting a brand new ZERO RUPEE V2 test product...");
    const productData = {
      title: "ZERO RUPEE TEST PIECE V2_",
      description: "Fresh ₹ 0 testing product for payment bypass verification and dynamic shipping integration checks.",
      price: 0,
      images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000"],
      seller_id: "06cc484b-a805-41eb-a1db-e25a30d5aa47",
      status: "ACTIVE"
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert V2 item:", insertError);
    } else {
      console.log("Success! ZERO RUPEE V2 product created:", insertData);
    }
  } catch (e) {
    console.error("Error running database commands:", e);
  }
}

manageZeroRupeeProducts();
