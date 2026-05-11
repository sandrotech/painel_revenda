const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { xuiApiCall } = require('../utils/xui');

// Rota para buscar todos os dados do dashboard de uma vez
router.get('/dashboard-data', async (req, res) => {
    try {
        const [clientes] = await db.query('SELECT * FROM clientes');
        const [revendas] = await db.query('SELECT * FROM revendas');
        const [planos] = await db.query('SELECT * FROM planos');
        const [pagamentos] = await db.query('SELECT * FROM pagamentos');

        planos.forEach(p => p.teste = !!p.teste);

        // Créditos reais: busca do banco para cada revenda
        // Retornamos o mapa completo user -> cred
        const creditMap = {};
        revendas.forEach(r => { creditMap[r.user] = r.cred || 0; });

        res.json({ clientes, revendas, planos, pagamentos, creditMap });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados do banco.' });
    }
});

router.post('/clientes', async (req, res) => {
    try {
        const { user, password, nome, wpp, srv, plano, plano_id, conn, status, revenda, revenda_xui_id, valor } = req.body;
        
        // 1. Buscar dados do plano (duração e custo em créditos)
        const [planoDB] = await db.query('SELECT dur, cred FROM planos WHERE id=?', [plano_id || 1]);
        const dur = planoDB[0]?.dur || '30 Dias';
        const creditCost = parseInt(planoDB[0]?.cred || '0');

        // 2. Se tiver revenda e o plano custa créditos, verificar e debitar
        let creditsRemaining = null;
        if (revenda && revenda !== 'super-fuze' && creditCost > 0) {
            const [revDB] = await db.query('SELECT id, cred FROM revendas WHERE user=?', [revenda]);
            if (revDB.length > 0) {
                const currentCred = parseFloat(revDB[0].cred || '0');
                if (currentCred < creditCost) {
                    return res.status(400).json({ success: false, error: `Créditos insuficientes. Precisa de ${creditCost}, revenda tem ${currentCred}.` });
                }
                const newCred = parseFloat((currentCred - creditCost).toFixed(4));
                await db.query('UPDATE revendas SET cred=? WHERE id=?', [newCred, revDB[0].id]);
                // Sincronizar créditos no XUI também
                if (revenda_xui_id) {
                    await xuiApiCall('edit_user', { id: revenda_xui_id, credits: newCred });
                }
                creditsRemaining = newCred;
                console.log(`[CREDITO] Debitado ${creditCost} crédito(s) de ${revenda}. Saldo: ${newCred}`);
            }
        }

        // 3. Calcular data de expiração
        const parts = dur.split(' ');
        const amount = parseInt(parts[0]) || 30;
        const unit = (parts[1] || 'dias').toLowerCase();

        let date = new Date();
        if (unit.includes('hora')) {
            date.setHours(date.getHours() + amount);
        } else if (unit.includes('dia')) {
            date.setDate(date.getDate() + amount);
        } else if (unit.includes('mes') || unit.includes('mês')) {
            date.setMonth(date.getMonth() + amount);
        } else if (unit.includes('ano')) {
            date.setFullYear(date.getFullYear() + amount);
        }

        const xuiExpDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const localExpDate = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;

        const finalPassword = password && password.trim() !== '' ? password : Math.random().toString(36).slice(-6);

        // 4. Criar no XUI
        const xuiRes = await xuiApiCall('create_line', {
            username: user,
            password: finalPassword,
            package_id: plano_id || 1,
            max_connections: conn || 1,
            exp_date: xuiExpDate
        });
        
        console.log('XUI create_line response:', xuiRes);

        if (!xuiRes || xuiRes.status !== 'STATUS_SUCCESS') {
            // Reverter débito de crédito se XUI falhou
            if (revenda && revenda !== 'super-fuze' && creditCost > 0 && creditsRemaining !== null) {
                const restored = parseFloat((creditsRemaining + creditCost).toFixed(4));
                await db.query('UPDATE revendas SET cred=? WHERE user=?', [restored, revenda]);
                console.log(`[CREDITO] Revertido ${creditCost} crédito(s) para ${revenda} (falha XUI)`);
            }
            return res.status(400).json({ success: false, error: 'Falha ao criar linha no XUI: ' + (xuiRes?.error || 'erro desconhecido') });
        }

        const xuiId = xuiRes.data?.id ? parseInt(xuiRes.data.id) : null;

        // 5. Salvar no banco local (Cache)
        const [result] = await db.query(
            'INSERT INTO clientes (user, nome, wpp, srv, plano, plano_id, exp, conn, status, revenda, valor, xui_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [user, nome || '', wpp || '', srv, plano, plano_id || 0, localExpDate, conn || 1, status || 'Ativo', revenda, valor || '', xuiId]
        );
        res.json({ success: true, id: result.insertId, xui_response: xuiRes, exp: localExpDate, credits_remaining: creditsRemaining });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


router.put('/clientes/:id', async (req, res) => {
    try {
        const { user, nome, wpp, srv, plano, plano_id, exp, conn, status, revenda, valor } = req.body;
        await db.query(
            'UPDATE clientes SET user=?, nome=?, wpp=?, srv=?, plano=?, plano_id=?, exp=?, conn=?, status=?, revenda=?, valor=? WHERE id=?',
            [user, nome || '', wpp || '', srv, plano, plano_id || 0, exp, conn || 1, status || 'Ativo', revenda, valor || '', req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clientes/:id', async (req, res) => {
    try {
        // Buscar o xui_id para deletar no XUI
        const [cli] = await db.query('SELECT xui_id, user FROM clientes WHERE id=?', [req.params.id]);
        if (cli.length > 0 && cli[0].xui_id) {
            const xuiRes = await xuiApiCall('delete_line', { id: cli[0].xui_id });
            console.log('XUI delete_line response for xui_id', cli[0].xui_id, ':', xuiRes);
        } else {
            console.log(`xui_id não encontrado no cache para a exclusão do cliente ID ${req.params.id}`);
        }

        await db.query('DELETE FROM clientes WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CRUD Revendas ---
router.post('/revendas', async (req, res) => {
    try {
        console.log('Payload recebido em /revendas:', req.body);
        const { user, password, nome, wpp, email, cred, nivel, status, master, clientes } = req.body;

        // 1. Criar a Revenda no XUI (member_group_id: 2 = reseller)
        const finalPassword = password && password.trim() !== '' ? password : Math.random().toString(36).slice(-6);
        const xuiRes = await xuiApiCall('create_user', {
            username: user,
            password: finalPassword,
            email: email || '',
            member_group_id: 2,
            credits: cred || 0,
            owner_id: 4 // linqui756
        });
        
        console.log('XUI create_user response:', xuiRes);
        const xuiId = xuiRes && xuiRes.data && xuiRes.data.id ? parseInt(xuiRes.data.id) : null;

        // 2. Salvar no banco local
        const [result] = await db.query(
            'INSERT INTO revendas (user, nome, wpp, email, cred, nivel, status, master, clientes, xui_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [user, nome || '', wpp || '', email || '', cred || 0, nivel || 1, status || 'Ativo', master || '', clientes || 0, xuiId]
        );
        res.json({ success: true, id: result.insertId, xui_response: xuiRes });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/revendas/:id', async (req, res) => {
    try {
        const { user, nome, wpp, email, cred, nivel, status, master, clientes } = req.body;
        await db.query(
            'UPDATE revendas SET user=?, nome=?, wpp=?, email=?, cred=?, nivel=?, status=?, master=?, clientes=? WHERE id=?',
            [user, nome || '', wpp || '', email || '', cred || 0, nivel || 1, status || 'Ativo', master || '', clientes || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/revendas/:id', async (req, res) => {
    try {
        // Buscar o xui_id para deletar no XUI
        const [rev] = await db.query('SELECT xui_id FROM revendas WHERE id=?', [req.params.id]);
        if (rev.length > 0 && rev[0].xui_id) {
            const xuiRes = await xuiApiCall('delete_user', { id: rev[0].xui_id });
            console.log('XUI delete_user response for xui_id', rev[0].xui_id, ':', xuiRes);
        } else {
            console.log(`xui_id não encontrado no cache para a exclusão da revenda ID ${req.params.id}`);
        }

        await db.query('DELETE FROM revendas WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
