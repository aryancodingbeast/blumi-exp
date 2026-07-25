const TOKEN = 'nfp_mPAXzjoWAKHkuLGMm44MvsiYoWwpaxCRa14b';
const KEEP_NAMES = ['blumi', 'blumi-waitlist'];
const KEEP_IDS = ['4d567f41-0323-4d18-bb99-f1439c7f4d61', '62b42916-5dc3-4b9d-bda3-a4e08d825ffc'];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Fetching sites from Netlify...');
  const response = await fetch('https://api.netlify.com/api/v1/sites', {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sites: ${response.status} ${response.statusText}`);
  }

  const sites = await response.json();
  console.log(`Found ${sites.length} sites in total.`);

  const toDelete = [];
  const toKeep = [];

  for (const site of sites) {
    const shouldKeep = KEEP_NAMES.includes(site.name) || KEEP_IDS.includes(site.id);
    if (shouldKeep) {
      toKeep.push(site);
    } else {
      toDelete.push(site);
    }
  }

  console.log('\n--- SITES TO KEEP ---');
  toKeep.forEach(s => console.log(`- KEEP: ${s.name} (${s.id})`));

  console.log('\n--- SITES TO DELETE ---');
  console.log(`Preparing to delete ${toDelete.length} sites...`);
  toDelete.forEach((s, index) => {
    console.log(`[${index + 1}/${toDelete.length}] PENDING: ${s.name} (${s.id})`);
  });

  if (toKeep.length === 0) {
    console.error('ERROR: blumi and blumi-waitlist were not identified! Aborting to prevent accidental deletion.');
    return;
  }

  console.log('\nStarting deletions...');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toDelete.length; i++) {
    const site = toDelete[i];
    console.log(`[${i + 1}/${toDelete.length}] Deleting ${site.name} (${site.id})...`);
    
    try {
      const delResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });

      if (delResponse.ok) {
        console.log(`[${i + 1}/${toDelete.length}] SUCCESS: Deleted ${site.name}`);
        successCount++;
      } else {
        const errText = await delResponse.text();
        console.error(`[${i + 1}/${toDelete.length}] FAILED: ${site.name}. Status: ${delResponse.status}. Error: ${errText}`);
        failCount++;
      }
    } catch (err) {
      console.error(`[${i + 1}/${toDelete.length}] EXCEPTION: Failed to delete ${site.name}:`, err.message);
      failCount++;
    }

    // Wait 500ms between deletions to respect rate limits
    await sleep(500);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`Total sites kept: ${toKeep.length}`);
  console.log(`Total sites successfully deleted: ${successCount}`);
  console.log(`Total failures: ${failCount}`);
}

run().catch(err => {
  console.error('Migration failed:', err);
});
