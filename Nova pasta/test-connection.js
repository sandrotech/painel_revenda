require('dotenv').config();
const axios = require('axios');
const https = require('https');

const url = process.env.XUI_API_URL + '/' + process.env.XUI_ACCESS_CODE + '/';
console.log('Testando URL:', url);
console.log('API Key:', process.env.XUI_API_KEY ? process.env.XUI_API_KEY.slice(0,8) + '...' : 'NAO DEFINIDA');

axios.get(url, {
    params: { api_key: process.env.XUI_API_KEY, action: 'get_packages' },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 12000
}).then(r => {
    console.log('STATUS HTTP:', r.status);
    console.log('RESPOSTA:', JSON.stringify(r.data));
}).catch(e => {
    console.error('ERRO:', e.message);
    console.error('CODE:', e.code);
    if (e.response) {
        console.error('HTTP Status:', e.response.status);
        console.error('Body:', JSON.stringify(e.response.data));
    }
});
