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

async function stressConcurrency() {
  console.log("Stressing concurrency check logic in Supabase...");
  
  // 1. Choose an ACTIVE product from the DB to test
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, title, status')
    .eq('status', 'ACTIVE')
    .limit(1);

  if (!products || products.length === 0) {
    console.error("No active products available to run stress test!");
    return;
  }

  const testProduct = products[0];
  console.log(`Using active product: ${testProduct.title} (ID: ${testProduct.id})`);

  // 2. Define our simulated concurrent checkout execution logic
  // We simulate what the placeOrder server action does:
  const buyer1 = "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b";
  const buyer2 = "237e5c59-0e1d-4efe-b8ff-3f5633acb991";

  async function executeCheckoutAttempt(buyerId, label) {
    console.log(`[${label}] Starting atomic check-out attempt...`);
    try {
      // Step A: Atomically claim product
      const { data: claim, error: claimError } = await supabaseAdmin
        .from('products')
        .update({ status: 'SOLD' })
        .eq('id', testProduct.id)
        .eq('status', 'ACTIVE')
        .select('id');

      if (claimError) throw claimError;

      if (!claim || claim.length === 0) {
        throw new Error("CONCURRENCY_ERROR: Item already checked out by another buyer!");
      }

      console.log(`[${label}] SUCCESS: Atomically claimed 1/1 item! Proceeding to order insertion...`);

      // Step B: Insert simulated order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          buyer_id: buyerId,
          total_amount: 499,
          status: 'PLACED'
        })
        .select()
        .single();

      if (orderError) {
        // Rollback
        await supabaseAdmin.from('products').update({ status: 'ACTIVE' }).eq('id', testProduct.id);
        throw orderError;
      }

      // Step C: Insert order item
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: testProduct.id,
          price: 499
        });

      if (itemError) {
        // Rollback
        await supabaseAdmin.from('products').update({ status: 'ACTIVE' }).eq('id', testProduct.id);
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        throw itemError;
      }

      console.log(`[${label}] COMPLETE: Order #${order.id.slice(0, 8)} successfully registered!`);
      return { success: true, orderId: order.id };
    } catch (err) {
      console.log(`[${label}] FAILED: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 3. Trigger both checkout attempts concurrently (at the exact same time)
  console.log("Triggering both checkout attempts simultaneously...");
  const results = await Promise.all([
    executeCheckoutAttempt(buyer1, "BUYER_A"),
    executeCheckoutAttempt(buyer2, "BUYER_B")
  ]);

  console.log("\n--- STRESS TEST RESULT ---");
  console.log("Buyer A Success:", results[0].success);
  console.log("Buyer B Success:", results[1].success);
  
  if (results[0].success && results[1].success) {
    console.error("CRITICAL SAFETY FAILURE: Double selling occurred! Both orders registered successfully.");
  } else {
    console.log("CONCURRENCY SHIELD SUCCESS: Only exactly one order was registered successfully! Double selling successfully blocked.");
  }

  // 4. Cleanup: Reset test product status to ACTIVE and delete the successfully placed order to maintain pristine DB
  console.log("\nCleaning up stress test database traces...");
  await supabaseAdmin.from('products').update({ status: 'ACTIVE' }).eq('id', testProduct.id);
  
  const successfulOrder = results.find(r => r.success);
  if (successfulOrder && successfulOrder.orderId) {
    await supabaseAdmin.from('order_items').delete().eq('order_id', successfulOrder.orderId);
    await supabaseAdmin.from('orders').delete().eq('id', successfulOrder.orderId);
    console.log("Stress test orders deleted successfully from DB.");
  }
}

stressConcurrency();
