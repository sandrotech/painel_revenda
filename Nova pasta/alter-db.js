require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'painel_fuze'
        });
        await connection.query('ALTER TABLE revendas ADD COLUMN xui_id INT DEFAULT NULL');
        console.log("Column xui_id added successfully to revendas");
        await connection.end();
    } catch (e) {
        console.error(e.message);
    }
}
run();
