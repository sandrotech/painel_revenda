const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
const { xuiApiCall } = require('../utils/xui');
const db = require('../config/db');

const XUI_API_URL = process.env.XUI_API_URL;
const XUI_ACCESS_CODE = process.env.XUI_ACCESS_CODE;
const XUI_LOGIN_URL = `${XUI_API_URL}/${XUI_ACCESS_CODE}/includes/ajax.php`;

const agent = new https.Agent({ rejectUnauthorized: false });

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Usuário e senha obrigatórios.' });

    try {
        // 1. Verificar a senha fazendo login direto no painel XUI
        //    Este endpoint é a forma mais confiável - retorna sucesso/falha
        let xuiLoginOk = false;
        let xuiLoginData = null;
        try {
            const loginRes = await axios.post(XUI_LOGIN_URL,
                new URLSearchParams({ action: 'login', username, password }),
                {
                    httpsAgent: agent,
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
            console.log('XUI login response:', loginRes.data);
            xuiLoginData = loginRes.data;
            // XUI retorna { result: true/false } ou variações
            xuiLoginOk = xuiLoginData?.result === true || 
                         xuiLoginData?.result === 'true' ||
                         xuiLoginData?.status === 'ok' ||
                         xuiLoginData?.success === true;
        } catch(e) {
            console.error('XUI login endpoint error:', e.message);
            // Se o endpoint ajax falhou (404, erro de rede, etc.), 
            // usamos fallback: buscar o usuário no banco local
            xuiLoginOk = null; // null = fallback
        }

        // 2. Se o XUI ajax respondeu que a senha está errada -> rejeitar
        if (xuiLoginOk === false) {
            return res.json({ success: false, error: 'Usuário ou senha incorretos.' });
        }

        // 3. Buscar dados completos do usuário:
        //    Primeiro tenta no nosso banco local (revenda), depois no XUI
        let userInfo = null;
        let role = 'revenda';
        let display = 'Revendedor';
        let credits = 0;

        // Checa na tabela revendas do nosso banco
        const [revendasRows] = await db.query(
            'SELECT * FROM revendas WHERE LOWER(user) = LOWER(?)', 
            [username]
        );

        if (revendasRows.length > 0) {
            const rev = revendasRows[0];
            userInfo = { user: rev.user, role: 'revenda', display: 'Revendedor', credits: rev.cred || 0, xui_id: rev.xui_id };
        } else {
            // Não está nas revendas locais, tenta buscar no XUI usando o xui_id se disponível
            // ou varrer get_users com search
            const usersRes = await xuiApiCall('get_users', { search: username });
            const users = usersRes?.data || [];
            const xuiUser = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());

            if (xuiUser) {
                const groupId = parseInt(xuiUser.member_group_id || '2');
                if (groupId === 1) {
                    role = 'admin';
                    display = 'Administrador Master';
                    credits = Infinity;
                }
                userInfo = {
                    user: xuiUser.username,
                    role,
                    display,
                    credits: parseInt(xuiUser.credits || '0'),
                    xui_id: parseInt(xuiUser.id)
                };
            }
        }

        if (!userInfo) {
            // Usuário autenticado no XUI mas não encontrado em nenhum lugar
            // Isso pode acontecer para o 'revenda-teste' que não está nos primeiros 50
            // Nesse caso, aceitamos o login com role de revenda básico
            // pois a senha foi validada pelo XUI
            if (xuiLoginOk === null) {
                // Não conseguimos verificar nada -> rejeitar por segurança
                return res.json({ success: false, error: 'Erro ao verificar credenciais. Tente novamente.' });
            }
            userInfo = { user: username, role: 'revenda', display: 'Revendedor', credits: 0, xui_id: null };
        }

        res.json({ success: true, user: userInfo });

    } catch (e) {
        console.error('Erro no login:', e.message);
        res.status(500).json({ success: false, error: 'Erro ao conectar com o servidor de autenticação.' });
    }
});

module.exports = router;
