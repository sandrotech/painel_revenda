require('dotenv').config();
const { xuiApiCall } = require('./utils/xui.js');

async function run() {
    const res = await xuiApiCall('get_users', { search: 'revenda-teste' });
    console.log("Status:", res?.status);
    console.log("Data:", JSON.stringify(res?.data, null, 2));
}
run();
