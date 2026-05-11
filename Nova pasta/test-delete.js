require('dotenv').config();
const { xuiApiCall } = require('./utils/xui.js');

async function run() {
    const res = await xuiApiCall('get_lines', { search: 'fernanda' });
    console.log("search fernanda:", JSON.stringify(res.data, null, 2));
    
    // Also try fetch all lines to see if it's there
    const res2 = await xuiApiCall('get_lines', { limit: 1000 });
    const found = res2.data.find(l => l.username.includes('fernanda'));
    console.log("Found in limit 1000:", found);
}
run();
