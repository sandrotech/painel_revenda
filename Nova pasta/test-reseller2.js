require('dotenv').config();
const { xuiApiCall } = require('./utils/xui.js');

async function run() {
    const res = await xuiApiCall('user_info', { username: 'revenda-teste' });
    console.log("user_info revenda-teste:", JSON.stringify(res, null, 2));

    // Let's also check server logs or run a direct mysql query on our local DB
    // to see if revenda-teste was saved successfully locally
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'painel_fuze'
    });
    const [rows] = await connection.query('SELECT * FROM revendas WHERE user=?', ['revenda-teste']);
    console.log("Local DB revenda-teste:", JSON.stringify(rows, null, 2));
    await connection.end();
}
run();
