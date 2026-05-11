require('dotenv').config();
const { xuiApiCall } = require('./utils/xui.js');

async function run() {
    console.log("=== GET PACKAGES ===");
    const pkgs = await xuiApiCall('get_packages', {});
    if (pkgs && pkgs.data) {
        console.log(JSON.stringify(pkgs.data.slice(0, 3), null, 2));
    }

    console.log("\n=== CREATE LINE TEST ===");
    // Format YYYY-MM-DD
    const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const exp_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const line = await xuiApiCall('create_line', {
        username: 'scratch_test_' + Math.floor(Math.random()*1000),
        password: 'pass',
        package_id: 3, // Assuming 3 is a valid package from their DB
        max_connections: 2,
        exp_date: exp_date,
        is_trial: 0
    });
    console.log(JSON.stringify(line, null, 2));
}

run();
