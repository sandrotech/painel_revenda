require('dotenv').config();
const { xuiApiCall } = require('./utils/xui.js');

async function run() {
    console.log("=== GET GROUPS ===");
    const groups = await xuiApiCall('get_groups', {});
    console.log("Groups:", JSON.stringify(groups, null, 2));
    
    // Check if there is an endpoint like 'user_create' or 'create_reseller'
    // I will try to create a dummy reseller to test the endpoint.
    // Test delete_user on the newly created reseller id 61
    const delRes1 = await xuiApiCall('delete_user', { user_id: 61 });
    console.log("delete_user with user_id:", delRes1);

    const delRes2 = await xuiApiCall('delete_user', { id: 61 });
    console.log("delete_user with id:", delRes2);
}
run();
