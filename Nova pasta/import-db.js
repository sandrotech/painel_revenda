require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true // Necessário para rodar vários comandos no mesmo script
        });

        console.log('Conectado ao MySQL.');

        const sqlScript = fs.readFileSync('database.sql', 'utf8');

        console.log('Executando database.sql...');
        await connection.query(sqlScript);

        console.log('Banco de dados criado e populado com sucesso!');
        await connection.end();
    } catch (err) {
        console.error('Erro ao importar o banco de dados:', err);
    }
}

importDb();
