const axios = require('axios');
const https = require('https');

/**
 * Função helper para chamar a API do XUI One
 * As variáveis de ambiente são lidas em tempo de execução (não no momento do require)
 * para garantir que o dotenv já foi carregado.
 *
 * @param {string} action Ação da API (ex: get_movies, get_users, create_line)
 * @param {object} params Parâmetros adicionais para a requisição
 * @param {string} method Método HTTP (GET ou POST)
 * @returns {Promise<object|null>} Resposta decodificada em JSON ou null em caso de erro
 */
async function xuiApiCall(action, params = {}, method = 'GET') {
    // Lê as variáveis de ambiente em tempo de execução
    const XUI_API_URL     = process.env.XUI_API_URL;
    const XUI_ACCESS_CODE = process.env.XUI_ACCESS_CODE;
    const XUI_API_KEY     = process.env.XUI_API_KEY;
    const XUI_API_BASE    = `${XUI_API_URL}/${XUI_ACCESS_CODE}/`;

    if (!XUI_API_URL || !XUI_ACCESS_CODE || !XUI_API_KEY) {
        console.error('[XUI] Variáveis de ambiente não definidas! Verifique o .env');
        return null;
    }

    try {
        const config = {
            method: method,
            url: XUI_API_BASE,
            params: {
                api_key: XUI_API_KEY,
                action: action
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 15000
        };

        if (method.toUpperCase() === 'GET') {
            config.params = { ...config.params, ...params };
        } else if (method.toUpperCase() === 'POST') {
            config.data = new URLSearchParams(params).toString();
            config.headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`[XUI] API Error (${action}): ${error.message}`);
        if (error.response) {
            console.error('[XUI] Response:', error.response.status, error.response.data);
        }
        return null;
    }
}

module.exports = {
    xuiApiCall
};
