// =====================================================
// STATE
// =====================================================
let ROLE = null; // 'admin' | 'revenda' | 'usuario'
let CUR_USER = {};
let pixInterval = null;
let selectedPlan = null;

// DATA STORE
let DB = {
  credits: { admin: Infinity, revenda: 0, revenda2: 0 },
  clientes: [],
  revendas: [],
  planos: [],
  pagamentos: [],
  editingId: null,
  deleteAction: null,
};

async function loadData() {
  try {
    const res = await fetch('/api/dashboard-data');
    const data = await res.json();
    Object.assign(DB, data);
    // Sincronizar créditos reais do usuário logado
    if (CUR_USER && CUR_USER.user && DB.creditMap) {
      if (DB.creditMap[CUR_USER.user] !== undefined) {
        CUR_USER.credits = parseFloat(DB.creditMap[CUR_USER.user]);
        const el = document.getElementById('SIDEBAR-CRED');
        if (el) el.textContent = CUR_USER.credits;
      }
    }
  } catch(e) {
    console.error('Erro ao buscar dados:', e);
  }
}

window.addEventListener('DOMContentLoaded', loadData);

// =====================================================
// LOGIN
// =====================================================
const USERS = {
  'admin':   { user:'super-fuze',  role:'admin',   display:'Administrador Master',  credits:Infinity },
  'revenda': { user:'Slayker',     role:'revenda',  display:'Revenda Nível 1',       credits:3 },
  'usuario': { user:'juaniptv1',   role:'usuario',  display:'Cliente',               credits:0, plano:'1 MES SEM ADULTOS', exp:'26/05/2026', srv:'Fz Play' },
};

async function doLogin(type) {
  const u = document.getElementById('LU').value.trim();
  const p = document.getElementById('LP').value;

  // Demo shortcuts (mantém compatibilidade com os botões demo)
  if (type === 'admin')   { return _applyLogin({ user: 'super-fuze', role: 'admin',   display: 'Administrador Master', credits: Infinity }); }
  if (type === 'revenda') { return _applyLogin({ user: 'Slayker',    role: 'revenda',  display: 'Revenda Nível 1',      credits: DB.credits?.revenda || 0 }); }
  if (type === 'usuario') { return _applyLogin({ user: 'juaniptv1',  role: 'usuario',  display: 'Cliente',              credits: 0, plano:'1 MES SEM ADULTOS', exp:'26/05/2026', srv:'Fz Play' }); }

  // Login manual — autentica via backend/XUI
  if (!u) { toast('Informe o usuário', 'e'); return; }
  if (!p) { toast('Informe a senha', 'e'); return; }

  try {
    const btn = document.querySelector('.bp.w-100');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autenticando...'; }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Entrar'; }

    if (!data.success) {
      toast(data.error || 'Usuário ou senha incorretos', 'e');
      return;
    }

    _applyLogin(data.user);
  } catch (e) {
    console.error(e);
    toast('Erro de conexão com o servidor', 'e');
  }
}

function _applyLogin(userData) {
  ROLE = userData.role;
  CUR_USER = userData;
  document.getElementById('LOGIN-SCREEN').style.display='none';
  document.getElementById('APP-PANEL').style.display='block';
  document.getElementById('SB-USER').textContent = CUR_USER.user;
  document.getElementById('SB-ROLE').textContent = CUR_USER.display;
  document.getElementById('PTH-ROLE').textContent = CUR_USER.display;
  document.getElementById('FOOTER-ROLE').innerHTML = `<span class="ba ${ROLE==='admin'?'ba-b':ROLE==='revenda'?'ba-p':'ba-g'}">${CUR_USER.display}</span>`;
  if (ROLE === 'admin') {
    document.getElementById('SB-CRED').innerHTML = '<i class="fas fa-infinity" style="font-size:10px"></i> Créditos Ilimitados';
    document.getElementById('SB-BADGE').innerHTML = '<span style="font-size:10px;background:rgba(255,168,0,.15);color:#ffa800;padding:2px 7px;border-radius:4px;font-weight:600"><i class="fas fa-triangle-exclamation me-1"></i>2FA Off</span>';
  } else if (ROLE === 'revenda') {
    document.getElementById('SB-CRED').innerHTML = `<i class="fas fa-coins" style="font-size:10px;color:#009ef7"></i> <span id="SIDEBAR-CRED">${CUR_USER.credits ?? 0}</span> créditos`;
  } else {
    document.getElementById('SB-CRED').innerHTML = `<i class="fas fa-calendar-check" style="font-size:10px;color:#0bb783"></i> Vence: ${CUR_USER.exp || '—'}`;
  }
  buildSidebar();
  buildMobileNav();
  navTo(ROLE==='usuario' ? 'u-dashboard' : 'dashboard');
  toast(`Bem-vindo, ${CUR_USER.user}!`, 's');
}

function doLogout() {
  ROLE = null; CUR_USER = {};
  document.getElementById('APP-PANEL').style.display='none';
  document.getElementById('LOGIN-SCREEN').style.display='block';
  document.getElementById('MAIN-CONTENT').innerHTML='';
}

function togglePwd() {
  const i = document.getElementById('LP');
  const e = document.getElementById('EYEI');
  i.type = i.type==='password'?'text':'password';
  e.className = i.type==='password'?'fas fa-eye':'fas fa-eye-slash';
}

// =====================================================
// SIDEBAR BUILDER
// =====================================================
function ml(icon, label, page, badge='') {
  return `<button class="ml" data-p="${page}" onclick="navTo('${page}')"><span class="mi"><i class="fas ${icon}"></i></span><span class="mt">${label}</span>${badge}</button>`;
}

function buildSidebar() {
  let html = '';
  if (ROLE === 'admin') {
    html += `<span class="ms">FUZE</span>
    ${ml('fa-gauge','Dashboard','dashboard')}
    ${ml('fa-flag','Avisos','avisos','<span class="mb mb-r ms-auto">2</span>')}
    ${ml('fa-headset','Tickets','tickets')}
    ${ml('fa-circle-user','Perfil','perfil')}
    ${ml('fa-lock','Segurança','seguranca')}
    ${ml('fa-right-from-bracket','Sair','')}
    <span class="ms">Clientes</span>
    ${ml('fa-users','Clientes','clientes')}
    ${ml('fa-tv','Conexões Ao Vivo','conexoes')}
    ${ml('fa-trash-can','Excluídos','clientes-excluidos')}
    ${ml('fa-user-shield','Auditoria','auditoria-clientes')}
    <span class="ms">Revendas</span>
    ${ml('fa-user','Revendas','revendas')}
    ${ml('fa-file-lines','Transações de Créditos','transacoes')}
    ${ml('fa-user-lock','Auditoria de Revendas','auditoria-revendas')}
    <span class="ms">Financeiro</span>
    ${ml('fa-money-bill','Renovações de Clientes','vendas-creditos')}
    <span class="ms">Sistema</span>
    ${ml('fa-computer','Servidores','servidores')}
    ${ml('fa-cube','Planos','planos')}
    ${ml('fa-cubes','Pacote de Créditos','pacote-creditos')}
    ${ml('fa-user-lock','Permissões','permissoes')}
    ${ml('fa-database','Restaurar Backup','restaurar-backup')}
    <span class="ms">Configurações</span>
    ${ml('fa-gears','Configurações','configuracoes')}
    <span class="ms">WhatsApp / Evolution</span>
    ${ml('fa-whatsapp fab','Instâncias Evolution','evo-instancias','<span class="mb mb-g ms-auto">Global</span>')}
    ${ml('fa-robot','Automações Globais','evo-automacoes')}
    ${ml('fa-message','Templates de Mensagem','evo-templates')}
    ${ml('fa-list-check','Fila de Mensagens','evo-fila','<span class="mb mb-r ms-auto">12</span>')}
    <span class="ms">🏆 Gamificação</span>
    ${ml('fa-trophy','Ranking de Revendas','rank-geral')}
    ${ml('fa-medal','Conquistas / Badges','rank-badges')}
    ${ml('fa-bullseye','Missões Ativas','rank-missoes')}
    ${ml('fa-sliders','Config. Gamificação','rank-config')}`;
  } else if (ROLE === 'revenda') {
    html += `<span class="ms">Painel</span>
    ${ml('fa-gauge','Dashboard','r-dashboard')}
    ${ml('fa-bell','Avisos','r-avisos')}
    ${ml('fa-circle-user','Meu Perfil','r-perfil')}
    ${ml('fa-lock','Segurança','r-seguranca')}
    ${ml('fa-right-from-bracket','Sair','')}
    <span class="ms">Clientes</span>
    ${ml('fa-users','Meus Clientes','r-clientes')}
    ${ml('fa-tv','Conexões Ao Vivo','r-conexoes')}
    ${ml('fa-trash-can','Excluídos','r-excluidos')}
    ${ml('fa-user-shield','Auditoria','r-auditoria')}
    <span class="ms">Revendas</span>
    ${ml('fa-user-tie','Sub-Revendas','r-revendas')}
    ${ml('fa-coins','Transferir Créditos','r-creditos')}
    ${ml('fa-person-circle-plus','Link de Indicação','r-link')}
    <span class="ms">Financeiro</span>
    ${ml('fa-money-bill','Renovações','r-renovacoes')}
    ${ml('fa-file-lines','Transações','r-transacoes')}
    <span class="ms">📱 WhatsApp / Automação</span>
    ${ml('fa-whatsapp fab','Minha Instância','r-evo')}
    ${ml('fa-robot','Cobranças Automáticas','r-automacao')}
    ${ml('fa-message','Meus Templates','r-templates')}
    ${ml('fa-history','Histórico de Envios','r-evo-logs')}
    <span class="ms">🏆 Meu Perfil de Revenda</span>
    ${ml('fa-trophy','Meu Ranking','r-ranking')}
    ${ml('fa-medal','Minhas Conquistas','r-conquistas')}`;
  } else {
    html += `<span class="ms">Minha Conta</span>
    ${ml('fa-gauge','Dashboard','u-dashboard')}
    ${ml('fa-calendar-check','Meu Plano','u-plano')}
    ${ml('fa-credit-card','Renovar / Pagar','u-renovar')}
    ${ml('fa-receipt','Histórico de Pagamentos','u-pagamentos')}
    ${ml('fa-tv','Minhas Conexões','u-conexoes')}
    ${ml('fa-circle-user','Meu Perfil','u-perfil')}
    ${ml('fa-lock','Segurança','u-seguranca')}
    ${ml('fa-headset','Suporte','u-suporte')}
    ${ml('fa-right-from-bracket','Sair','')}`;
  }
  document.getElementById('SIDEBAR-MENU').innerHTML = html;
}

function buildMobileNav() {
  let html = '';
  if (ROLE === 'admin') {
    html = `
    <button class="mni" id="mn-dashboard" onclick="navTo('dashboard')"><i class="fas fa-gauge"></i><span>Home</span></button>
    <button class="mni" id="mn-clientes" onclick="navTo('clientes')"><i class="fas fa-users"></i><span>Clientes</span></button>
    <button class="mni" id="mn-revendas" onclick="navTo('revendas')"><i class="fas fa-user"></i><span>Revendas</span></button>
    <button class="mni" id="mn-planos" onclick="navTo('planos')"><i class="fas fa-cube"></i><span>Planos</span></button>
    <button class="mni" onclick="toggleSB()"><i class="fas fa-bars"></i><span>Menu</span></button>`;
  } else if (ROLE === 'revenda') {
    html = `
    <button class="mni" id="mn-r-dashboard" onclick="navTo('r-dashboard')"><i class="fas fa-gauge"></i><span>Home</span></button>
    <button class="mni" id="mn-r-clientes" onclick="navTo('r-clientes')"><i class="fas fa-users"></i><span>Clientes</span></button>
    <button class="mni" id="mn-r-revendas" onclick="navTo('r-revendas')"><i class="fas fa-user-tie"></i><span>Revendas</span></button>
    <button class="mni" id="mn-r-creditos" onclick="navTo('r-creditos')"><i class="fas fa-coins"></i><span>Créditos</span></button>
    <button class="mni" onclick="toggleSB()"><i class="fas fa-bars"></i><span>Menu</span></button>`;
  } else {
    html = `
    <button class="mni" id="mn-u-dashboard" onclick="navTo('u-dashboard')"><i class="fas fa-gauge"></i><span>Home</span></button>
    <button class="mni" id="mn-u-plano" onclick="navTo('u-plano')"><i class="fas fa-calendar-check"></i><span>Plano</span></button>
    <button class="mni" id="mn-u-renovar" onclick="navTo('u-renovar')"><i class="fas fa-credit-card"></i><span>Pagar</span></button>
    <button class="mni" id="mn-u-pagamentos" onclick="navTo('u-pagamentos')"><i class="fas fa-receipt"></i><span>Pagamentos</span></button>
    <button class="mni" onclick="toggleSB()"><i class="fas fa-bars"></i><span>Menu</span></button>`;
  }
  document.getElementById('MOB-NAV').innerHTML = html;
}

// =====================================================
// NAVIGATION
// =====================================================
const PAGE_TITLES = {
  dashboard:'Dashboard', clientes:'Clientes', revendas:'Revendas', planos:'Planos', servidores:'Servidores',
  conexoes:'Conexões Ao Vivo', 'clientes-excluidos':'Clientes Excluídos', transacoes:'Transações de Créditos',
  'vendas-creditos':'Renovações de Clientes', 'auditoria-clientes':'Auditoria de Clientes',
  'auditoria-revendas':'Auditoria de Revendas', 'pacote-creditos':'Pacote de Créditos',
  permissoes:'Permissões', 'restaurar-backup':'Restaurar Backup', configuracoes:'Configurações',
  avisos:'Avisos', tickets:'Tickets de Suporte', perfil:'Perfil', seguranca:'Segurança da Conta',
  'evo-instancias':'Evolution — Instâncias','evo-automacoes':'Evolution — Automações',
  'evo-templates':'Evolution — Templates','evo-fila':'Evolution — Fila de Mensagens',
  'rank-geral':'Ranking de Revendas','rank-badges':'Conquistas & Badges',
  'rank-missoes':'Missões Ativas','rank-config':'Config. Gamificação',
  'r-evo':'Minha Instância WhatsApp','r-automacao':'Cobranças Automáticas',
  'r-templates':'Meus Templates','r-evo-logs':'Histórico de Envios',
  'r-ranking':'Meu Ranking','r-conquistas':'Minhas Conquistas', 'r-revendas':'Sub-Revendas',
  'r-creditos':'Transferir Créditos', 'r-conexoes':'Conexões Ao Vivo', 'r-renovacoes':'Renovações',
  'r-transacoes':'Transações', 'r-link':'Link de Indicação', 'r-perfil':'Perfil',
  'r-seguranca':'Segurança', 'r-avisos':'Avisos', 'r-excluidos':'Excluídos', 'r-auditoria':'Auditoria',
  'u-dashboard':'Meu Painel', 'u-plano':'Meu Plano', 'u-renovar':'Renovar / Pagar',
  'u-pagamentos':'Histórico de Pagamentos', 'u-conexoes':'Minhas Conexões',
  'u-perfil':'Meu Perfil', 'u-seguranca':'Segurança', 'u-suporte':'Suporte',
};

let curPage = '';
function navTo(page) {
  if (!page) { doLogout(); return; }
  curPage = page;
  document.title = (PAGE_TITLES[page] || page) + ' | FUZE';
  document.getElementById('PTH').textContent = PAGE_TITLES[page] || page;
  document.querySelectorAll('.ml').forEach(b => {
    b.classList.remove('active');
    if (b.dataset.p === page) b.classList.add('active');
  });
  document.querySelectorAll('.mni').forEach(b => b.classList.remove('active'));
  const mn = document.getElementById('mn-'+page);
  if (mn) mn.classList.add('active');
  if (window.innerWidth < 992) closeSB();
  document.getElementById('CW').scrollTop = 0;
  renderPage(page);
}

// =====================================================
// PAGE RENDERER
// =====================================================
function renderPage(p) {
  const mc = document.getElementById('MAIN-CONTENT');
  let html = '';

  if (p === 'dashboard') html = renderAdminDash();
  else if (p === 'clientes') html = renderClientes();
  else if (p === 'revendas') html = renderRevendas();
  else if (p === 'planos') html = renderPlanos();
  else if (p === 'servidores') html = renderServidores();
  else if (p === 'conexoes') html = renderConexoes();
  else if (p === 'transacoes') html = renderTransacoes();
  else if (p === 'vendas-creditos') html = renderVendas();
  else if (p === 'pacote-creditos') html = renderPacotes();
  else if (p === 'clientes-excluidos') html = renderExcluidos();
  else if (p === 'auditoria-clientes') html = renderAudCli();
  else if (p === 'auditoria-revendas') html = renderAudRev();
  else if (p === 'permissoes') html = renderPermissoes();
  else if (p === 'restaurar-backup') html = renderBackup();
  else if (p === 'avisos' || p === 'r-avisos') html = renderAvisos();
  else if (p === 'tickets' || p === 'u-suporte') html = renderTickets();
  else if (p === 'perfil' || p === 'r-perfil' || p === 'u-perfil') html = renderPerfil();
  else if (p === 'seguranca' || p === 'r-seguranca' || p === 'u-seguranca') html = renderSeguranca();
  else if (p === 'configuracoes') html = renderConfig();
  // REVENDA
  else if (p === 'r-dashboard') html = renderRevendaDash();
  else if (p === 'r-clientes') html = renderRevendaClientes();
  else if (p === 'r-revendas') html = renderSubRevendas();
  else if (p === 'r-creditos') html = renderTransfCreditos();
  else if (p === 'r-conexoes') html = renderConexoes();
  else if (p === 'r-renovacoes') html = renderVendas();
  else if (p === 'r-transacoes') html = renderTransacoes();
  else if (p === 'r-link') html = renderLinkIndicacao();
  else if (p === 'evo-instancias') html = renderEvoInstancias();
  else if (p === 'evo-automacoes') html = renderEvoAutomacoes();
  else if (p === 'evo-templates') html = renderEvoTemplates();
  else if (p === 'evo-fila') html = renderEvoFila();
  else if (p === 'rank-geral') html = renderRanking();
  else if (p === 'rank-badges') html = renderBadgesAdmin();
  else if (p === 'rank-missoes') html = renderMissoes();
  else if (p === 'rank-config') html = renderRankConfig();
  else if (p === 'r-evo') html = renderRevendaEvo();
  else if (p === 'r-automacao') html = renderRevendaAutomacao();
  else if (p === 'r-templates') html = renderRevendaTemplates();
  else if (p === 'r-evo-logs') html = renderEvoLogs();
  else if (p === 'r-ranking') html = renderMeuRanking();
  else if (p === 'r-conquistas') html = renderMinhasConquistas();
  // USUARIO
  else if (p === 'u-dashboard') html = renderUsuarioDash();
  else if (p === 'u-plano') html = renderMeuPlano();
  else if (p === 'u-renovar') html = renderRenovar();
  else if (p === 'u-pagamentos') html = renderPagamentos();
  else if (p === 'u-conexoes') html = renderMinhasConexoes();
  else html = genericPage(PAGE_TITLES[p] || p);

  mc.innerHTML = html;
  // init charts after render
  setTimeout(() => {
    if (p==='dashboard') initAdminCharts();
    if (p==='r-dashboard') initRevChart();
  }, 80);
}

// =====================================================
// ADMIN PAGES
// =====================================================
function renderAdminDash() {
  return `
  <div class="row g-3 mb-3">
    <div class="col-6 col-xl-2"><div class="stat sg"><i class="fas fa-dollar-sign"></i><div class="sv">R$3.715</div><div class="sl">Receita Esperada 30d</div></div></div>
    <div class="col-6 col-xl-2"><div class="stat sb"><i class="fas fa-users"></i><div class="sv">${DB.clientes.length}</div><div class="sl">Clientes Ativos</div></div></div>
    <div class="col-6 col-xl-2"><div class="stat so"><i class="fas fa-user"></i><div class="sv">${DB.revendas.length}</div><div class="sl">Revendas Ativas</div></div></div>
    <div class="col-6 col-xl-2"><div class="stat sr"><i class="fas fa-tv"></i><div class="sv">73</div><div class="sl">Conexões Agora</div></div></div>
    <div class="col-6 col-xl-2"><div class="stat sp"><i class="fas fa-infinity"></i><div class="sv">∞</div><div class="sl">Créditos</div></div></div>
    <div class="col-6 col-xl-2"><div class="stat st"><i class="fas fa-server"></i><div class="sv">2/3</div><div class="sl">Servidores On</div></div></div>
  </div>
  <div class="row g-3">
    <div class="col-12 col-xl-8">
      <div class="card"><div class="ch"><span class="ct">Novos Clientes vs Expirados — Últimos 30d</span></div>
        <div class="cb"><div id="CH_ADMIN" style="min-height:200px"></div></div></div>
    </div>
    <div class="col-12 col-xl-4">
      <div class="card"><div class="ch"><span class="ct">Últimas Transações</span><button class="bp ms-auto" style="font-size:11px" onclick="navTo('transacoes')"><i class="fas fa-eye"></i></button></div>
        <div class="cb" style="padding:8px 12px">
          ${DB.clientes.slice(0,4).map(c=>`<div class="srvr">
            <div class="flex-grow-1"><div style="font-weight:600;color:var(--hd);font-size:12.5px">${c.user}</div>
              <div style="font-size:11px;color:var(--mu)">${c.plano} • ${c.revenda}</div></div>
            <span class="ba ${c.status==='Ativo'?'ba-g':c.status==='Trial'?'ba-o':'ba-r'}">${c.status}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="card">
        <div class="ch">
          <span class="ct">Clientes — Visão Geral</span>
          <button class="bp ms-auto" onclick="openModalCliente()"><i class="fas fa-plus"></i> Adicionar</button>
          <button class="bsec ms-2" onclick="navTo('clientes')"><i class="fas fa-table"></i> Ver Todos</button>
        </div>
        <div style="overflow-x:auto">${clienteTable(DB.clientes.slice(0,4), true)}</div>
      </div>
    </div>
  </div>`;
}

function renderClientes() {
  return `
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-cli',this.value)"></div>
      <select class="fs" style="width:auto" onchange="filterTblCol('tbl-cli',5,this.value)">
        <option value="">Revenda</option>
        ${[...new Set(DB.revendas.map(r=>r.user))].map(r=>`<option>${r}</option>`).join('')}
      </select>
      <select class="fs" style="width:auto" onchange="filterTblCol('tbl-cli',4,this.value)">
        <option value="">Situação</option><option>Ativo</option><option>Trial</option><option>Expirado</option>
      </select>
    </div>
    <button class="bp" onclick="openModalCliente()"><i class="fas fa-plus"></i> Adicionar Cliente</button>
  </div>
  <div class="card">
    <div style="overflow-x:auto">${clienteTable(DB.clientes, true)}</div>
    <div class="pag"><span class="pi">Total: ${DB.clientes.length} clientes</span>
      <div class="pb"><button class="pbn a">1</button><button class="pbn">2</button></div></div>
  </div>`;
}

function clienteTable(list, showActions=true) {
  const canEdit = ROLE === 'admin' || ROLE === 'revenda';
  return `<table class="tbl" id="tbl-cli">
    <thead><tr><th>Usuário</th><th>Servidor/Plano</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Revenda</th>${showActions?'<th class="text-end">Ações</th>':''}</tr></thead>
    <tbody>
    ${list.map(c=>`<tr>
      <td><b style="color:var(--hd)">${c.user}</b>${c.nome?`<br><small style="color:var(--mu)">${c.nome}</small>`:''}</td>
      <td><small>${c.srv}</small><br><small style="color:var(--mu)">${c.plano}</small></td>
      <td><small>${c.exp}</small></td>
      <td>${c.valor}</td>
      <td><span class="ba ${c.status==='Ativo'?'ba-g':c.status==='Trial'?'ba-o':'ba-r'}">${c.status}</span></td>
      <td><small>${c.revenda}</small></td>
      ${showActions?`<td class="text-end"><div class="d-flex justify-content-end gap-1">
        <button class="ic ic-v" title="Detalhes" onclick="viewCliente(${c.id})"><i class="fas fa-eye"></i></button>
        ${canEdit?`<button class="ic ic-e" title="Editar" onclick="openModalCliente(${c.id})"><i class="fas fa-pencil"></i></button>
        <button class="ic ic-r" title="Renovar" onclick="openModalRenovar(${c.id})"><i class="fas fa-calendar-plus"></i></button>
        <button class="ic ic-d" title="Excluir" onclick="confirmDelete('cliente',${c.id},'${c.user}')"><i class="fas fa-trash-can"></i></button>`:''}
      </div></td>`:''}
    </tr>`).join('')}
    </tbody></table>`;
}

function renderRevendas() {
  return `
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-rev',this.value)"></div>
      <select class="fs" style="width:auto"><option>Situação</option><option>Ativo</option><option>Inativo</option></select>
    </div>
    <button class="bp" onclick="openModalRevenda()"><i class="fas fa-plus"></i> Adicionar Revenda</button>
  </div>
  <div class="card">
    <div style="overflow-x:auto">
      <table class="tbl" id="tbl-rev">
        <thead><tr><th>Usuário</th><th>Créditos</th><th>Clientes</th><th>Nível</th><th>Master</th><th>Situação</th><th class="text-end">Ações</th></tr></thead>
        <tbody>
        ${DB.revendas.map(r=>`<tr>
          <td><b style="color:var(--hd)">${r.user}</b>${r.nome?`<br><small style="color:var(--mu)">${r.nome}</small>`:''}</td>
          <td><span class="ba ${r.cred<=2?'ba-r':r.cred<=7?'ba-o':'ba-g'}">${r.cred}</span></td>
          <td>${r.clientes}</td>
          <td><span class="ba ba-b">Nível ${r.nivel}</span></td>
          <td><small>${r.master}</small></td>
          <td><span class="ba ba-g">${r.status}</span></td>
          <td class="text-end"><div class="d-flex justify-content-end gap-1">
            <button class="ic ic-v" title="Detalhes" onclick="viewRevenda(${r.id})"><i class="fas fa-eye"></i></button>
            <button class="ic ic-e" title="Editar" onclick="openModalRevenda(${r.id})"><i class="fas fa-pencil"></i></button>
            <button class="ic ic-s" title="Adicionar Créditos" onclick="openAddCred(${r.id})"><i class="fas fa-coins"></i></button>
            <button class="ic ic-d" title="Excluir" onclick="confirmDelete('revenda',${r.id},'${r.user}')"><i class="fas fa-trash-can"></i></button>
          </div></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="pag"><span class="pi">Total: ${DB.revendas.length} revendas</span></div>
  </div>`;
}

function renderPlanos() {
  return `
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-planos',this.value)"></div></div>
    <button class="bp" onclick="toast('Adicionar plano — ação disponível no backend real','i')"><i class="fas fa-plus"></i> Adicionar Plano</button>
  </div>
  <div class="card">
    <div style="overflow-x:auto">
      <table class="tbl" id="tbl-planos">
        <thead><tr><th>Servidor</th><th>Plano</th><th>Teste</th><th>Créditos</th><th>Conexões</th><th>Duração</th><th>Valor</th><th class="text-end">Ações</th></tr></thead>
        <tbody>
        ${DB.planos.map(p=>`<tr>
          <td><span class="ba ba-b">${p.srv}</span></td>
          <td><b>${p.nome}</b></td>
          <td><span class="ba ${p.teste?'ba-o':'ba-r'}">${p.teste?'Sim':'Não'}</span></td>
          <td>${p.cred}</td><td>${p.conn}</td><td>${p.dur}</td><td>${p.valor}</td>
          <td class="text-end"><div class="d-flex justify-content-end gap-1">
            <button class="ic ic-e" onclick="toast('Editando plano ${p.nome}','i')"><i class="fas fa-pencil"></i></button>
            <button class="ic ic-v" onclick="toast('Copiando plano ${p.nome}','i')"><i class="fas fa-copy"></i></button>
            <button class="ic ic-d" onclick="confirmDelete('plano',${p.id},'${p.nome}')"><i class="fas fa-trash-can"></i></button>
          </div></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderServidores() {
  return `
  <div class="tlb"><div></div><button class="bp" onclick="toast('Adicionar servidor — backend real necessário','i')"><i class="fas fa-plus"></i> Adicionar Servidor</button></div>
  <div class="card">
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Nome</th><th>Situação</th><th>Tipo</th><th>Conexão</th><th>Ordem</th><th class="text-end">Ações</th></tr></thead>
        <tbody>
          <tr><td><b>Fz Play</b></td><td><span class="ba ba-g">Ativo</span></td><td><span class="ba ba-b">XUIONE</span></td><td><span class="ba ba-t">IPTV</span></td><td>0</td>
            <td class="text-end"><div class="d-flex justify-content-end gap-1"><button class="ic ic-e" onclick="toast('Editar servidor Fz Play','i')"><i class="fas fa-pencil"></i></button><button class="ic ic-d" onclick="toast('Exclusão protegida — servidor em uso','e')"><i class="fas fa-trash-can"></i></button></div></td></tr>
          <tr><td><b>Max Player</b></td><td><span class="ba ba-g">Ativo</span></td><td><span class="ba ba-b">MAXPLAYER</span></td><td><span class="ba ba-t">TV</span></td><td>1</td>
            <td class="text-end"><div class="d-flex justify-content-end gap-1"><button class="ic ic-e" onclick="toast('Editar servidor Max Player','i')"><i class="fas fa-pencil"></i></button><button class="ic ic-d" onclick="toast('Exclusão protegida — servidor em uso','e')"><i class="fas fa-trash-can"></i></button></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderConexoes() {
  const conex = [
    {user:'4342one4342tv',conn:'1/2',rev:'SPaulo929305',canal:'Um Milagre S02E78',tempo:'0h 01m 21s',dev:'samsung-agent/1.1'},
    {user:'7731533',conn:'1/2',rev:'R3Veug3427',canal:'TELECINE FUN FHD³',tempo:'0h 01m 32s',dev:'fzplay/1.1.149 (Android 10)'},
    {user:'09022026',conn:'1/2',rev:'hf1982',canal:'GLOBO SAO PAULO FHD',tempo:'0h 01m 47s',dev:'Mozilla/5.0 (Web0S; SmartTV)'},
    {user:'g9gRKgwd',conn:'1/2',rev:'Willgner7',canal:'PANICO NA FLORESTA S01E04',tempo:'0h 01m 55s',dev:'Roku/DVP-15.2'},
    {user:'8364apk8364',conn:'1/2',rev:'SPaulo929305',canal:'CARTOON NETWORK FHD²',tempo:'0h 02m 15s',dev:'com.haxapps.ibsmart'},
    {user:'GGrRVTa9',conn:'1/2',rev:'Robson1912',canal:'Post Mortem Fotos do Alem',tempo:'0h 02m 40s',dev:'fzplay'},
  ];
  return `
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-con',this.value)"></div></div>
    <button class="bp" onclick="toast('Lista atualizada!','s')"><i class="fas fa-rotate-right"></i> Atualizar</button>
  </div>
  <div class="info-b"><i class="fas fa-tv me-2" style="color:#009ef7"></i><b>73 conexões ativas</b> agora • Fz Play: 54 • Max Player: 19</div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-con">
      <thead><tr><th>Usuário</th><th>Conn/Máx</th><th>Revenda</th><th>Assistindo</th><th>Tempo</th><th>Dispositivo</th><th></th></tr></thead>
      <tbody>${conex.map(c=>`<tr>
        <td><b>${c.user}</b></td>
        <td><span class="ba ba-o">${c.conn}</span></td>
        <td>${c.rev}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.canal}</td>
        <td><span class="ba ba-g">${c.tempo}</span></td>
        <td><small style="color:var(--mu);font-size:10.5px">${c.dev}</small></td>
        <td><button class="ic ic-d" title="Derrubar" onclick="confirmDelete('conexao',0,'${c.user}')"><i class="fas fa-xmark"></i></button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderTransacoes() {
  const trans = [
    {dt:'27/04/2026, 17:38',cred:'-1',tipo:'Venda Débito',dono:'Slayker',b4:4,a4:3,cli:'34TXJTbt'},
    {dt:'27/04/2026, 14:22',cred:'+10',tipo:'Transferência',dono:'super-fuze',b4:100000,a4:99990,cli:'Willgner7'},
    {dt:'27/04/2026, 12:11',cred:'-1',tipo:'Venda Débito',dono:'R3VDaniel9468',b4:7,a4:6,cli:'30maurizio8050'},
    {dt:'27/04/2026, 10:27',cred:'-1',tipo:'Venda Débito',dono:'Slayker',b4:5,a4:4,cli:'14157559'},
    {dt:'27/04/2026, 10:26',cred:'-1',tipo:'Venda Débito',dono:'elson',b4:7,a4:6,cli:'IANIPTV'},
    {dt:'27/04/2026, 10:03',cred:'-1',tipo:'Venda Débito',dono:'super-fuze',b4:100000,a4:99999,cli:'89679658'},
  ];
  return `
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-tr',this.value)"></div>
      <select class="fs" style="width:auto"><option>Tipo</option><option>Venda Débito</option><option>Transferência</option></select>
    </div>
    <button class="bp" onclick="toast('Exportando CSV...','i')"><i class="fas fa-file-export"></i> Exportar</button>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-tr">
      <thead><tr><th>Data</th><th>Créditos</th><th>Tipo</th><th>Dono</th><th>Antes</th><th>Depois</th><th>Cliente/Revenda</th></tr></thead>
      <tbody>${trans.map(t=>`<tr>
        <td><small>${t.dt}</small></td>
        <td><span class="ba ${t.cred.startsWith('+')?'ba-g':'ba-r'}">${t.cred}</span></td>
        <td><span class="ba ${t.tipo==='Transferência'?'ba-t':'ba-o'}">${t.tipo}</span></td>
        <td><b>${t.dono}</b></td><td>${t.b4}</td><td>${t.a4}</td><td><b>${t.cli}</b></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderVendas() {
  return `
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-vend',this.value)"></div>
      <select class="fs" style="width:auto"><option>Situação</option><option>Pago</option><option>Aguardando</option></select>
    </div>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-vend">
      <thead><tr><th>Revenda</th><th>Nº Pedido</th><th>Data</th><th>Situação</th><th>Plano</th><th>Forma Pagto</th><th>Total</th></tr></thead>
      <tbody>${DB.pagamentos.map(p=>`<tr>
        <td><b>${p.user}</b></td>
        <td><small>${p.id}</small></td>
        <td><small>${p.data}</small></td>
        <td><span class="ba ${p.status==='Pago'?'ba-g':'ba-o'}">${p.status}</span></td>
        <td><small>${p.plano}</small></td>
        <td>Mercado Pago</td>
        <td><b>${p.valor}</b></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderPacotes() {
  const packs = [{cred:10,vunit:'R$12,00',total:'R$120,00'},{cred:50,vunit:'R$10,00',total:'R$500,00'},{cred:100,vunit:'R$9,50',total:'R$950,00'},{cred:500,vunit:'R$8,75',total:'R$4.375,00'}];
  return `
  <div class="tlb"><div></div><button class="bp" onclick="toast('Adicionar pacote de créditos','i')"><i class="fas fa-plus"></i> Adicionar Pacote</button></div>
  <div class="row g-3 mb-3">
    ${packs.map(p=>`<div class="col-6 col-md-3">
      <div style="background:var(--ibg);border:2px solid var(--brd);border-radius:10px;padding:18px;text-align:center;cursor:pointer" onmouseenter="this.style.borderColor='rgba(0,158,247,.5)'" onmouseleave="this.style.borderColor='var(--brd)'">
        <div style="font-size:26px;font-weight:800;color:var(--hd)">${p.cred}</div>
        <div style="font-size:11px;color:var(--mu);margin:3px 0 10px">Créditos</div>
        <div style="font-size:18px;font-weight:700;color:#009ef7">${p.total}</div>
        <div style="font-size:11px;color:var(--mu)">${p.vunit}/un</div>
        <button class="bp mt-2 w-100 justify-content-center" style="font-size:11px" onclick="toast('Comprando ${p.cred} créditos...','i')"><i class="fas fa-cart-shopping"></i> Comprar</button>
      </div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="ch"><span class="ct">Tabela de Pacotes</span></div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Créditos</th><th>Valor/Un</th><th>Total</th><th>Meu Mínimo/Un</th><th>Meu Total</th><th class="text-end">Ações</th></tr></thead>
        <tbody>${packs.map(p=>`<tr><td><b>${p.cred}</b></td><td>${p.vunit}</td><td>${p.total}</td><td>—</td><td>—</td>
          <td class="text-end"><div class="d-flex justify-content-end gap-1">
            <button class="ic ic-e" onclick="toast('Editando pacote ${p.cred} créditos','i')"><i class="fas fa-pencil"></i></button>
            <button class="ic ic-d" onclick="confirmDelete('pacote',0,'${p.cred} créditos')"><i class="fas fa-trash-can"></i></button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

function renderExcluidos() {
  const excl = [
    {user:'limA25lima',srv:'Max Player',plano:'Max Anual',rev:'#RonyR3v',venc:'26/04/2027',excl_em:'26/04/2026'},
    {user:'hX2Jabk6',srv:'Max Player',plano:'Max Anual',rev:'#RonyR3v',venc:'25/04/2027',excl_em:'26/04/2026'},
    {user:'hX2Jabk6',srv:'Fz Play',plano:'TESTE COMPLETO',rev:'#RonyR3v',venc:'26/04/2026',excl_em:'26/04/2026'},
    {user:'felipe1298',srv:'Fz Play',plano:'TESTE COMPLETO',rev:'R3VRenan9615',venc:'25/04/2026',excl_em:'26/04/2026'},
  ];
  return `
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-excl',this.value)"></div></div>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-excl">
      <thead><tr><th>Usuário</th><th>Servidor</th><th>Plano</th><th>Vencimento</th><th>Excluído em</th><th></th></tr></thead>
      <tbody>${excl.map(c=>`<tr>
        <td><b>${c.user}</b><br><small style="color:var(--mu)">${c.rev}</small></td>
        <td><span class="ba ba-b">${c.srv}</span></td><td><small>${c.plano}</small></td>
        <td><small>${c.venc}</small></td><td><small style="color:var(--mu)">${c.excl_em}</small></td>
        <td><button class="ic ic-s" title="Restaurar" onclick="toast('Cliente ${c.user} restaurado com sucesso!','s')"><i class="fas fa-rotate-left"></i></button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderAudCli() {
  const aud = [
    {dt:'27/04/2026, 17:38',rev:'Slayker',cli:'34TXJTbt',acao:'Atualizado',det:'Renovado 24/04→27/05/2026',ip:'163.116.228.136'},
    {dt:'27/04/2026, 16:03',rev:'Slayker',cli:'J3ETcVva',acao:'Excluído',det:'Vencimento 25/03/2026',ip:'163.116.228.136'},
    {dt:'27/04/2026, 16:02',rev:'Slayker',cli:'fb7rxJ4Y',acao:'Excluído',det:'Vencimento 17/03/2026',ip:'163.116.228.136'},
    {dt:'27/04/2026, 14:22',rev:'super-fuze',cli:'Willgner7',acao:'Criado',det:'Nova revenda criada',ip:'177.184.138.234'},
  ];
  return `<div class="card"><div style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Data/Hora</th><th>Revenda</th><th>Cliente</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
      <tbody>${aud.map(a=>`<tr>
        <td><small>${a.dt}</small></td><td><b>${a.rev}</b></td><td><b>${a.cli}</b></td>
        <td><span class="ba ${a.acao==='Criado'?'ba-g':a.acao==='Excluído'?'ba-r':'ba-o'}">${a.acao}</span></td>
        <td><small style="color:var(--mu)">${a.det}</small></td>
        <td><small style="color:var(--mu)">${a.ip}</small></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderAudRev() {
  const aud = [
    {dt:'27/04/2026, 14:22',rev:'super-fuze',af:'Willgner7',acao:'Créditos Adicionados',ip:'177.184.138.234'},
    {dt:'26/04/2026, 13:56',rev:'super-fuze',af:'Geovane',acao:'Créditos Adicionados',ip:'170.231.58.138'},
    {dt:'25/04/2026, 13:27',rev:'SPaulo929305',af:'R3VDaniel9468',acao:'Créditos Adicionados',ip:'170.231.58.228'},
  ];
  return `<div class="card"><div style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Data/Hora</th><th>Revenda</th><th>Afetada</th><th>Ação</th><th>IP</th></tr></thead>
      <tbody>${aud.map(a=>`<tr>
        <td><small>${a.dt}</small></td><td><b>${a.rev}</b></td><td><b>${a.af}</b></td>
        <td><span class="ba ba-o">${a.acao}</span></td>
        <td><small style="color:var(--mu)">${a.ip}</small></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderPermissoes() {
  return `
  <div class="tlb"><div></div><button class="bp" onclick="toast('Criar nova permissão','i')"><i class="fas fa-plus"></i> Nova Permissão</button></div>
  <div class="row g-3">
    <div class="col-12 col-md-6">
      <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:14px 16px">
        <div style="font-weight:700;color:var(--hd);margin-bottom:10px"><i class="fas fa-crown me-2" style="color:#ffa800"></i>Admin</div>
        ${[['Gerenciar Clientes','✓ Ver','✓ Criar','✓ Editar','✓ Excluir'],['Gerenciar Revendas','✓ Ver','✓ Criar','✓ Editar','✓ Excluir'],['Configurações','✓ Acesso Total']].map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--brd)"><span style="font-size:12.5px">${r[0]}</span><div class="d-flex gap-1 flex-wrap">${r.slice(1).map(b=>`<span class="ba ba-g" style="font-size:9px">${b}</span>`).join('')}</div></div>`).join('')}
        <div class="mt-2"><button class="ic ic-e" style="width:auto;padding:0 10px" onclick="toast('Editando permissão Admin','i')"><i class="fas fa-pencil me-1"></i>Editar</button></div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:14px 16px">
        <div style="font-weight:700;color:var(--hd);margin-bottom:10px"><i class="fas fa-headset me-2" style="color:#009ef7"></i>Atendimento</div>
        ${[['Gerenciar Clientes','✓ Ver','✓ Editar','✗ Criar','✗ Excluir'],['Gerenciar Revendas','✓ Ver','✗ Modificar'],['Configurações','✗ Sem Acesso']].map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--brd)"><span style="font-size:12.5px">${r[0]}</span><div class="d-flex gap-1 flex-wrap">${r.slice(1).map(b=>`<span class="ba ${b.startsWith('✓')?'ba-g':'ba-r'}" style="font-size:9px">${b}</span>`).join('')}</div></div>`).join('')}
        <div class="mt-2"><button class="ic ic-e" style="width:auto;padding:0 10px" onclick="toast('Editando permissão Atendimento','i')"><i class="fas fa-pencil me-1"></i>Editar</button></div>
      </div>
    </div>
  </div>`;
}

function renderBackup() {
  const bks = ['26/04/2026 03:00:32','25/04/2026 03:00:32','24/04/2026 03:00:31','20/04/2026 03:00:31','19/04/2026 03:00:31','12/04/2026 03:00:32','05/04/2026 03:00:30'];
  return `
  <div class="warn-b"><i class="fas fa-triangle-exclamation me-2" style="color:#ffa800"></i><b>Atenção:</b> Restaurar sobrescreve todos os dados. Defina uma nova senha obrigatoriamente.</div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Data do Backup</th><th>Tamanho</th><th>Tipo</th><th>Restaurar</th></tr></thead>
      <tbody>${bks.map((d,i)=>`<tr>
        <td><b>${d}</b></td><td>~${45-i} MB</td><td><span class="ba ba-b">Automático</span></td>
        <td><div class="d-flex gap-2 align-items-center flex-wrap">
          <input type="password" class="fc" placeholder="Nova senha" style="max-width:150px">
          <input type="password" class="fc" placeholder="Confirmar" style="max-width:150px">
          <div class="form-check mb-0 ms-1"><input class="form-check-input" type="checkbox" id="bk${i}"><label class="form-check-label ms-1" for="bk${i}" style="font-size:11.5px">Confirmar</label></div>
          <button class="bw" style="font-size:11px" onclick="if(document.getElementById('bk${i}').checked){toast('Restaurando backup de ${d}...','w')}else{toast('Marque a caixa de confirmação','e')}">
            <i class="fas fa-rotate-left"></i> Restaurar
          </button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

function renderAvisos() {
  return `<div class="card"><div class="cb">
    <div style="background:rgba(0,158,247,.08);border:1px solid rgba(0,158,247,.2);border-radius:7px;padding:11px 14px;margin-bottom:12px">
      <div class="d-flex align-items-start gap-2"><i class="fas fa-circle-info" style="color:#009ef7;font-size:16px;margin-top:1px"></i>
        <div><b style="color:#009ef7">Atualização v3.78 disponível</b>
          <p style="color:var(--tx);margin:4px 0 0;font-size:12.5px">Novas funcionalidades de BotBot e melhorias de performance.</p>
          <small style="color:var(--mu)">Há 2 dias</small></div></div>
    </div>
    <div style="background:rgba(255,168,0,.08);border:1px solid rgba(255,168,0,.2);border-radius:7px;padding:11px 14px">
      <div class="d-flex align-items-start gap-2"><i class="fas fa-triangle-exclamation" style="color:#ffa800;font-size:16px;margin-top:1px"></i>
        <div><b style="color:#ffa800">Manutenção programada</b>
          <p style="color:var(--tx);margin:4px 0 0;font-size:12.5px">Servidor Fz Play em manutenção 30/05/2026 02:00–04:00.</p>
          <small style="color:var(--mu)">Há 5 dias</small></div></div>
    </div>
  </div></div>`;
}

function renderTickets() {
  return `
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar"></div></div>
    <button class="bp" onclick="toast('Abrindo novo ticket...','i')"><i class="fas fa-plus"></i> Novo Ticket</button>
  </div>
  <div style="border:1px solid var(--brd);border-left:3px solid #f1416c;border-radius:8px;padding:12px 16px;margin-bottom:8px">
    <div class="d-flex justify-content-between align-items-start">
      <div><b style="color:var(--hd)">Problema na renovação do cliente</b><br><small style="color:var(--mu)">Por: elson • 27/04/2026</small></div>
      <span class="ba ba-r">Aguardando</span>
    </div>
    <p style="font-size:12.5px;color:var(--mu);margin:8px 0 0">Tentei renovar o cliente juaniptv1 mas está dando erro...</p>
  </div>
  <div style="border:1px solid var(--brd);border-left:3px solid #ffa800;border-radius:8px;padding:12px 16px;margin-bottom:8px">
    <div class="d-flex justify-content-between align-items-start">
      <div><b style="color:var(--hd)">Servidor Fz Play fora do ar</b><br><small style="color:var(--mu)">Por: carlos_rev • 26/04/2026</small></div>
      <span class="ba ba-o">Em Andamento</span>
    </div>
    <p style="font-size:12.5px;color:var(--mu);margin:8px 0 0">Meus clientes não conseguem conectar...</p>
  </div>
  <div style="border:1px solid var(--brd);border-left:3px solid #0bb783;border-radius:8px;padding:12px 16px">
    <div class="d-flex justify-content-between align-items-start">
      <div><b style="color:var(--hd)">Como configurar BotBot</b><br><small style="color:var(--mu)">Por: paula_iptv • 20/04/2026</small></div>
      <span class="ba ba-g">Resolvido</span>
    </div>
    <p style="font-size:12.5px;color:var(--mu);margin:8px 0 0">Gostaria de saber como configurar o BotBot...</p>
  </div>`;
}

function renderPerfil() {
  const u = CUR_USER;
  return `
  <div class="row g-3">
    <div class="col-12 col-md-4">
      <div class="card"><div class="cb text-center">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#009ef7,#7239ea);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:28px;color:#fff"><i class="fas fa-user"></i></div>
        <h5 style="color:var(--hd);margin:0 0 3px">${u.user}</h5>
        <p style="color:var(--mu);font-size:12px;margin:0">${u.display}</p>
        <div class="mt-2"><span class="ba ${ROLE==='admin'?'ba-b':ROLE==='revenda'?'ba-p':'ba-g'}">${u.display}</span></div>
      </div></div>
    </div>
    <div class="col-12 col-md-8">
      <div class="card"><div class="ch"><span class="ct">Informações da Conta</span></div>
        <div class="cb"><div class="row g-3">
          <div class="col-12 col-md-6"><label class="fl">Usuário</label><input type="text" class="fc" value="${u.user}"></div>
          <div class="col-12 col-md-6"><label class="fl">E-mail</label><input type="email" class="fc" placeholder="seu@email.com"></div>
          <div class="col-12 col-md-6"><label class="fl">Nome Completo</label><input type="text" class="fc" placeholder="Seu nome"></div>
          <div class="col-12 col-md-6"><label class="fl">WhatsApp</label><input type="text" class="fc" placeholder="+55 (00) 00000-0000"></div>
          <div class="col-12"><button class="bp" onclick="toast('Perfil salvo com sucesso!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
        </div></div>
      </div>
    </div>
  </div>`;
}

function renderSeguranca() {
  return `
  <div class="row g-3">
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-lock me-2"></i>Alterar Senha</span></div>
        <div class="cb">
          <div class="mb-3"><label class="fl">Senha Atual</label><input type="password" class="fc" placeholder="••••••••"></div>
          <div class="mb-3"><label class="fl">Nova Senha</label><input type="password" class="fc" id="newpwd" placeholder="Mínimo 6 caracteres"></div>
          <div class="mb-3"><label class="fl">Confirmar Nova Senha</label><input type="password" class="fc" id="newpwd2" placeholder="Repita a senha"></div>
          <button class="bp" onclick="if(document.getElementById('newpwd').value.length<6){toast('Senha deve ter mínimo 6 caracteres','e')}else if(document.getElementById('newpwd').value!==document.getElementById('newpwd2').value){toast('Senhas não conferem','e')}else{toast('Senha alterada com sucesso!','s')}"><i class="fas fa-key"></i> Alterar Senha</button>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-shield-halved me-2"></i>Autenticação em Dois Fatores (2FA)</span></div>
        <div class="cb">
          <div style="background:rgba(241,65,108,.08);border:1px solid rgba(241,65,108,.2);border-radius:7px;padding:11px 14px;margin-bottom:12px"><i class="fas fa-shield-xmark me-2" style="color:#f1416c"></i><b>2FA desativada</b> — Sua conta está menos segura.</div>
          <p style="color:var(--mu);font-size:12.5px">Escaneie o QR code com Google Authenticator para ativar.</p>
          <div style="text-align:center;margin-bottom:12px">
            <div style="width:120px;height:120px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:11px;color:#666;border:3px solid #f0f0f0">QR Code</div>
          </div>
          <button class="bp w-100 justify-content-center" onclick="toast('2FA ativado com sucesso!','s')"><i class="fas fa-shield-check"></i> Ativar 2FA</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderConfig() {
  return `
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'cfg1')">Geral</button>
    <button class="tab" onclick="switchTab(this,'cfg2')">Clientes</button>
    <button class="tab" onclick="switchTab(this,'cfg3')">Revendas</button>
    <button class="tab" onclick="switchTab(this,'cfg4')">Integrações</button>
    <button class="tab" onclick="switchTab(this,'cfg5')">Estilo</button>
  </div>
  <div class="tbc active" id="cfg1">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12 col-md-4"><label class="fl">Nome do Sistema</label><input type="text" class="fc" value="FUZE"></div>
      <div class="col-12 col-md-4"><label class="fl">Data Vencimento Painel</label><input type="date" class="fc" value="2027-04-27"></div>
      <div class="col-12 col-md-4"><label class="fl">Moeda</label><select class="fs"><option>BRL — Real</option><option>USD</option></select></div>
      <div class="col-12 col-md-6"><label class="fl">Telegram</label><input type="text" class="fc" placeholder="@usuario"></div>
      <div class="col-12 col-md-6"><label class="fl">WhatsApp</label><input type="text" class="fc" placeholder="+55 (00) 00000-0000"></div>
      <div class="col-12"><button class="bp" onclick="toast('Configurações salvas!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>
  <div class="tbc" id="cfg2">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12 col-md-6"><label class="fl">Formato usuário/senha</label><select class="fs"><option>Numérico</option><option>Letras</option><option>Misto</option></select></div>
      <div class="col-12 col-md-3"><label class="fl">Mínimo de Caracteres</label><input type="number" class="fc" value="4"></div>
      <div class="col-12 col-md-3"><label class="fl">Máximo Aleatório</label><input type="number" class="fc" value="8"></div>
      <div class="col-12"><button class="bp" onclick="toast('Config. de clientes salva!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>
  <div class="tbc" id="cfg3">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12"><label class="fl">Mensagem login inativo</label><textarea class="fc" rows="3" placeholder="Sua conta está inativa..."></textarea></div>
      <div class="col-12 col-md-4"><label class="fl">Créditos mínimos para criar revenda</label><input type="number" class="fc" value="5"></div>
      <div class="col-12 col-md-4"><label class="fl">Créditos mínimos para transferência</label><input type="number" class="fc" value="1"></div>
      <div class="col-12"><button class="bp" onclick="toast('Config. de revendas salva!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>
  <div class="tbc" id="cfg4">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12 col-md-8"><label class="fl">Webhook URL</label><input type="url" class="fc" placeholder="https://seu-webhook.com"></div>
      <div class="col-12 col-md-4"><label class="fl">Token</label><input type="password" class="fc" placeholder="Bearer token"></div>
      <div class="col-12"><div class="d-flex align-items-center gap-3"><span>Ativar Webhook</span><div class="form-check form-switch mb-0"><input class="form-check-input" type="checkbox"></div></div></div>
      <div class="col-12"><button class="bp" onclick="toast('Integrações salvas!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>
  <div class="tbc" id="cfg5">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12 col-md-6"><label class="fl">Tema Padrão</label><select class="fs" onchange="setTheme(this.value)"><option value="dark">Escuro</option><option value="light">Claro</option></select></div>
      <div class="col-12"><label class="fl">Cor Primária</label>
        <div class="d-flex gap-2 mt-1">
          ${[['#009ef7','Azul'],['#7239ea','Roxo'],['#0bb783','Verde'],['#f1416c','Rosa'],['#ffa800','Laranja']].map(([c,n])=>`<button onclick="setP('${c}')" style="width:30px;height:30px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer" title="${n}"></button>`).join('')}
        </div>
      </div>
      <div class="col-12 col-md-6"><label class="fl">Logo Dark</label><input type="file" class="fc" accept="image/*"></div>
      <div class="col-12 col-md-6"><label class="fl">Logo Light</label><input type="file" class="fc" accept="image/*"></div>
      <div class="col-12"><button class="bp" onclick="toast('Estilo salvo!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>`;
}

// =====================================================
// REVENDA PAGES
// =====================================================
function renderRevendaDash() {
  const myClis = DB.clientes.filter(c => c.revenda === CUR_USER.user);
  const mySubs = DB.revendas.filter(r => r.master === CUR_USER.user);
  const myCredits = CUR_USER.credits ?? 0;
  return `
  <div class="row g-3 mb-3">
    <div class="col-6 col-md-3"><div class="stat sb"><i class="fas fa-users"></i><div class="sv">${myClis.length}</div><div class="sl">Meus Clientes</div></div></div>
    <div class="col-6 col-md-3"><div class="stat sg"><i class="fas fa-coins"></i><div class="sv" id="DASH-CRED">${myCredits}</div><div class="sl">Créditos</div></div></div>
    <div class="col-6 col-md-3"><div class="stat so"><i class="fas fa-user-tie"></i><div class="sv">${mySubs.length}</div><div class="sl">Sub-Revendas</div></div></div>
    <div class="col-6 col-md-3"><div class="stat sp"><i class="fas fa-tv"></i><div class="sv">${myClis.filter(c=>c.status==='Ativo').length}</div><div class="sl">Clientes Ativos</div></div></div>
  </div>
  <div class="row g-3">
    <div class="col-12 col-md-7">
      <div class="card"><div class="ch"><span class="ct">Meus Clientes</span><button class="bp ms-auto" onclick="navTo('r-clientes')"><i class="fas fa-arrow-right"></i></button></div>
        <div style="overflow-x:auto">${clienteTable(myClis.slice(0,5), true)}</div>
      </div>
    </div>
    <div class="col-12 col-md-5">
      <div class="card mb-3"><div class="ch"><span class="ct">Meus Créditos</span></div>
        <div class="cb">
          <div style="background:linear-gradient(135deg,rgba(0,158,247,.12),rgba(114,57,234,.12));border:1px solid rgba(0,158,247,.25);border-radius:10px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px">
            <i class="fas fa-coins" style="font-size:28px;color:#009ef7"></i>
            <div><div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px">Créditos disponíveis</div>
              <div style="font-size:30px;font-weight:900;color:#009ef7" id="RCRED-DISP">${myCredits}</div></div>
          </div>
          <div style="font-size:12px;color:var(--mu);margin-bottom:10px">Cada crédito = 1 renovação de plano mensal (R$30)</div>
          <button class="bs w-100 justify-content-center" onclick="navTo('r-creditos')"><i class="fas fa-paper-plane"></i> Transferir Créditos para Sub-Revenda</button>
        </div>
      </div>
      <div class="card"><div class="ch"><span class="ct">Ações Rápidas</span></div>
        <div class="cb d-flex flex-column gap-2">
          <button class="bp w-100 justify-content-center" onclick="openModalCliente()"><i class="fas fa-user-plus"></i> Novo Cliente</button>
          <button class="bw w-100 justify-content-center" onclick="navTo('r-revendas')"><i class="fas fa-user-tie"></i> Gerenciar Sub-Revendas</button>
          <button class="bsec w-100 justify-content-center" onclick="navTo('r-conexoes')"><i class="fas fa-tv"></i> Ver Conexões Ao Vivo</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderRevendaClientes() {
  const myClis = DB.clientes.filter(c => c.revenda === CUR_USER.user);
  const myCredits = CUR_USER.credits ?? 0;
  return `
  <div class="info-b"><i class="fas fa-coins me-2" style="color:#009ef7"></i>Você tem <b id="RCRED-INFO">${myCredits} créditos</b> disponíveis. Cada plano mensal custa 1 crédito.</div>
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-rcli',this.value)"></div></div>
    <button class="bp" onclick="openModalCliente()"><i class="fas fa-plus"></i> Adicionar Cliente</button>
  </div>
  <div class="card">
    <div style="overflow-x:auto">${clienteTable(myClis, true).replace('tbl-cli','tbl-rcli')}</div>
    <div class="pag"><span class="pi">Total: ${myClis.length} clientes seus</span></div>
  </div>`;
}

function renderSubRevendas() {
  const subs = DB.revendas.filter(r=>r.master==='Slayker'||r.id<=2);
  return `
  <div class="info-b"><i class="fas fa-coins me-2" style="color:#009ef7"></i>Você tem <b>${DB.credits.revenda} créditos</b>. Você pode criar sub-revendas e transferir créditos para elas.</div>
  <div class="tlb">
    <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar"></div></div>
    <button class="bp" onclick="openModalRevenda()"><i class="fas fa-plus"></i> Criar Sub-Revenda</button>
  </div>
  <div class="card">
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Usuário</th><th>Créditos</th><th>Clientes</th><th>Situação</th><th class="text-end">Ações</th></tr></thead>
        <tbody>
          <tr><td><b>sub_rev_01</b><br><small style="color:var(--mu)">Sub-revenda Nível 2</small></td><td><span class="ba ba-o">3</span></td><td>5</td><td><span class="ba ba-g">Ativo</span></td>
            <td class="text-end"><div class="d-flex justify-content-end gap-1">
              <button class="ic ic-e" onclick="toast('Editando sub-revenda','i')"><i class="fas fa-pencil"></i></button>
              <button class="ic ic-s" onclick="openAddCred(1)"><i class="fas fa-coins"></i></button>
              <button class="ic ic-d" onclick="confirmDelete('revenda',0,'sub_rev_01')"><i class="fas fa-trash-can"></i></button>
            </div></td>
          </tr>
          <tr><td><b>sub_rev_02</b><br><small style="color:var(--mu)">Sub-revenda Nível 2</small></td><td><span class="ba ba-r">1</span></td><td>2</td><td><span class="ba ba-g">Ativo</span></td>
            <td class="text-end"><div class="d-flex justify-content-end gap-1">
              <button class="ic ic-e" onclick="toast('Editando sub-revenda','i')"><i class="fas fa-pencil"></i></button>
              <button class="ic ic-s" onclick="openAddCred(1)"><i class="fas fa-coins"></i></button>
              <button class="ic ic-d" onclick="confirmDelete('revenda',0,'sub_rev_02')"><i class="fas fa-trash-can"></i></button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="cb">
      <button class="bp" onclick="openModalRevenda()"><i class="fas fa-plus"></i> Criar Nova Sub-Revenda</button>
    </div>
  </div>`;
}

function renderTransfCreditos() {
  return `
  <div style="background:linear-gradient(135deg,rgba(0,158,247,.12),rgba(114,57,234,.12));border:1px solid rgba(0,158,247,.25);border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
    <i class="fas fa-coins" style="font-size:28px;color:#009ef7"></i>
    <div><div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px">Seus créditos disponíveis</div>
      <div style="font-size:30px;font-weight:900;color:#009ef7" id="TCRED-N">${DB.credits.revenda}</div></div>
  </div>
  <div class="row g-3">
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-paper-plane me-2"></i>Transferir para Sub-Revenda</span></div>
        <div class="cb">
          <div class="mb-3"><label class="fl">Sub-Revenda Destino</label>
            <select class="fs" id="tcred-dest"><option value="">Selecione...</option><option>sub_rev_01 (3 cred)</option><option>sub_rev_02 (1 cred)</option></select>
          </div>
          <div class="mb-3"><label class="fl">Quantidade *</label>
            <input type="number" class="fc" id="tcred-qty" min="1" placeholder="Quantidade de créditos" oninput="checkTCred()">
          </div>
          <div class="info-b" id="tcred-prev" style="display:none">
            <i class="fas fa-arrow-right me-2" style="color:#009ef7"></i>Você ficará com <b id="tcred-after">—</b> créditos.
          </div>
          <div class="err-b" id="tcred-err" style="display:none"><i class="fas fa-triangle-exclamation me-2" style="color:#f1416c"></i>Créditos insuficientes!</div>
          <button class="bp" onclick="doTCred()"><i class="fas fa-paper-plane"></i> Transferir Créditos</button>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct">Últimas Transferências</span></div>
        <div style="overflow-x:auto">
          <table class="tbl"><thead><tr><th>Data</th><th>Para</th><th>Créditos</th></tr></thead>
          <tbody>
            <tr><td><small>27/04/2026</small></td><td>sub_rev_01</td><td><span class="ba ba-r">-2</span></td></tr>
            <tr><td><small>25/04/2026</small></td><td>sub_rev_02</td><td><span class="ba ba-r">-3</span></td></tr>
          </tbody></table>
        </div>
      </div>
    </div>
  </div>`;
}

function renderLinkIndicacao() {
  return `
  <div class="info-b"><i class="fas fa-link me-2" style="color:#009ef7"></i>Compartilhe seu link para atrair novos clientes. Os clientes que se cadastrarem pelo seu link serão vinculados à sua conta.</div>
  <div class="card"><div class="ch"><span class="ct">Link de Indicação</span></div>
    <div class="cb"><div class="row g-3">
      <div class="col-12 col-md-6"><label class="fl">Tipo de Assinatura</label><select class="fs"><option>Crédito</option><option>Mensalista</option></select></div>
      <div class="col-12 col-md-6"><label class="fl">Plano Padrão</label><select class="fs"><option>1 MES COMPLETO</option><option>1 MES SEM ADULTOS</option></select></div>
      <div class="col-12"><label class="fl">Seu Link</label>
        <div class="d-flex gap-2">
          <input type="text" class="fc" value="https://painel.fuze.lat/portal?ref=Slayker" readonly>
          <button class="bp" onclick="navigator.clipboard.writeText('https://painel.fuze.lat/portal?ref=Slayker');toast('Link copiado!','s')"><i class="fas fa-copy"></i></button>
        </div>
      </div>
      <div class="col-12"><button class="bp" onclick="toast('Link salvo!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div>
  </div>`;
}

// =====================================================
// USUARIO PAGES
// =====================================================
function renderUsuarioDash() {
  const u = CUR_USER;
  const today = new Date();
  const exp = new Date('2026-05-26');
  const daysLeft = Math.ceil((exp-today)/(1000*60*60*24));
  return `
  <div class="row g-3 mb-3">
    <div class="col-6 col-md-3"><div class="stat sg"><i class="fas fa-calendar-check"></i><div class="sv">${daysLeft}</div><div class="sl">Dias Restantes</div></div></div>
    <div class="col-6 col-md-3"><div class="stat sb"><i class="fas fa-tv"></i><div class="sv">2</div><div class="sl">Conexões Ativas</div></div></div>
    <div class="col-6 col-md-3"><div class="stat so"><i class="fas fa-server"></i><div class="sv">Fz Play</div><div class="sl">Servidor</div></div></div>
    <div class="col-6 col-md-3"><div class="stat ${daysLeft>7?'st':'sr'}"><i class="fas fa-clock"></i><div class="sv">${u.exp}</div><div class="sl">Vencimento</div></div></div>
  </div>
  <div class="row g-3">
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-calendar-check me-2" style="color:#0bb783"></i>Meu Plano Atual</span></div>
        <div class="cb">
          <div style="background:linear-gradient(135deg,#009ef7,#7239ea);border-radius:10px;padding:18px;color:#fff;margin-bottom:14px">
            <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.5px">Plano Ativo</div>
            <div style="font-size:20px;font-weight:800;margin:4px 0 8px">${u.plano || '1 MES SEM ADULTOS'}</div>
            <div style="display:flex;gap:16px;font-size:12px;opacity:.85">
              <span><i class="fas fa-server me-1"></i>Fz Play</span>
              <span><i class="fas fa-tv me-1"></i>2 conexões</span>
              <span><i class="fas fa-calendar me-1"></i>${u.exp}</span>
            </div>
          </div>
          ${daysLeft<=7?`<div style="background:rgba(241,65,108,.08);border:1px solid rgba(241,65,108,.2);border-radius:7px;padding:10px 14px;margin-bottom:12px"><i class="fas fa-triangle-exclamation me-2" style="color:#f1416c"></i><b style="color:#f1416c">Vence em ${daysLeft} dias!</b> Renove agora para não perder o acesso.</div>`:''}
          <button class="bp w-100 justify-content-center" onclick="navTo('u-renovar')"><i class="fas fa-credit-card"></i> Renovar / Mudar Plano</button>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-tv me-2"></i>Dados de Acesso</span></div>
        <div class="cb">
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:14px 16px;margin-bottom:12px">
            <div class="row g-2">
              <div class="col-6"><div style="font-size:10.5px;color:var(--mu)">Usuário</div><div style="font-weight:700;color:var(--hd)">${u.user}</div></div>
              <div class="col-6"><div style="font-size:10.5px;color:var(--mu)">Senha</div><div style="font-weight:700;color:var(--hd)">••••••</div></div>
              <div class="col-6"><div style="font-size:10.5px;color:var(--mu)">Servidor</div><div style="font-weight:700;color:var(--hd)">painel.fuze.lat</div></div>
              <div class="col-6"><div style="font-size:10.5px;color:var(--mu)">Porta</div><div style="font-weight:700;color:var(--hd)">8080</div></div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="bsec flex-grow-1 justify-content-center" onclick="toast('Dados copiados!','s')"><i class="fas fa-copy"></i> Copiar</button>
            <button class="bp flex-grow-1 justify-content-center" onclick="navTo('u-conexoes')"><i class="fas fa-eye"></i> Ver Conexões</button>
          </div>
        </div>
      </div>
      <div class="card mt-3"><div class="ch"><span class="ct">Últimos Pagamentos</span><button class="bsec ms-auto" style="font-size:11px" onclick="navTo('u-pagamentos')"><i class="fas fa-eye"></i></button></div>
        <div style="overflow-x:auto">
          <table class="tbl"><thead><tr><th>Data</th><th>Plano</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>${DB.pagamentos.slice(0,3).map(p=>`<tr>
            <td><small>${p.data}</small></td><td><small>${p.plano}</small></td>
            <td><b>${p.valor}</b></td>
            <td><span class="ba ${p.status==='Pago'?'ba-g':'ba-o'}">${p.status}</span></td>
          </tr>`).join('')}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;
}

function renderMeuPlano() {
  const u = CUR_USER;
  return `
  <div class="card mb-3">
    <div style="background:linear-gradient(135deg,#009ef7,#7239ea);border-radius:10px 10px 0 0;padding:24px 24px 20px;color:#fff">
      <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.6px">Seu Plano Atual</div>
      <div style="font-size:24px;font-weight:800;margin:6px 0 12px">${u.plano || '1 MES SEM ADULTOS'}</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;opacity:.9">
        <span><i class="fas fa-server me-2"></i>Fz Play</span>
        <span><i class="fas fa-tv me-2"></i>2 conexões simultâneas</span>
        <span><i class="fas fa-calendar-check me-2"></i>Vence: ${u.exp}</span>
        <span><i class="fas fa-film me-2"></i>Canais + VODs</span>
      </div>
    </div>
    <div class="cb">
      <div class="row g-3">
        <div class="col-6 col-md-3">
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
            <i class="fas fa-calendar me-1" style="color:#009ef7"></i>
            <div style="font-size:11px;color:var(--mu)">Vencimento</div>
            <div style="font-weight:700;color:var(--hd);font-size:13px">${u.exp}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
            <i class="fas fa-tv me-1" style="color:#0bb783"></i>
            <div style="font-size:11px;color:var(--mu)">Conexões</div>
            <div style="font-weight:700;color:var(--hd);font-size:13px">2 / 2</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
            <i class="fas fa-server me-1" style="color:#ffa800"></i>
            <div style="font-size:11px;color:var(--mu)">Servidor</div>
            <div style="font-weight:700;color:var(--hd);font-size:13px">Fz Play</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
            <i class="fas fa-shield-check me-1" style="color:#0bb783"></i>
            <div style="font-size:11px;color:var(--mu)">Status</div>
            <div style="font-weight:700;color:#0bb783;font-size:13px">Ativo</div>
          </div>
        </div>
      </div>
      <div class="mt-3"><button class="bp" onclick="navTo('u-renovar')"><i class="fas fa-credit-card"></i> Renovar ou Mudar Plano</button></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="ct">Dados de Acesso ao Servidor</span></div>
    <div class="cb">
      <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:16px">
        <div class="row g-3">
          ${[['Usuário',CUR_USER.user],['Senha','••••••'],['Servidor M3U','http://painel.fuze.lat:8080'],['Username (M3U)',CUR_USER.user],['Password (M3U)','••••••'],['Servidor','painel.fuze.lat'],['Porta HTTP','8080'],['Porta HTTPS','8443']].map(([k,v])=>`<div class="col-12 col-md-6"><div style="font-size:10.5px;color:var(--mu);margin-bottom:2px">${k}</div><div style="font-weight:600;color:var(--hd);font-size:13px;font-family:monospace">${v}</div></div>`).join('')}
        </div>
      </div>
      <button class="bsec mt-3" onclick="toast('Dados copiados para a área de transferência!','s')"><i class="fas fa-copy"></i> Copiar Todos os Dados</button>
    </div>
  </div>`;
}

function renderRenovar() {
  return `
  <div class="info-b"><i class="fas fa-info-circle me-2" style="color:#009ef7"></i>Renove ou mude seu plano através do pagamento PIX. O novo período começa após a confirmação do pagamento.</div>
  <div class="row g-3">
    <div class="col-12">
      <h5 style="color:var(--hd);margin-bottom:14px">Escolha seu próximo plano:</h5>
      <div class="row g-3">
        ${[{id:3,nome:'1 MÊS COMPLETO',desc:'Fz Play • 2 conexões • Canais + VODs + Adultos',price:'R$ 30,00',badge:''},
           {id:4,nome:'1 MÊS SEM ADULTOS',desc:'Fz Play • 2 conexões • Canais + VODs',price:'R$ 30,00',badge:''},
           {id:5,nome:'4 MESES COMPLETO',desc:'Fz Play • 2 conexões • Completo • R$22,50/mês',price:'R$ 90,00',badge:'<span class="ba ba-g" style="font-size:9px">Melhor Custo</span>'},
           {id:6,nome:'6 MESES COMPLETO',desc:'Fz Play • 4 conexões • Completo • R$25/mês',price:'R$ 150,00',badge:'<span class="ba ba-p" style="font-size:9px">VIP</span>'}
        ].map(p=>`<div class="col-12 col-md-6">
          <div style="background:var(--ibg);border:2px solid var(--brd);border-radius:10px;padding:16px 18px;cursor:pointer;transition:border-color .15s" onmouseenter="this.style.borderColor='rgba(0,158,247,.5)'" onmouseleave="this.style.borderColor='var(--brd)'" onclick="openPayment(${p.id},'${p.nome}','${p.price}')">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--hd)">${p.nome} ${p.badge}</div>
                <div style="font-size:12px;color:var(--mu);margin-top:2px">${p.desc}</div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#009ef7;white-space:nowrap;margin-left:10px">${p.price}</div>
            </div>
            <button class="bp mt-3 w-100 justify-content-center" style="font-size:12px"><i class="fas fa-pix me-1"></i> Pagar com PIX</button>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderPagamentos() {
  return `
  <div class="card">
    <div class="ch"><span class="ct">Histórico de Pagamentos</span></div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Nº Pedido</th><th>Data</th><th>Plano</th><th>Forma Pagto</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
        ${DB.pagamentos.map(p=>`<tr>
          <td><small style="font-family:monospace">${p.id}</small></td>
          <td><small>${p.data}</small></td>
          <td><small>${p.plano}</small></td>
          <td>PIX / Mercado Pago</td>
          <td><b>${p.valor}</b></td>
          <td><span class="ba ${p.status==='Pago'?'ba-g':'ba-o'}">${p.status}</span></td>
          <td><button class="ic ic-v" onclick="toast('Pedido ${p.id}: ${p.status}','i')"><i class="fas fa-eye"></i></button></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="pag"><span class="pi">Total: ${DB.pagamentos.length} pagamentos</span></div>
  </div>`;
}

function renderMinhasConexoes() {
  const minhas = [
    {canal:'TELECINE FUN FHD³',tempo:'0h 01m 32s',dev:'fzplay/1.1.149 (Android 10)',ip:'189.122.45.10'},
  ];
  return `
  <div class="info-b"><i class="fas fa-tv me-2" style="color:#009ef7"></i>Seu plano permite <b>2 conexões simultâneas</b>. Você tem <b>1 conexão ativa</b> agora.</div>
  <div class="card"><div class="ch"><span class="ct">Conexões Ativas</span><button class="bp ms-auto" style="font-size:11px" onclick="toast('Conexões atualizadas!','s')"><i class="fas fa-rotate-right"></i></button></div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Canal / Conteúdo</th><th>Tempo</th><th>Dispositivo</th><th>IP</th><th></th></tr></thead>
        <tbody>
          <tr>
            <td><b>TELECINE FUN FHD³</b></td>
            <td><span class="ba ba-g">0h 01m 32s</span></td>
            <td><small style="color:var(--mu)">fzplay/1.1.149 (Android 10)</small></td>
            <td><small>189.122.45.10</small></td>
            <td><button class="ic ic-d" title="Encerrar" onclick="toast('Conexão encerrada','w')"><i class="fas fa-xmark"></i></button></td>
          </tr>
          <tr style="opacity:.4">
            <td colspan="5" style="text-align:center;color:var(--mu);font-size:12.5px"><i class="fas fa-circle-dot me-2"></i>Conexão 2 — disponível</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

function genericPage(title) {
  return `<div class="card"><div class="cb text-center py-5">
    <i class="fas fa-layer-group" style="font-size:44px;color:var(--mu);opacity:.35"></i>
    <h4 style="color:var(--mu);margin-top:14px">${title}</h4>
    <p style="color:var(--mu);font-size:13px">Esta seção está implementada no template real.</p>
    <button class="bp" onclick="navTo(ROLE==='usuario'?'u-dashboard':ROLE==='revenda'?'r-dashboard':'dashboard')"><i class="fas fa-gauge"></i> Voltar</button>
  </div></div>`;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================
function openModalCliente(id=null) {
  DB.editingId = id;
  const c = id ? DB.clientes.find(x=>x.id===id) : null;
  document.getElementById('M-CLI-TITLE').textContent = id ? 'Editar Cliente' : 'Adicionar Cliente';
  if (c) {
    document.getElementById('cli-user').value = c.user;
    document.getElementById('cli-nome').value = c.nome||'';
    document.getElementById('cli-wpp').value = c.wpp||'';
  } else {
    document.getElementById('cli-user').value = '';
    document.getElementById('cli-nome').value = '';
    document.getElementById('cli-wpp').value = '';
  }
  updateCliCost();
  openModal('M-CLIENTE');
}

document.getElementById('cli-plano').addEventListener('change', updateCliCost);
function updateCliCost() {
  const sel = document.getElementById('cli-plano');
  const opt = sel.options[sel.selectedIndex].text;
  const cred = opt.match(/(\d+) cred/)?.[1]||'0';
  const myC = ROLE==='admin' ? Infinity : (CUR_USER.credits ?? 0);
  const ci = document.getElementById('cli-cost-info');
  if (parseInt(cred)===0) {
    ci.innerHTML='<i class="fas fa-gift me-2" style="color:#0bb783"></i>Plano de teste — sem custo de créditos.';
    ci.className='info-b mt-3';
  } else if (myC===Infinity || myC>=parseInt(cred)) {
    ci.innerHTML=`<i class="fas fa-coins me-2" style="color:#ffa800"></i>Custo: <b>${cred} crédito(s)</b>. Você tem ${myC===Infinity?'∞':myC} créditos.`;
    ci.className='warn-b mt-3';
  } else {
    ci.innerHTML=`<i class="fas fa-triangle-exclamation me-2" style="color:#f1416c"></i><b>Créditos insuficientes!</b> Precisa de ${cred}, você tem ${myC}.`;
    ci.className='err-b mt-3';
  }
}

async function saveCliente() {
  const u = document.getElementById('cli-user').value.trim();
  if (!u) { toast('Informe o usuário do cliente','e'); return; }
  
  const sel = document.getElementById('cli-plano');
  const opt = sel ? sel.options[sel.selectedIndex] : null;
  const connSel = document.getElementById('cli-conn');
  const conn = connSel ? parseInt(connSel.value) : 2;

  // Bloqueia se créditos insuficientes (não admin)
  if (ROLE !== 'admin') {
    const credNeeded = parseInt(opt?.text.match(/(\d+) cred/)?.[1] || '0');
    if (credNeeded > 0 && CUR_USER.credits < credNeeded) {
      toast(`Créditos insuficientes! Precisa de ${credNeeded}, você tem ${CUR_USER.credits}.`, 'e');
      return;
    }
  }

  const payload = {
    user: u,
    password: document.getElementById('cli-pwd') ? document.getElementById('cli-pwd').value : '',
    nome: document.getElementById('cli-nome').value,
    wpp: document.getElementById('cli-wpp').value,
    srv: 'Fz Play',
    plano: opt ? opt.text.split(' (')[0] : 'Plano Básico',
    plano_id: opt ? parseInt(opt.value) : 1,
    conn: conn,
    status: 'Ativo',
    revenda: CUR_USER.user,  // usuário logado
    revenda_xui_id: CUR_USER.xui_id || null,
    valor: '—'
  };

  try {
    if (DB.editingId) {
      await fetch(`/api/clientes/${DB.editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      toast(`Cliente ${u} atualizado!`, 's');
    } else {
      const r = await fetch('/api/clientes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Erro ao criar cliente', 'e'); return; }
      // Atualiza créditos locais imediatamente
      if (data.credits_remaining !== undefined) {
        CUR_USER.credits = data.credits_remaining;
        const el = document.getElementById('SIDEBAR-CRED');
        if (el) el.textContent = data.credits_remaining;
      }
      toast(`Cliente ${u} criado! Vence: ${data.exp}`, 's');
    }
    closeModal('M-CLIENTE');
    await loadData();
    renderPage(curPage);
  } catch(e) { toast('Erro: ' + e.message, 'e'); }
}

function openModalRevenda(id=null) {
  DB.editingId = id;
  const r = id ? DB.revendas.find(x=>x.id===id) : null;
  document.getElementById('M-REV-TITLE').textContent = id ? 'Editar Revenda' : (ROLE==='revenda'?'Criar Sub-Revenda':'Adicionar Revenda');
  if (r) {
    document.getElementById('rev-user').value = r.user;
    document.getElementById('rev-nome').value = r.nome||'';
    document.getElementById('rev-wpp').value = r.wpp||'';
    document.getElementById('rev-email').value = r.email||'';
    document.getElementById('rev-cred').value = '0';
  } else {
    ['rev-user','rev-nome','rev-wpp','rev-email'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('rev-cred').value='0';
  }
  document.getElementById('rev-cred-warn').style.display='none';
  openModal('M-REVENDA');
}

function checkRevCredits() {
  const qty = parseInt(document.getElementById('rev-cred').value)||0;
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  document.getElementById('rev-cred-warn').style.display = (myC!==Infinity&&qty>myC)?'block':'none';
}

async function saveRevenda() {
  const u = document.getElementById('rev-user').value.trim();
  if (!u) { toast('Informe o usuário da revenda','e'); return; }
  const cred = parseInt(document.getElementById('rev-cred').value)||0;

  const payload = {
    user: u,
    password: document.getElementById('rev-pwd') ? document.getElementById('rev-pwd').value : '',
    nome: document.getElementById('rev-nome').value,
    email: document.getElementById('rev-email').value,
    wpp: document.getElementById('rev-wpp').value,
    cred: cred,
    nivel: 1,
    status: 'Ativo',
    master: ROLE === 'admin' ? 'super-fuze' : 'Slayker',
    clientes: 0
  };

  try {
    if (DB.editingId) {
      await fetch(`/api/revendas/${DB.editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      toast(`Revenda ${u} atualizada!`, 's');
    } else {
      await fetch('/api/revendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      toast(`Revenda ${u} criada!`, 's');
    }
    closeModal('M-REVENDA');
    await loadData();
    renderPage(curPage);
  } catch(e) { toast('Erro: ' + e.message, 'e'); }
}

function openAddCred(revId) {
  const r = DB.revendas.find(x=>x.id===revId);
  if (!r) return;
  document.getElementById('addcred-rev').value = r.user;
  document.getElementById('addcred-qty').value = '';
  document.getElementById('addcred-obs').value = '';
  document.getElementById('addcred-preview').style.display='none';
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  document.getElementById('ADDCRED-MY').textContent = myC===Infinity?'∞':myC;
  DB.editingId = revId;
  openModal('M-ADDCRED');
}

function checkAddCred() {
  const qty = parseInt(document.getElementById('addcred-qty').value)||0;
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  const prev = document.getElementById('addcred-preview');
  const after = document.getElementById('addcred-after');
  if (qty>0 && (myC===Infinity||qty<=myC)) {
    prev.style.display='block';
    after.textContent = myC===Infinity?'∞':(myC-qty);
  } else { prev.style.display='none'; }
}

function doAddCredits() {
  const qty = parseInt(document.getElementById('addcred-qty').value)||0;
  if (qty<=0) { toast('Informe uma quantidade válida','e'); return; }
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  if (myC!==Infinity && qty>myC) { toast('Créditos insuficientes!','e'); return; }
  const r = DB.revendas.find(x=>x.id===DB.editingId);
  if (!r) return;
  r.cred += qty;
  if (ROLE==='revenda') { DB.credits.revenda-=qty; updateCredDisplay(); }
  closeModal('M-ADDCRED');
  toast(`${qty} créditos transferidos para ${r.user}!`,'s');
  renderPage(curPage);
}

function openModalRenovar(cliId) {
  const c = DB.clientes.find(x=>x.id===cliId);
  if (!c) return;
  DB.editingId = cliId;
  document.getElementById('ren-cli').value = c.user;
  document.getElementById('ren-plan-cur').value = c.plano;
  updateRenCost();
  openModal('M-RENOVAR');
}

function updateRenCost() {
  const sel = document.getElementById('ren-plan');
  const opt = sel.options[sel.selectedIndex];
  const cred = opt.dataset.cred||1;
  const dur = parseInt(opt.dataset.dur||30);
  const newExp = new Date(); newExp.setDate(newExp.getDate()+dur);
  document.getElementById('ren-cost-lbl').textContent = `${cred} crédito(s)`;
  document.getElementById('ren-new-date').textContent = newExp.toLocaleDateString('pt-BR')+' 23:59:59';
}

function doRenovar() {
  const c = DB.clientes.find(x=>x.id===DB.editingId);
  if (!c) return;
  const sel = document.getElementById('ren-plan');
  const opt = sel.options[sel.selectedIndex];
  const cred = parseInt(opt.dataset.cred||1);
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  if (myC!==Infinity && cred>myC) { toast('Créditos insuficientes!','e'); return; }
  if (ROLE==='revenda') { DB.credits.revenda-=cred; updateCredDisplay(); }
  const dur = parseInt(opt.dataset.dur||30);
  const newExp = new Date(); newExp.setDate(newExp.getDate()+dur);
  c.plano = opt.text.split(' —')[0];
  c.exp = newExp.toLocaleDateString('pt-BR');
  c.status = 'Ativo';
  closeModal('M-RENOVAR');
  toast(`${c.user} renovado até ${c.exp}!`,'s');
  renderPage(curPage);
}

function viewCliente(id) {
  const c = DB.clientes.find(x=>x.id===id);
  if (!c) return;
  document.getElementById('DET-TITLE').textContent = `Cliente: ${c.user}`;
  document.getElementById('DET-BODY').innerHTML = `
    <div class="row g-3">
      ${[['Usuário',c.user],['Nome',c.nome||'—'],['WhatsApp',c.wpp||'—'],['Servidor',c.srv],['Plano',c.plano],['Vencimento',c.exp],['Conexões',c.conn],['Valor',c.valor],['Status',c.status],['Revenda',c.revenda]].map(([k,v])=>`<div class="col-6"><label class="fl">${k}</label><div style="color:var(--hd);font-weight:600">${v}</div></div>`).join('')}
    </div>
    <div class="mt-3 d-flex gap-2">
      <button class="bp" onclick="closeModal('M-DETAILS');openModalCliente(${c.id})"><i class="fas fa-pencil"></i> Editar</button>
      <button class="bw" onclick="closeModal('M-DETAILS');openModalRenovar(${c.id})"><i class="fas fa-calendar-plus"></i> Renovar</button>
    </div>`;
  openModal('M-DETAILS');
}

function viewRevenda(id) {
  const r = DB.revendas.find(x=>x.id===id);
  if (!r) return;
  document.getElementById('DET-TITLE').textContent = `Revenda: ${r.user}`;
  document.getElementById('DET-BODY').innerHTML = `
    <div class="row g-3">
      ${[['Usuário',r.user],['Nome',r.nome],['WhatsApp',r.wpp],['E-mail',r.email],['Créditos',r.cred],['Clientes',r.clientes],['Nível',r.nivel],['Master',r.master],['Status',r.status]].map(([k,v])=>`<div class="col-6"><label class="fl">${k}</label><div style="color:var(--hd);font-weight:600">${v}</div></div>`).join('')}
    </div>
    <div class="mt-3 d-flex gap-2">
      <button class="bp" onclick="closeModal('M-DETAILS');openModalRevenda(${r.id})"><i class="fas fa-pencil"></i> Editar</button>
      <button class="bs" onclick="closeModal('M-DETAILS');openAddCred(${r.id})"><i class="fas fa-coins"></i> Adicionar Créditos</button>
    </div>`;
  openModal('M-DETAILS');
}

function confirmDelete(type, id, name) {
  document.getElementById('DELETE-MSG').textContent = `Tem certeza que deseja excluir "${name}"?`;
  document.getElementById('DELETE-CONFIRM').onclick = () => doDelete(type, id, name);
  openModal('M-DELETE');
}

async function doDelete(type, id, name) {
  try {
    if (type==='cliente') {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      toast(`Cliente ${name} excluído!`, 'w');
    } else if (type==='revenda') {
      await fetch(`/api/revendas/${id}`, { method: 'DELETE' });
      toast(`Revenda ${name} excluída!`, 'w');
    } else if (type==='conexao') {
      toast(`Conexão de ${name} encerrada!`, 'w');
    } else if (type==='plano') {
      toast(`Plano ${name} excluído!`, 'w');
    } else {
      toast(`${name} excluído!`, 'w');
    }
    closeModal('M-DELETE');
    await loadData();
    renderPage(curPage);
  } catch (e) {
    toast('Erro ao excluir: ' + e.message, 'e');
  }
}

// =====================================================
// PAYMENT FLOW
// =====================================================
function openPayment(planId, planName, planPrice) {
  selectedPlan = {id:planId, name:planName, price:planPrice};
  // reset steps
  setStep(1);
  document.getElementById('pay-step1').style.display='block';
  document.getElementById('pay-step2').style.display='none';
  document.getElementById('pay-step3').style.display='none';
  // clear plan selections
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  // pre-select
  const pc = document.getElementById('pcard-'+planId);
  if (pc) { pc.classList.add('selected'); document.getElementById('pay-btn1').disabled=false; }
  document.getElementById('PAY-TITLE').textContent = `Renovar Plano — PIX`;
  openModal('M-PAYMENT');
}

function selectPlan(id, name, price) {
  selectedPlan = {id, name, price};
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('pcard-'+id)?.classList.add('selected');
  document.getElementById('pay-btn1').disabled = false;
}

function setStep(n) {
  for (let i=1;i<=3;i++) {
    const s = document.getElementById('step'+i);
    s.className = 'step'+(i<n?' done':i===n?' act':'');
  }
}

function goPayStep2() {
  if (!selectedPlan) return;
  setStep(2);
  document.getElementById('pay-step1').style.display='none';
  document.getElementById('pay-step2').style.display='block';
  document.getElementById('pix-plan-name').textContent = selectedPlan.name;
  document.getElementById('pix-plan-price').textContent = selectedPlan.price;
  const amt = selectedPlan.price.replace('R$ ','').replace(',','.');
  document.getElementById('pix-amount').textContent = amt;
  document.getElementById('pix-hash').textContent = Math.random().toString(36).substr(2,4).toUpperCase();
  startPixTimer();
}

function backPayStep1() {
  clearInterval(pixInterval);
  setStep(1);
  document.getElementById('pay-step1').style.display='block';
  document.getElementById('pay-step2').style.display='none';
}

let pixSeconds = 899;
function startPixTimer() {
  clearInterval(pixInterval);
  pixSeconds = 899;
  pixInterval = setInterval(()=>{
    if (pixSeconds<=0) { clearInterval(pixInterval); toast('PIX expirado. Gere um novo.','e'); closeModal('M-PAYMENT'); return; }
    pixSeconds--;
    const m = String(Math.floor(pixSeconds/60)).padStart(2,'0');
    const s = String(pixSeconds%60).padStart(2,'0');
    const el = document.getElementById('PIX-TIMER');
    if (el) el.textContent = m+':'+s;
  },1000);
}

function copyPix() {
  const code = '00020126580014BR.GOV.BCB.PIX5204000053039865406'+document.getElementById('pix-amount').textContent+'5802BR5911FUZE IPTV LT6008SAO PAULO62070503***6304'+document.getElementById('pix-hash').textContent;
  navigator.clipboard.writeText(code).then(()=>toast('Código PIX copiado!','s'));
}

function simulatePayment() {
  clearInterval(pixInterval);
  setStep(3);
  document.getElementById('pay-step2').style.display='none';
  document.getElementById('pay-step3').style.display='block';
  document.getElementById('conf-plan').textContent = selectedPlan.name;
  document.getElementById('conf-price').textContent = selectedPlan.price;
  const newExp = new Date();
  const dur = {3:30,4:30,5:120,6:180}[selectedPlan.id]||30;
  newExp.setDate(newExp.getDate()+dur);
  document.getElementById('conf-exp').textContent = newExp.toLocaleDateString('pt-BR')+' 23:59:59';
  document.getElementById('conf-txid').textContent = 'MP-'+Math.floor(Math.random()*900000000+100000000);
  // Update client data
  const c = DB.clientes.find(x=>x.user==='juaniptv1');
  if (c) { c.exp = newExp.toLocaleDateString('pt-BR'); c.plano = selectedPlan.name; }
  DB.pagamentos.unshift({id:String(Math.floor(Math.random()*900000000+100000000)),user:'juaniptv1',plano:selectedPlan.name,valor:selectedPlan.price,data:new Date().toLocaleDateString('pt-BR'),status:'Pago'});
  toast('Pagamento confirmado! Plano renovado 🎉','s');
}

// =====================================================
// EVOLUTION — ADMIN
// =====================================================
const EVO_INSTANCES = [
  {id:1,name:'fuze-principal',rev:'super-fuze',wpp:'+55 85 99810-0727',status:'connected',msgs_sent:1245,msgs_today:34,webhook:true},
  {id:2,name:'slayker-rev',rev:'Slayker',wpp:'+55 85 98905-2954',status:'connected',msgs_sent:487,msgs_today:12,webhook:true},
  {id:3,name:'elson-cobranca',rev:'elson',wpp:'+55 85 97777-2345',status:'disconnected',msgs_sent:203,msgs_today:0,webhook:false},
  {id:4,name:'willgner-bot',rev:'Willgner7',wpp:'+55 85 98888-3456',status:'connecting',msgs_sent:89,msgs_today:5,webhook:true},
  {id:5,name:'spaulo-bot',rev:'SPaulo929305',wpp:'+55 11 94444-5566',status:'connected',msgs_sent:1034,msgs_today:21,webhook:true},
  {id:6,name:'robson-evo',rev:'Robson1912',wpp:'+55 85 96666-7890',status:'disconnected',msgs_sent:12,msgs_today:0,webhook:false},
];

function renderEvoInstancias() {
  const conn = EVO_INSTANCES.filter(i=>i.status==='connected').length;
  return `
  <div class="row g-3 mb-3">
    <div class="col-6 col-md-3"><div class="stat sg"><i class="fab fa-whatsapp"></i><div class="sv">${conn}</div><div class="sl">Instâncias Online</div></div></div>
    <div class="col-6 col-md-3"><div class="stat sb"><i class="fas fa-paper-plane"></i><div class="sv">1.314</div><div class="sl">Msgs Enviadas Hoje</div></div></div>
    <div class="col-6 col-md-3"><div class="stat so"><i class="fas fa-robot"></i><div class="sv">${EVO_INSTANCES.length}</div><div class="sl">Total de Instâncias</div></div></div>
    <div class="col-6 col-md-3"><div class="stat sr"><i class="fas fa-circle-xmark"></i><div class="sv">${EVO_INSTANCES.filter(i=>i.status==='disconnected').length}</div><div class="sl">Desconectadas</div></div></div>
  </div>
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar instância" oninput="filterTbl('tbl-evo',this.value)"></div>
      <select class="fs" style="width:auto">
        <option value="">Status</option><option>connected</option><option>disconnected</option>
      </select>
    </div>
    <button class="bp" onclick="openEvoModal()"><i class="fas fa-plus"></i> Criar Instância</button>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-evo">
      <thead><tr><th>Instância</th><th>Revenda</th><th>WhatsApp</th><th>Status</th><th>Msgs Hoje</th><th>Total Msgs</th><th>Webhook</th><th class="text-end">Ações</th></tr></thead>
      <tbody>
      ${EVO_INSTANCES.map(e=>`<tr>
        <td><b style="color:var(--hd);font-family:monospace">${e.name}</b></td>
        <td><small>${e.rev}</small></td>
        <td><small>${e.wpp}</small></td>
        <td><span class="inst-dot ${e.status==='connected'?'inst-on':e.status==='connecting'?'inst-con':'inst-off'}" style="display:inline-block;margin-right:5px"></span>
            <span class="ba ${e.status==='connected'?'ba-g':e.status==='connecting'?'ba-o':'ba-r'}">${e.status}</span></td>
        <td>${e.msgs_today}</td>
        <td><small>${e.msgs_sent.toLocaleString()}</small></td>
        <td><span class="ba ${e.webhook?'ba-g':'ba-r'}">${e.webhook?'Ativo':'Off'}</span></td>
        <td class="text-end"><div class="d-flex justify-content-end gap-1">
          ${e.status==='connected'
            ?`<button class="ic ic-d" title="Desconectar" onclick="evoAction('desconectar','${e.name}')"><i class="fas fa-plug-circle-xmark"></i></button>`
            :`<button class="ic ic-s" title="Conectar/QR" onclick="openQRModal('${e.name}')"><i class="fas fa-qrcode"></i></button>`}
          <button class="ic ic-v" title="Testar" onclick="evoAction('testar','${e.name}')"><i class="fas fa-bolt"></i></button>
          <button class="ic ic-r" title="Reiniciar" onclick="evoAction('reiniciar','${e.name}')"><i class="fas fa-rotate-right"></i></button>
          <button class="ic ic-d" title="Excluir" onclick="confirmDelete('evo',${e.id},'${e.name}')"><i class="fas fa-trash-can"></i></button>
        </div></td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function renderEvoAutomacoes() {
  return `
  <div class="info-b"><i class="fas fa-robot me-2" style="color:#009ef7"></i>As automações globais são aplicadas para <b>todas as revendas</b>. Cada revenda pode sobrescrever com suas próprias regras.</div>
  <div class="tlb">
    <div></div>
    <button class="bp" onclick="openAutoModal()"><i class="fas fa-plus"></i> Nova Automação</button>
  </div>
  <div class="row g-3">
    ${[
      {nome:'Lembrete 3 dias antes',disparo:'3 dias antes do vencimento',canal:'WhatsApp',template:'lembrete_3d',status:true,enviados:342,icon:'fa-bell',color:'#ffa800'},
      {nome:'Lembrete no dia',disparo:'No dia do vencimento',canal:'WhatsApp',template:'vencimento_hoje',status:true,enviados:218,icon:'fa-bell-ring',color:'#f1416c'},
      {nome:'Aviso 1 dia antes',disparo:'1 dia antes do vencimento',canal:'WhatsApp',template:'lembrete_1d',status:true,enviados:301,icon:'fa-calendar-day',color:'#009ef7'},
      {nome:'Pós-vencimento 1d',disparo:'1 dia após vencimento',canal:'WhatsApp',template:'expirado_1d',status:false,enviados:87,icon:'fa-ban',color:'#7239ea'},
      {nome:'Boas-vindas novo cliente',disparo:'Na criação do cliente',canal:'WhatsApp',template:'boas_vindas',status:true,enviados:512,icon:'fa-hand-wave',color:'#0bb783'},
      {nome:'Renovação confirmada',disparo:'Após renovação',canal:'WhatsApp',template:'renovado_ok',status:true,enviados:403,icon:'fa-circle-check',color:'#0bb783'},
    ].map(a=>`
    <div class="col-12 col-md-6">
      <div class="auto-rule ${a.status?'active':'paused'}">
        <div style="width:38px;height:38px;border-radius:9px;background:${a.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas ${a.icon}" style="color:${a.color};font-size:16px"></i>
        </div>
        <div class="flex-grow-1">
          <div style="font-weight:700;color:var(--hd);font-size:13px">${a.nome}</div>
          <div style="font-size:11px;color:var(--mu)">${a.disparo} • Template: <code style="font-size:10px">${a.template}</code></div>
          <div style="font-size:10.5px;color:var(--mu);margin-top:2px"><i class="fas fa-paper-plane me-1"></i>${a.enviados} envios</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label class="toggle-sw"><input type="checkbox" ${a.status?'checked':''} onchange="toast(this.checked?'Automação ativada':'Automação pausada',this.checked?'s':'w')"><span class="toggle-sl"></span></label>
          <button class="ic ic-e" onclick="toast('Editando automação ${a.nome}','i')"><i class="fas fa-pencil"></i></button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderEvoTemplates() {
  const tpls = [
    {name:'lembrete_3d',title:'Lembrete 3 dias',preview:'Olá {{nome}}! Seu plano {{plano}} vence em *3 dias* ({{vencimento}}). Renove agora 👉 {{link_renovacao}}',usos:342},
    {name:'lembrete_1d',title:'Lembrete 1 dia',preview:'Atenção {{nome}}! Seu acesso FUZE vence *AMANHÃ* ({{vencimento}}). Não fique sem TV! 📺 Renove: {{link_renovacao}}',usos:301},
    {name:'vencimento_hoje',title:'Vence hoje',preview:'⚠️ {{nome}}, seu plano vence *hoje*! Para não perder o acesso, renove agora mesmo 👇\n{{link_renovacao}}\n\nValor: {{valor}}',usos:218},
    {name:'expirado_1d',title:'Expirado +1 dia',preview:'Olá {{nome}}! Seu plano expirou ontem. Clique aqui para reativar: {{link_renovacao}} 🔄',usos:87},
    {name:'boas_vindas',title:'Boas-vindas',preview:'🎉 Bem-vindo(a) {{nome}} ao FUZE IPTV!\n\n📱 Usuário: {{usuario}}\n🔑 Senha: {{senha}}\n🖥️ Servidor: {{servidor}}\n\nPlano: {{plano}} • Vence: {{vencimento}}',usos:512},
    {name:'renovado_ok',title:'Renovação confirmada',preview:'✅ {{nome}}, seu plano foi renovado com sucesso!\n📅 Novo vencimento: {{vencimento}}\n📺 Bom entretenimento!',usos:403},
  ];
  const vars = ['{{nome}}','{{usuario}}','{{senha}}','{{plano}}','{{vencimento}}','{{valor}}','{{servidor}}','{{link_renovacao}}','{{revenda}}'];
  return `
  <div class="row g-3">
    <div class="col-12 col-md-8">
      <div class="tlb">
        <div class="flt"><div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar template" oninput="filterTbl('tbl-tpl',this.value)"></div></div>
        <button class="bp" onclick="toast('Editor de template aberto','i')"><i class="fas fa-plus"></i> Novo Template</button>
      </div>
      <div class="card"><div style="overflow-x:auto">
        <table class="tbl" id="tbl-tpl">
          <thead><tr><th>Slug</th><th>Título</th><th>Prévia</th><th>Usos</th><th class="text-end">Ações</th></tr></thead>
          <tbody>${tpls.map(t=>`<tr>
            <td><code style="font-size:10.5px;color:#009ef7">${t.name}</code></td>
            <td><b>${t.title}</b></td>
            <td style="max-width:200px"><small style="color:var(--mu)">${t.preview.substr(0,70)}…</small></td>
            <td><span class="ba ba-b">${t.usos}</span></td>
            <td class="text-end"><div class="d-flex justify-content-end gap-1">
              <button class="ic ic-v" onclick="toast('Testando template: ${t.name}','i')"><i class="fas fa-bolt"></i></button>
              <button class="ic ic-e" onclick="toast('Editando: ${t.name}','i')"><i class="fas fa-pencil"></i></button>
              <button class="ic ic-d" onclick="confirmDelete('tpl',0,'${t.name}')"><i class="fas fa-trash-can"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
        </table>
      </div></div>
    </div>
    <div class="col-12 col-md-4">
      <div class="card"><div class="ch"><span class="ct"><i class="fas fa-code me-2"></i>Variáveis Disponíveis</span></div>
        <div class="cb">
          <p style="color:var(--mu);font-size:12px">Insira no corpo da mensagem:</p>
          ${vars.map(v=>`<div style="background:var(--ibg);border:1px solid var(--brd);border-radius:4px;padding:5px 10px;margin-bottom:5px;display:flex;align-items:center;justify-content:space-between;font-family:monospace;font-size:11.5px">
            <span style="color:#009ef7">${v}</span>
            <button style="background:none;border:none;color:var(--mu);cursor:pointer;font-size:10px" onclick="navigator.clipboard.writeText('${v}');toast('Copiado!','s')"><i class="fas fa-copy"></i></button>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function renderEvoFila() {
  const fila = [
    {ts:'28/04 18:30',rev:'Slayker',dest:'+55 85 99999-1234',tpl:'lembrete_3d',status:'pending',tentativas:0},
    {ts:'28/04 18:30',rev:'elson',dest:'+55 85 97777-5678',tpl:'vencimento_hoje',status:'sent',tentativas:1},
    {ts:'28/04 18:30',rev:'Willgner7',dest:'+55 85 98888-9012',tpl:'lembrete_1d',status:'failed',tentativas:3},
    {ts:'28/04 18:00',rev:'SPaulo929305',dest:'+55 11 96666-3456',tpl:'renovado_ok',status:'sent',tentativas:1},
    {ts:'28/04 17:45',rev:'Slayker',dest:'+55 85 95555-7890',tpl:'boas_vindas',status:'sent',tentativas:1},
    {ts:'28/04 17:00',rev:'R3VDaniel9468',dest:'+55 91 94444-2345',tpl:'lembrete_3d',status:'pending',tentativas:0},
  ];
  return `
  <div class="tlb">
    <div class="flt">
      <select class="fs" style="width:auto"><option>Todos</option><option>pending</option><option>sent</option><option>failed</option></select>
    </div>
    <button class="bp" onclick="toast('Fila reprocessada!','s')"><i class="fas fa-rotate-right"></i> Reprocessar Falhados</button>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Agendado</th><th>Revenda</th><th>Destino</th><th>Template</th><th>Status</th><th>Tentativas</th><th></th></tr></thead>
      <tbody>${fila.map(f=>`<tr>
        <td><small>${f.ts}</small></td><td><b>${f.rev}</b></td>
        <td><small>${f.dest}</small></td>
        <td><code style="font-size:10.5px;color:#009ef7">${f.tpl}</code></td>
        <td><span class="ba ${f.status==='sent'?'ba-g':f.status==='failed'?'ba-r':'ba-o'}">${f.status}</span></td>
        <td>${f.tentativas}/3</td>
        <td><button class="ic ic-r" title="Reenviar" onclick="toast('Reenviando...','i')"><i class="fas fa-rotate-right"></i></button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

// =====================================================
// GAMIFICATION — ADMIN
// =====================================================
const RANK_DATA = [
  {pos:1,user:'Willgner7',pts:2840,clientes:16,vendas:28,cred_consumidos:51,badge:'🏆',nivel:'Diamante',streak:7,bonus:20},
  {pos:2,user:'SPaulo929305',pts:2310,clientes:12,vendas:22,cred_consumidos:39,badge:'🥈',nivel:'Ouro',streak:5,bonus:10},
  {pos:3,user:'R3VDaniel9468',pts:2180,clientes:11,vendas:19,cred_consumidos:34,badge:'🥉',nivel:'Ouro',streak:4,bonus:10},
  {pos:4,user:'Slayker',pts:1920,clientes:9,vendas:16,cred_consumidos:28,badge:'⭐',nivel:'Prata',streak:3,bonus:0},
  {pos:5,user:'elson',pts:1540,clientes:7,vendas:13,cred_consumidos:21,badge:'',nivel:'Prata',streak:2,bonus:0},
  {pos:6,user:'Robson1912',pts:890,clientes:4,vendas:7,cred_consumidos:11,badge:'',nivel:'Bronze',streak:1,bonus:0},
];

const BADGES_DEF = [
  {id:'first_sale',icon:'🎯',name:'Primeira Venda',desc:'Realizou a primeira venda',color:'#0bb783',req:1,tipo:'vendas'},
  {id:'ten_clients',icon:'👥',name:'Time de 10',desc:'10 clientes ativos',color:'#009ef7',req:10,tipo:'clientes'},
  {id:'hundred',icon:'💯',name:'Centenário',desc:'100 clientes criados',color:'#7239ea',req:100,tipo:'clientes'},
  {id:'streak_7',icon:'🔥',name:'Em Chamas',desc:'7 dias consecutivos de vendas',color:'#f1416c',req:7,tipo:'streak'},
  {id:'top1',icon:'🏆',name:'Campeão do Mês',desc:'1º lugar no ranking mensal',color:'#ffd700',req:1,tipo:'rank'},
  {id:'fast_seller',icon:'⚡',name:'Vendedor Veloz',desc:'5 vendas em 24h',color:'#ffa800',req:5,tipo:'dia'},
  {id:'loyal',icon:'💎',name:'Diamante',desc:'500 créditos consumidos',color:'#7239ea',req:500,tipo:'cred'},
  {id:'automator',icon:'🤖',name:'Automatizador',desc:'1000 msgs enviadas pelo bot',color:'#009ef7',req:1000,tipo:'msgs'},
];

function renderRanking() {
  return `
  <div class="row g-3 mb-3">
    <div class="col-12">
      <div class="info-b"><i class="fas fa-info-circle me-2" style="color:#009ef7"></i>Ranking mensal de <b>Abril/2026</b>. Os <b>3 primeiros</b> recebem bônus de créditos automaticamente ao virar o mês. Atualizado a cada 24h.</div>
    </div>
  </div>

  <!-- TOP 3 PODIUM -->
  <div class="row g-3 mb-4 justify-content-center">
    ${RANK_DATA.slice(0,3).map(r=>`
    <div class="col-12 col-md-4">
      <div class="rank-card rank-${r.pos}">
        <div class="rank-top"></div>
        <div class="cb text-center py-3">
          <div class="rank-n">${r.pos===1?'🏆':r.pos===2?'🥈':'🥉'} #${r.pos}</div>
          <div style="font-size:15px;font-weight:700;color:var(--hd);margin:4px 0 2px">${r.user}</div>
          <span class="ba ${r.nivel==='Diamante'?'ba-p':r.nivel==='Ouro'?'ba-o':'ba-b'}">${r.nivel}</span>
          <div class="row g-2 mt-2 text-start">
            <div class="col-6"><div style="font-size:10px;color:var(--mu)">Pontos</div><div style="font-weight:700;color:var(--hd)">${r.pts.toLocaleString()}</div></div>
            <div class="col-6"><div style="font-size:10px;color:var(--mu)">Clientes</div><div style="font-weight:700;color:var(--hd)">${r.clientes}</div></div>
            <div class="col-6"><div style="font-size:10px;color:var(--mu)">Vendas/mês</div><div style="font-weight:700;color:var(--hd)">${r.vendas}</div></div>
            <div class="col-6"><div style="font-size:10px;color:var(--mu)">Streak</div><div style="font-weight:700;color:#f1416c">🔥 ${r.streak}d</div></div>
          </div>
          ${r.bonus>0?`<div style="background:rgba(255,215,0,.12);border:1px solid rgba(255,215,0,.3);border-radius:6px;padding:6px 10px;margin-top:10px;font-size:11px">
            <i class="fas fa-coins me-1" style="color:#ffd700"></i>Receberá <b style="color:#ffd700">+${r.bonus} créditos</b> bônus
          </div>`:''}
        </div>
      </div>
    </div>`).join('')}
  </div>

  <!-- FULL TABLE -->
  <div class="card"><div class="ch"><span class="ct">Classificação Completa — Abril/2026</span>
    <button class="bp ms-auto" style="font-size:11px" onclick="toast('Bônus distribuídos manualmente!','s')"><i class="fas fa-gift"></i> Distribuir Bônus Agora</button>
  </div>
  <div>
    ${RANK_DATA.map(r=>`
    <div class="lb-row">
      <div class="lb-pos" style="color:${r.pos===1?'#ffd700':r.pos===2?'#b0b0b0':r.pos===3?'#cd7f32':'var(--mu)'}">${r.badge||r.pos}</div>
      <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#009ef7,#7239ea);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">${r.user[0].toUpperCase()}</div>
      <div class="flex-grow-1">
        <div style="font-weight:700;color:var(--hd)">${r.user} <span class="ba ${r.nivel==='Diamante'?'ba-p':r.nivel==='Ouro'?'ba-o':r.nivel==='Prata'?'ba-b':'ba-t'}" style="font-size:9px">${r.nivel}</span></div>
        <div style="font-size:10.5px;color:var(--mu)">🔥 ${r.streak}d streak • ${r.clientes} clientes • ${r.vendas} vendas</div>
      </div>
      <div class="text-end">
        <div style="font-size:16px;font-weight:800;color:var(--hd)">${r.pts.toLocaleString()}<small style="font-size:10px;color:var(--mu)"> pts</small></div>
        ${r.bonus>0?`<div style="font-size:10px;color:#ffd700"><i class="fas fa-coins me-1"></i>+${r.bonus} bônus</div>`:''}
      </div>
    </div>`).join('')}
  </div></div>`;
}

function renderBadgesAdmin() {
  return `
  <div class="info-b"><i class="fas fa-info-circle me-2" style="color:#009ef7"></i>Gerencie as conquistas disponíveis. As badges são concedidas automaticamente quando a revenda atinge o requisito.</div>
  <div class="tlb">
    <div></div>
    <button class="bp" onclick="toast('Criar nova badge/conquista','i')"><i class="fas fa-plus"></i> Nova Conquista</button>
  </div>
  <div class="row g-3">
    ${BADGES_DEF.map(b=>`
    <div class="col-6 col-md-3">
      <div class="badge-card earned">
        <div class="badge-icon" style="background:${b.color}22;font-size:24px">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
        <div style="font-size:10px;color:var(--mu);margin-top:4px">Req: ${b.req} ${b.tipo}</div>
        <div class="d-flex justify-content-center gap-2 mt-2">
          <button class="ic ic-e" onclick="toast('Editando badge ${b.name}','i')"><i class="fas fa-pencil"></i></button>
          <button class="ic ic-d" onclick="confirmDelete('badge',0,'${b.name}')"><i class="fas fa-trash-can"></i></button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderMissoes() {
  const missoes = [
    {title:'Sprint de Abril',desc:'Tenha 20+ clientes ativos até 30/04/2026',prog:73,meta:100,bonus:'+15 créditos',icone:'🏃',color:'#009ef7',prazo:'30/04/2026'},
    {title:'Rei do WhatsApp',desc:'Envie 500 msgs automáticas este mês',prog:67,meta:100,bonus:'+8 créditos',icone:'📱',color:'#25d366',prazo:'30/04/2026'},
    {title:'Zero Churn',desc:'Mantenha taxa de cancelamento < 5%',prog:90,meta:100,bonus:'Badge VIP',icone:'💪',color:'#0bb783',prazo:'30/04/2026'},
    {title:'Recruta 3 Revendas',desc:'Crie 3 sub-revendas ativas este mês',prog:33,meta:100,bonus:'+20 créditos',icone:'🤝',color:'#7239ea',prazo:'30/04/2026'},
  ];
  return `
  <div class="info-b"><i class="fas fa-bullseye me-2" style="color:#009ef7"></i>Missões são desafios temporários com recompensas extras. Progresso calculado automaticamente a partir dos dados de cada revenda.</div>
  <div class="tlb"><div></div><button class="bp" onclick="toast('Criar nova missão','i')"><i class="fas fa-plus"></i> Nova Missão</button></div>
  <div class="row g-3">
    ${missoes.map(m=>`
    <div class="col-12 col-md-6">
      <div class="card">
        <div class="cb">
          <div class="d-flex align-items-center gap-3 mb-3">
            <div style="width:46px;height:46px;border-radius:10px;background:${m.color}22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${m.icone}</div>
            <div class="flex-grow-1">
              <div style="font-weight:700;color:var(--hd)">${m.title}</div>
              <div style="font-size:12px;color:var(--mu)">${m.desc}</div>
              <div style="font-size:10.5px;color:var(--mu);margin-top:2px">⏰ Prazo: ${m.prazo} • 🎁 ${m.bonus}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:11px;color:var(--mu)">Progresso médio das revendas</span>
            <span style="font-size:11px;font-weight:700;color:${m.color}">${m.prog}%</span>
          </div>
          <div class="prog-bar"><div class="prog-fill" style="width:${m.prog}%;background:${m.color}"></div></div>
          <div class="d-flex gap-2 mt-3">
            <button class="ic ic-e" style="width:auto;padding:0 10px" onclick="toast('Editando missão','i')"><i class="fas fa-pencil me-1"></i>Editar</button>
            <button class="ic ic-d" style="width:auto;padding:0 10px" onclick="confirmDelete('missao',0,'${m.title}')"><i class="fas fa-trash-can me-1"></i>Excluir</button>
          </div>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderRankConfig() {
  return `
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'rkcfg1')">Pontuação</button>
    <button class="tab" onclick="switchTab(this,'rkcfg2')">Bônus Automáticos</button>
    <button class="tab" onclick="switchTab(this,'rkcfg3')">Notificações</button>
  </div>
  <div class="tbc active" id="rkcfg1">
    <div class="card"><div class="ch"><span class="ct">Regras de Pontuação</span></div><div class="cb">
      <div class="row g-3">
        ${[['Novo cliente criado','50 pts'],['Renovação realizada','30 pts'],['Streak diário','10 pts'],['Sub-revenda criada','100 pts'],['Crédito consumido','5 pts'],['Dia sem cancelamentos','15 pts']].map(([a,p])=>`
        <div class="col-12 col-md-6">
          <div class="d-flex align-items-center justify-content-between" style="background:var(--ibg);border:1px solid var(--brd);border-radius:7px;padding:10px 14px">
            <span style="font-size:13px">${a}</span>
            <input type="text" class="fc" value="${p}" style="width:90px;text-align:center">
          </div>
        </div>`).join('')}
        <div class="col-12"><button class="bp" onclick="toast('Regras de pontuação salvas!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
      </div>
    </div></div>
  </div>
  <div class="tbc" id="rkcfg2">
    <div class="card"><div class="ch"><span class="ct">Bônus por Ranking (distribuição automática no dia 1)</span></div><div class="cb">
      <div class="row g-3">
        ${[['🏆 1º lugar','20 créditos'],['🥈 2º lugar','10 créditos'],['🥉 3º lugar','10 créditos'],['🔥 Maior streak','5 créditos'],['📈 Maior crescimento','8 créditos']].map(([pos,bon])=>`
        <div class="col-12 col-md-6">
          <div class="d-flex align-items-center justify-content-between" style="background:var(--ibg);border:1px solid var(--brd);border-radius:7px;padding:10px 14px">
            <span style="font-size:13px">${pos}</span>
            <input type="text" class="fc" value="${bon}" style="width:120px;text-align:center">
          </div>
        </div>`).join('')}
        <div class="col-12"><button class="bp" onclick="toast('Bônus configurados!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
      </div>
    </div></div>
  </div>
  <div class="tbc" id="rkcfg3">
    <div class="card"><div class="cb"><div class="row g-3">
      <div class="col-12"><div class="d-flex align-items-center justify-content-between"><span>Notificar revenda ao conquistar badge</span><label class="toggle-sw"><input type="checkbox" checked><span class="toggle-sl"></span></label></div></div>
      <div class="col-12"><div class="d-flex align-items-center justify-content-between"><span>Notificar ao entrar no top 3</span><label class="toggle-sw"><input type="checkbox" checked><span class="toggle-sl"></span></label></div></div>
      <div class="col-12"><div class="d-flex align-items-center justify-content-between"><span>Anunciar ranking no WhatsApp das revendas</span><label class="toggle-sw"><input type="checkbox" checked><span class="toggle-sl"></span></label></div></div>
      <div class="col-12"><div class="d-flex align-items-center justify-content-between"><span>Enviar resumo mensal por WhatsApp</span><label class="toggle-sw"><input type="checkbox" checked><span class="toggle-sl"></span></label></div></div>
      <div class="col-12"><button class="bp" onclick="toast('Notificações salvas!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button></div>
    </div></div></div>
  </div>`;
}

// =====================================================
// EVOLUTION — REVENDA
// =====================================================
let evoConnected = false;
let qrInterval = null;

function renderRevendaEvo() {
  return `
  <div class="row g-3">
    <div class="col-12 col-md-5">
      <div class="card">
        <div class="ch"><span class="ct"><i class="fab fa-whatsapp me-2" style="color:#25d366"></i>Minha Instância WhatsApp</span></div>
        <div class="cb" id="EVO-BODY">
          ${evoConnected ? renderEvoConnected() : renderEvoDisconnected()}
        </div>
      </div>
    </div>
    <div class="col-12 col-md-7">
      <div class="card">
        <div class="ch"><span class="ct"><i class="fas fa-paper-plane me-2"></i>Enviar Mensagem de Teste</span></div>
        <div class="cb">
          <div class="row g-3">
            <div class="col-12"><label class="fl">Número WhatsApp</label><input type="text" class="fc" id="evo-dest" placeholder="+55 (85) 99999-9999"></div>
            <div class="col-12"><label class="fl">Template</label>
              <select class="fs" id="evo-tpl" onchange="updateEvoPreview()">
                <option value="boas_vindas">Boas-vindas</option>
                <option value="lembrete_3d">Lembrete 3 dias</option>
                <option value="vencimento_hoje">Vence Hoje</option>
              </select>
            </div>
            <div class="col-12">
              <label class="fl">Prévia da Mensagem</label>
              <div id="evo-preview" style="background:var(--ibg);border:1px solid var(--brd);border-radius:6px;padding:10px 13px;font-size:12.5px;white-space:pre-wrap;min-height:80px">🎉 Bem-vindo(a) João ao FUZE IPTV!\n\n📱 Usuário: juaniptv1\n🔑 Senha: ••••••\n🖥️ Servidor: painel.fuze.lat\n\nPlano: 1 MES SEM ADULTOS • Vence: 26/05/2026</div>
            </div>
            <div class="col-12">
              <button class="bp" onclick="if(!evoConnected){toast('Conecte o WhatsApp antes de enviar','e')}else{toast('Mensagem de teste enviada!','s')}">
                <i class="fas fa-paper-plane"></i> Enviar Teste
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="card mt-3">
        <div class="ch"><span class="ct"><i class="fas fa-chart-bar me-2"></i>Estatísticas da Instância</span></div>
        <div class="cb"><div class="row g-2">
          ${[['fa-paper-plane','#009ef7','487','Total Enviadas'],['fa-circle-check','#0bb783','451','Entregues'],['fa-eye','#ffa800','398','Lidas'],['fa-circle-xmark','#f1416c','36','Falhadas']].map(([ic,col,val,lbl])=>`
          <div class="col-6 col-md-3">
            <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
              <i class="fas ${ic}" style="color:${col};font-size:18px"></i>
              <div style="font-size:20px;font-weight:800;color:var(--hd);margin:4px 0 2px">${val}</div>
              <div style="font-size:10.5px;color:var(--mu)">${lbl}</div>
            </div>
          </div>`).join('')}
        </div></div>
      </div>
    </div>
  </div>`;
}

function renderEvoDisconnected() {
  return `
  <div style="text-align:center;padding:10px 0">
    <div style="width:60px;height:60px;border-radius:50%;background:rgba(37,211,102,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:26px">📵</div>
    <h5 style="color:var(--hd);margin-bottom:6px">WhatsApp Desconectado</h5>
    <p style="color:var(--mu);font-size:12.5px">Conecte seu WhatsApp para ativar o envio automático de cobranças e mensagens aos clientes.</p>
    <button class="bp w-100 justify-content-center" style="background:#25d366" onclick="startQR()">
      <i class="fab fa-whatsapp"></i> Conectar via QR Code
    </button>
    <div id="QR-AREA" style="display:none;margin-top:16px">
      <p style="color:var(--mu);font-size:12px;margin-bottom:10px">Abra o WhatsApp → <b>Aparelhos Conectados</b> → <b>Conectar um aparelho</b></p>
      <div style="background:#fff;border-radius:10px;width:180px;height:180px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;position:relative">
        <svg width="160" height="160" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
          <rect width="12" height="12" fill="white"/>
          <rect x="0" y="0" width="5" height="5" fill="none" stroke="black" stroke-width=".8"/>
          <rect x="1.5" y="1.5" width="2" height="2" fill="black"/>
          <rect x="7" y="0" width="5" height="5" fill="none" stroke="black" stroke-width=".8"/>
          <rect x="8.5" y="1.5" width="2" height="2" fill="black"/>
          <rect x="0" y="7" width="5" height="5" fill="none" stroke="black" stroke-width=".8"/>
          <rect x="1.5" y="8.5" width="2" height="2" fill="black"/>
          <rect x="6" y="5" width="1.5" height="1.5" fill="black"/>
          <rect x="8" y="6" width="1" height="1.5" fill="black"/>
          <rect x="6" y="7" width="2.5" height="1" fill="black"/>
          <rect x="9" y="8" width="3" height="3" fill="black"/>
          <rect x="6.5" y="9" width="1.5" height="1.5" fill="black"/>
          <rect x="5" y="5" width="1" height="2" fill="black"/>
          <text x="6" y="6.5" font-size="1.2" fill="#25d366" font-weight="bold" font-family="Arial">●</text>
        </svg>
        <div id="QR-OVERLAY" style="position:absolute;inset:0;background:rgba(255,255,255,.92);border-radius:10px;display:none;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-size:28px">⏳</div>
          <div style="font-size:11px;color:#333;margin-top:4px">Aguardando leitura…</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:12px" id="QR-TIMER">QR expira em: <b style="color:#ffa800">60s</b></div>
      <button class="bs w-100 justify-content-center" onclick="simulateQRScan()">
        <i class="fas fa-bolt"></i> Simular Leitura do QR (Demo)
      </button>
    </div>
  </div>`;
}

function renderEvoConnected() {
  return `
  <div style="text-align:center;padding:6px 0 12px">
    <div style="width:60px;height:60px;border-radius:50%;background:rgba(11,183,131,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:28px">📱</div>
    <h5 style="color:#0bb783;margin-bottom:4px">WhatsApp Conectado!</h5>
    <p style="color:var(--mu);font-size:12.5px;margin-bottom:14px">+55 85 98905-2954 • <span class="ba ba-g">online</span></p>
    <div style="background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.2);border-radius:7px;padding:10px 14px;text-align:left;margin-bottom:14px">
      <div class="d-flex justify-content-between mb-1"><span style="font-size:12px;color:var(--mu)">Dispositivo</span><b style="font-size:12px">Android 12 — Samsung</b></div>
      <div class="d-flex justify-content-between mb-1"><span style="font-size:12px;color:var(--mu)">Bateria</span><b style="font-size:12px;color:#0bb783">82% 🔋</b></div>
      <div class="d-flex justify-content-between"><span style="font-size:12px;color:var(--mu)">Conectado há</span><b style="font-size:12px">2 dias 14h</b></div>
    </div>
    <button class="bd w-100 justify-content-center" onclick="disconnectEvo()"><i class="fas fa-plug-circle-xmark"></i> Desconectar</button>
  </div>`;
}

function startQR() {
  document.getElementById('QR-AREA').style.display='block';
  let sec=60;
  qrInterval=setInterval(()=>{
    sec--;
    const el=document.getElementById('QR-TIMER');
    if(el) el.innerHTML=`QR expira em: <b style="color:${sec<15?'#f1416c':'#ffa800'}">${sec}s</b>`;
    if(sec<=0){clearInterval(qrInterval);if(el)el.innerHTML='<b style="color:#f1416c">QR expirado.</b> <span style="cursor:pointer;color:#009ef7" onclick="startQR()">Recarregar</span>';}
  },1000);
}

function simulateQRScan() {
  clearInterval(qrInterval);
  const ov=document.getElementById('QR-OVERLAY');
  if(ov){ov.style.display='flex';}
  setTimeout(()=>{
    evoConnected=true;
    document.getElementById('EVO-BODY').innerHTML=renderEvoConnected();
    toast('WhatsApp conectado com sucesso! 🎉','s');
  },1500);
}

function disconnectEvo() {
  evoConnected=false;
  document.getElementById('EVO-BODY').innerHTML=renderEvoDisconnected();
  toast('WhatsApp desconectado','w');
}

function evoAction(action, name) {
  const msgs={desconectar:`Instância ${name} desconectada`,reiniciar:`Instância ${name} reiniciando...`,testar:`Mensagem de teste enviada de ${name}`};
  const types={desconectar:'w',reiniciar:'i',testar:'s'};
  toast(msgs[action]||action,types[action]||'i');
}

// =====================================================
// AUTOMAÇÃO DE COBRANÇAS — REVENDA
// =====================================================
function renderRevendaAutomacao() {
  return `
  ${!evoConnected?`<div class="warn-b"><i class="fas fa-triangle-exclamation me-2" style="color:#ffa800"></i>Conecte seu WhatsApp em <b>Minha Instância</b> para ativar as automações.</div>`:''}
  <div class="info-b"><i class="fas fa-robot me-2" style="color:#009ef7"></i>As cobranças são enviadas automaticamente com base no vencimento dos seus clientes. Você <b>controla tudo</b>.</div>
  <div class="row g-3 mb-3">
    ${[['fa-paper-plane','#009ef7','34','Mensagens hoje'],['fa-calendar-check','#0bb783','87','Envios este mês'],['fa-calendar-xmark','#f1416c','3','Vencendo amanhã'],['fa-circle-xmark','#ffa800','1','Falharam'],].map(([ic,c,v,l])=>`
    <div class="col-6 col-md-3">
      <div style="background:${c}18;border:1px solid ${c}33;border-radius:9px;padding:14px 16px">
        <i class="fas ${ic}" style="color:${c};font-size:18px;margin-bottom:6px"></i>
        <div style="font-size:22px;font-weight:800;color:var(--hd)">${v}</div>
        <div style="font-size:11px;color:var(--mu)">${l}</div>
      </div>
    </div>`).join('')}
  </div>

  <div class="card mb-3">
    <div class="ch"><span class="ct"><i class="fas fa-sliders me-2"></i>Regras de Cobrança Automática</span><button class="bp ms-auto" onclick="toast('Nova regra adicionada','i')"><i class="fas fa-plus"></i> Nova Regra</button></div>
    <div class="cb">
      ${[
        {dias:3,momento:'antes',template:'lembrete_3d',msg:'Lembrete 3 dias antes',on:true},
        {dias:1,momento:'antes',template:'lembrete_1d',msg:'Lembrete 1 dia antes',on:true},
        {dias:0,momento:'no dia',template:'vencimento_hoje',msg:'Aviso no dia do vencimento',on:true},
        {dias:1,momento:'depois',template:'expirado_1d',msg:'Reativação após vencimento',on:false},
        {dias:3,momento:'depois',template:'expirado_3d',msg:'Segunda chance — 3 dias após',on:false},
      ].map((r,i)=>`
      <div class="auto-rule ${r.on?'active':'paused'} mb-2">
        <label class="toggle-sw"><input type="checkbox" ${r.on?'checked':''} onchange="toast(this.checked?'Regra ativada':'Regra pausada',this.checked?'s':'w')"><span class="toggle-sl"></span></label>
        <div style="width:38px;height:38px;border-radius:8px;background:${r.momento==='antes'?'rgba(0,158,247,.15)':r.momento==='no dia'?'rgba(241,65,108,.15)':'rgba(255,168,0,.15)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px">${r.momento==='antes'?'⏰':r.momento==='no dia'?'🚨':'💸'}</span>
        </div>
        <div class="flex-grow-1">
          <div style="font-weight:700;color:var(--hd);font-size:13px">${r.msg}</div>
          <div style="font-size:11px;color:var(--mu)">${r.dias===0?'No dia do vencimento':`${r.dias} dia(s) ${r.momento} do vencimento`} • <code style="font-size:10px">${r.template}</code></div>
        </div>
        <button class="ic ic-e" onclick="toast('Editando regra','i')"><i class="fas fa-pencil"></i></button>
      </div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div class="ch"><span class="ct"><i class="fas fa-calendar-week me-2"></i>Clientes que Vencem em Breve</span></div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Cliente</th><th>Plano</th><th>Vencimento</th><th>WhatsApp</th><th>Status Cobrança</th><th></th></tr></thead>
        <tbody>
          <tr><td><b>09022026</b></td><td>TESTE COMPLETO</td><td><span style="color:#f1416c;font-weight:700">28/04/2026</span></td><td>—</td>
            <td><span class="ba ba-r">Sem WhatsApp</span></td>
            <td><button class="ic ic-r" title="Renovar" onclick="openModalRenovar(3)"><i class="fas fa-calendar-plus"></i></button></td></tr>
          <tr><td><b>7731533</b></td><td>1 MES COMPLETO</td><td><span style="color:#ffa800;font-weight:700">15/05/2026</span></td><td>+55 85 98888-5678</td>
            <td><span class="ba ba-o">Lembrete 3d agendado</span></td>
            <td><button class="ic ic-v" title="Enviar agora" onclick="toast('Mensagem enviada para 7731533!','s')"><i class="fas fa-paper-plane"></i></button></td></tr>
          <tr><td><b>juaniptv1</b></td><td>1 MES SEM ADULTOS</td><td><span style="color:#ffa800">26/05/2026</span></td><td>+55 85 99999-1234</td>
            <td><span class="ba ba-o">Lembrete 3d agendado</span></td>
            <td><button class="ic ic-v" title="Enviar agora" onclick="toast('Mensagem enviada para juaniptv1!','s')"><i class="fas fa-paper-plane"></i></button></td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderRevendaTemplates() {
  return `
  <div class="info-b"><i class="fas fa-info-circle me-2" style="color:#009ef7"></i>Personalize seus templates. Use as variáveis disponíveis para mensagens dinâmicas.</div>
  <div class="row g-3">
    <div class="col-12 col-md-7">
      <div class="card"><div class="ch"><span class="ct">Editor de Template</span></div>
        <div class="cb">
          <div class="row g-3">
            <div class="col-12 col-md-6"><label class="fl">Slug do Template</label><input type="text" class="fc" id="tpl-slug" value="lembrete_3d"></div>
            <div class="col-12 col-md-6"><label class="fl">Título</label><input type="text" class="fc" id="tpl-title" value="Lembrete 3 dias"></div>
            <div class="col-12"><label class="fl">Mensagem</label>
              <textarea class="fc" id="tpl-body" rows="6" style="resize:vertical">Olá {{nome}}! 😊

Seu plano *{{plano}}* vence em *3 dias* ({{vencimento}}).

💳 Renove agora e não perca o acesso!
👉 {{link_renovacao}}

Valor: {{valor}}

Qualquer dúvida, me chame aqui! 🙋</textarea>
            </div>
            <div class="col-12">
              <div class="d-flex gap-2">
                <button class="bp" onclick="toast('Template salvo!','s')"><i class="fas fa-floppy-disk"></i> Salvar</button>
                <button class="bsec" onclick="toast('Pré-visualização atualizada','i')"><i class="fas fa-eye"></i> Prévia</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-5">
      <div class="card mb-3"><div class="ch"><span class="ct">Variáveis Disponíveis</span></div>
        <div class="cb">
          ${['{{nome}}','{{usuario}}','{{plano}}','{{vencimento}}','{{valor}}','{{link_renovacao}}','{{servidor}}','{{wpp_revenda}}'].map(v=>`
          <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:4px;padding:5px 10px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;font-family:monospace;font-size:11.5px">
            <span style="color:#009ef7">${v}</span>
            <button style="background:none;border:none;color:var(--mu);cursor:pointer" onclick="insertVar('tpl-body','${v}');toast('${v} inserido!','i')"><i class="fas fa-plus"></i></button>
          </div>`).join('')}
        </div>
      </div>
      <div class="card"><div class="ch"><span class="ct">Prévia no WhatsApp</span></div>
        <div class="cb">
          <div style="background:#e5ddd5;border-radius:8px;padding:14px;min-height:120px">
            <div style="background:#fff;border-radius:8px;padding:10px 13px;max-width:90%;font-size:12.5px;line-height:1.6;color:#111;white-space:pre-wrap;box-shadow:0 1px 3px rgba(0,0,0,.12)">Olá <b>João</b>! 😊

Seu plano <b>1 MES COMPLETO</b> vence em <b>3 dias</b> (26/05/2026).

💳 Renove agora e não perca o acesso!
👉 fuze.lat/pagar?ref=slayker

Valor: R$ 30,00</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function insertVar(id, v) {
  const ta=document.getElementById(id);
  if(!ta) return;
  const s=ta.selectionStart, e=ta.selectionEnd;
  ta.value=ta.value.substr(0,s)+v+ta.value.substr(e);
  ta.selectionStart=ta.selectionEnd=s+v.length;
  ta.focus();
}

function renderEvoLogs() {
  const logs=[
    {ts:'28/04 18:30',cli:'juaniptv1',num:'+55 85 99999-1234',tpl:'lembrete_3d',status:'read',delay:'0.8s'},
    {ts:'28/04 18:30',cli:'7731533',num:'+55 85 98888-5678',tpl:'lembrete_3d',status:'delivered',delay:'1.2s'},
    {ts:'28/04 17:00',cli:'g9gRKgwd',num:'+55 11 97777-4321',tpl:'lembrete_1d',status:'read',delay:'0.5s'},
    {ts:'27/04 10:00',cli:'4342one4342tv',num:'—',tpl:'vencimento_hoje',status:'failed',delay:'—'},
    {ts:'26/04 09:00',cli:'mariaiptv',num:'+55 11 96666-8765',tpl:'renovado_ok',status:'read',delay:'0.9s'},
  ];
  return `
  <div class="tlb">
    <div class="flt">
      <div class="sw"><i class="fas fa-magnifying-glass"></i><input type="text" class="fc" placeholder="Pesquisar" oninput="filterTbl('tbl-logs',this.value)"></div>
      <select class="fs" style="width:auto"><option>Todos</option><option>read</option><option>delivered</option><option>failed</option></select>
    </div>
    <button class="bp" onclick="toast('Exportando logs...','i')"><i class="fas fa-file-export"></i> Exportar</button>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="tbl" id="tbl-logs">
      <thead><tr><th>Horário</th><th>Cliente</th><th>Número</th><th>Template</th><th>Status</th><th>Latência</th></tr></thead>
      <tbody>${logs.map(l=>`<tr>
        <td><small>${l.ts}</small></td><td><b>${l.cli}</b></td>
        <td><small>${l.num}</small></td>
        <td><code style="font-size:10.5px;color:#009ef7">${l.tpl}</code></td>
        <td><span class="ba ${l.status==='read'?'ba-p':l.status==='delivered'?'ba-g':l.status==='failed'?'ba-r':'ba-o'}">${l.status}</span></td>
        <td><small style="color:var(--mu)">${l.delay}</small></td>
      </tr>`).join('')}</tbody>
    </table>
  </div></div>`;
}

// =====================================================
// GAMIFICATION — REVENDA
// =====================================================
const MY_RANK = { pos:4, pts:1920, ptsNext:2200, nivel:'Prata', nivelNext:'Ouro', vendas:16, clientes:9, streak:3, badges:['first_sale','ten_clients','boas_vindas'], pct:Math.round((1920-1500)/(2200-1500)*100) };

function renderMeuRanking() {
  return `
  <div class="row g-3 mb-3">
    <div class="col-12">
      <div style="background:linear-gradient(135deg,rgba(0,158,247,.12),rgba(114,57,234,.12));border:1px solid rgba(0,158,247,.25);border-radius:12px;padding:20px 24px">
        <div class="row align-items-center g-3">
          <div class="col-auto">
            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#c0c0c0,#888);display:flex;align-items:center;justify-content:center;font-size:28px">🥈</div>
          </div>
          <div class="col">
            <div style="font-size:12px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px">Sua posição este mês</div>
            <div style="font-size:28px;font-weight:900;color:var(--hd)">#${MY_RANK.pos}º lugar</div>
            <div style="font-size:13px;color:var(--mu)">Nível <b style="color:#009ef7">${MY_RANK.nivel}</b> • ${MY_RANK.pts.toLocaleString()} pontos • 🔥 ${MY_RANK.streak} dias seguidos</div>
          </div>
          <div class="col-12 col-md-4">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Progresso para <b style="color:#ffa800">${MY_RANK.nivelNext}</b> (${MY_RANK.ptsNext.toLocaleString()} pts)</div>
            <div class="prog-bar" style="height:10px"><div class="prog-fill" style="width:${MY_RANK.pct}%"></div></div>
            <div style="font-size:10.5px;color:var(--mu);margin-top:4px">${MY_RANK.pts.toLocaleString()} / ${MY_RANK.ptsNext.toLocaleString()} • Faltam ${(MY_RANK.ptsNext-MY_RANK.pts).toLocaleString()} pontos</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-3 mb-3">
    ${[['⭐','Pontos','1.920'],['🏆','Posição no ranking','#4º'],['📈','Vendas este mês','16'],['👥','Clientes ativos','9'],['🔥','Streak atual','3 dias'],['🏅','Badges ganhas','3']].map(([ic,lbl,val])=>`
    <div class="col-6 col-md-2">
      <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:9px;padding:13px;text-align:center">
        <div style="font-size:22px;margin-bottom:4px">${ic}</div>
        <div style="font-size:18px;font-weight:800;color:var(--hd)">${val}</div>
        <div style="font-size:10.5px;color:var(--mu)">${lbl}</div>
      </div>
    </div>`).join('')}
  </div>

  <div class="row g-3">
    <div class="col-12 col-md-7">
      <div class="card"><div class="ch"><span class="ct">🏆 Ranking Geral — Abril/2026</span></div>
        <div>
          ${RANK_DATA.map(r=>`
          <div class="lb-row ${r.user==='Slayker'?'':''}">
            <div class="lb-pos" style="color:${r.pos<=3?['#ffd700','#b0b0b0','#cd7f32'][r.pos-1]:'var(--mu)'};${r.user==='Slayker'?'background:rgba(0,158,247,.08);border-radius:4px;padding:2px 4px':''}">${r.pos===1?'🥇':r.pos===2?'🥈':r.pos===3?'🥉':r.pos}</div>
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,${r.user==='Slayker'?'#009ef7,#7239ea':'#444,#333'});display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${r.user[0]}</div>
            <div class="flex-grow-1">
              <div style="font-weight:${r.user==='Slayker'?700:600};color:${r.user==='Slayker'?'#009ef7':'var(--hd)'}">
                ${r.user} ${r.user==='Slayker'?'<span style="font-size:10px;color:#009ef7">(você)</span>':''}
              </div>
              <div style="font-size:10.5px;color:var(--mu)">🔥${r.streak}d • ${r.vendas} vendas</div>
            </div>
            <div style="font-weight:700;color:var(--hd)">${r.pts.toLocaleString()}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="col-12 col-md-5">
      <div class="card mb-3"><div class="ch"><span class="ct">🎯 Missões em Andamento</span></div>
        <div class="cb">
          ${[{t:'Sprint de Abril',prog:73,icon:'🏃',bonus:'+15 cred'},{t:'Rei do WhatsApp',prog:42,icon:'📱',bonus:'+8 cred'},{t:'Zero Churn',prog:90,icon:'💪',bonus:'Badge VIP'}].map(m=>`
          <div class="mission mb-2">
            <div class="mission-icon" style="background:var(--cbg)">${m.icon}</div>
            <div class="flex-grow-1">
              <div style="font-size:13px;font-weight:600;color:var(--hd)">${m.t}</div>
              <div style="font-size:10px;color:var(--mu)">${m.bonus}</div>
              <div class="prog-bar mt-1"><div class="prog-fill" style="width:${m.prog}%"></div></div>
            </div>
            <div style="font-size:13px;font-weight:700;color:#009ef7">${m.prog}%</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card"><div class="ch"><span class="ct">💰 Bônus Esperado no Final do Mês</span></div>
        <div class="cb">
          <div style="background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.25);border-radius:8px;padding:14px 16px;text-align:center">
            <div style="font-size:11px;color:var(--mu)">Se mantiver posição atual (#4)</div>
            <div style="font-size:28px;font-weight:900;color:#ffd700;margin:6px 0">0 créditos</div>
            <div style="font-size:11px;color:var(--mu);margin-bottom:12px">Top 3 recebe bônus automático 🏆</div>
            <div class="prog-bar mb-1" style="height:8px"><div class="prog-fill" style="width:${MY_RANK.pct}%"></div></div>
            <div style="font-size:10.5px;color:var(--mu)">Precisa de <b>${(MY_RANK.ptsNext-MY_RANK.pts).toLocaleString()} pontos</b> para subir para #3 e ganhar <b style="color:#ffd700">+10 créditos</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderMinhasConquistas() {
  const earned = new Set(MY_RANK.badges);
  const allBadges = [
    ...BADGES_DEF,
    {id:'boas_vindas',icon:'👋',name:'Anfitrião',desc:'Enviou mensagem de boas-vindas',color:'#0bb783',req:1,tipo:'msgs',prog:100},
    {id:'automator',icon:'🤖',name:'Automatizador',desc:'1000 msgs enviadas pelo bot',color:'#009ef7',req:1000,tipo:'msgs',prog:49},
    {id:'top3',icon:'🏅',name:'Pódio',desc:'Entrou no top 3 do ranking',color:'#ffa800',req:1,tipo:'rank',prog:0},
    {id:'streak_30',icon:'🌟',name:'Um Mês Imparável',desc:'30 dias seguidos de vendas',color:'#7239ea',req:30,tipo:'streak',prog:10},
  ];
  return `
  <div class="row g-3 mb-3">
    <div class="col-12">
      <div style="background:var(--ibg);border:1px solid var(--brd);border-radius:9px;padding:14px 18px;display:flex;align-items:center;gap:14px">
        <div style="font-size:36px">🏅</div>
        <div>
          <div style="font-weight:700;color:var(--hd)">${MY_RANK.badges.length} de ${allBadges.length} conquistas desbloqueadas</div>
          <div style="font-size:12px;color:var(--mu)">Continue vendendo para desbloquear todas as badges!</div>
          <div class="prog-bar mt-2" style="max-width:200px"><div class="prog-fill" style="width:${Math.round(MY_RANK.badges.length/allBadges.length*100)}%"></div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="row g-3">
    ${allBadges.map(b=>{
      const has = earned.has(b.id);
      const prog = has?100:(b.prog||0);
      return `
      <div class="col-6 col-md-3">
        <div class="badge-card ${has?'earned':'locked'}">
          <div class="badge-icon" style="background:${b.color}22;font-size:24px">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
          ${has
            ?`<div class="ba ba-g mt-2" style="display:inline-block">✓ Conquistada</div>`
            :`<div>
                <div class="prog-bar mt-2"><div class="prog-fill" style="width:${prog}%;background:${b.color}"></div></div>
                <div style="font-size:9.5px;color:var(--mu);margin-top:3px">${prog}% concluído</div>
              </div>`}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function openEvoModal() {
  toast('Modal de criação de instância Evolution','i');
}
function openAutoModal() {
  toast('Modal de criação de automação','i');
}
function openQRModal(name) {
  toast(`Abrindo QR Code para reconectar: ${name}`,'i');
}
function updateEvoPreview() {
  const tpls={
    boas_vindas:'🎉 Bem-vindo(a) João ao FUZE IPTV!\n\n📱 Usuário: juaniptv1\n🔑 Senha: ••••••\n🖥️ Servidor: painel.fuze.lat\n\nPlano: 1 MES SEM ADULTOS • Vence: 26/05/2026',
    lembrete_3d:'Olá João! 😊\n\nSeu plano *1 MES SEM ADULTOS* vence em *3 dias* (26/05/2026).\n\n💳 Renove agora!\n👉 fuze.lat/pagar\n\nValor: R$ 30,00',
    vencimento_hoje:'⚠️ João, seu plano vence *hoje*!\n\nPara não perder o acesso, renove agora mesmo 👇\nfuze.lat/pagar\n\nValor: R$ 30,00',
  };
  const sel=document.getElementById('evo-tpl');
  const p=document.getElementById('evo-preview');
  if(sel&&p) p.textContent=tpls[sel.value]||'';
}

// Revenda credits check
function checkTCred() {
  const qty = parseInt(document.getElementById('tcred-qty').value)||0;
  const myC = ROLE==='admin'?Infinity:DB.credits.revenda;
  const prev = document.getElementById('tcred-prev');
  const err = document.getElementById('tcred-err');
  if (qty>0 && (myC===Infinity||qty<=myC)) {
    prev.style.display='block';
    document.getElementById('tcred-after').textContent = myC===Infinity?'∞':(myC-qty);
    err.style.display='none';
  } else if (qty>0) {
    err.style.display='block'; prev.style.display='none';
  } else { prev.style.display='none'; err.style.display='none'; }
}

function doTCred() {
  const qty = parseInt(document.getElementById('tcred-qty').value)||0;
  const dest = document.getElementById('tcred-dest').value;
  if (!dest || dest==='') { toast('Selecione a sub-revenda destino','e'); return; }
  if (qty<=0) { toast('Informe uma quantidade válida','e'); return; }
  if (ROLE==='revenda' && qty>DB.credits.revenda) { toast('Créditos insuficientes!','e'); return; }
  if (ROLE==='revenda') DB.credits.revenda-=qty;
  updateCredDisplay();
  toast(`${qty} créditos transferidos para ${dest}!`,'s');
  renderPage(curPage);
}

function updateCredDisplay() {
  const els = document.querySelectorAll('#SIDEBAR-CRED,#DASH-CRED,#RCRED-DISP,#RCRED-INFO b,#TCRED-N,#ADDCRED-MY');
  els.forEach(e=>{if(e)e.textContent=DB.credits.revenda});
  const sbEl = document.getElementById('SIDEBAR-CRED');
  if (sbEl) sbEl.textContent = DB.credits.revenda;
  const sbLine = document.querySelector('.a-metric');
  if (sbLine && ROLE==='revenda') {
    // update sidebar credits
  }
}

// =====================================================
// MODAL HELPERS
// =====================================================
function openModal(id) { document.getElementById(id).classList.add('on'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('on');
  if (id==='M-PAYMENT') clearInterval(pixInterval);
}
document.querySelectorAll('.modal-ov').forEach(m=>m.addEventListener('click',e=>{if(e.target===m){closeModal(m.id)}}));

// =====================================================
// TABLE FILTER
// =====================================================
function filterTbl(id, q) {
  const tbl = document.getElementById(id);
  if (!tbl) return;
  const lq = q.toLowerCase();
  tbl.querySelectorAll('tbody tr').forEach(r=>r.style.display=(!lq||r.textContent.toLowerCase().includes(lq))?'':'none');
}
function filterTblCol(id, col, q) {
  const tbl = document.getElementById(id);
  if (!tbl) return;
  tbl.querySelectorAll('tbody tr').forEach(r=>{
    const cell = r.cells[col];
    r.style.display = (!q||!cell||cell.textContent.toLowerCase().includes(q.toLowerCase()))?'':'none';
  });
}

// =====================================================
// CHARTS
// =====================================================
function initAdminCharts() {
  const el = document.getElementById('CH_ADMIN');
  if (!el || el._c) return;
  const mode = document.documentElement.getAttribute('data-bs-theme')||'dark';
  const t = mode==='dark'?{g:'#2b2b40',tc:'#7e8299'}:{g:'#eff2f5',tc:'#a1a5b7'};
  const p = getComputedStyle(document.documentElement).getPropertyValue('--pr').trim()||'#009ef7';
  const c = new ApexCharts(el,{
    chart:{type:'area',height:200,background:'transparent',toolbar:{show:false}},
    theme:{mode},tooltip:{theme:mode},
    series:[{name:'Novos',data:[2,5,3,8,4,7,9,5,8,11,7,12,8,10,9]},{name:'Expirados',data:[1,2,1,3,2,3,4,2,3,5,3,5,3,4,4]}],
    colors:[p,'#f1416c'],fill:{type:'gradient',gradient:{opacityFrom:.35,opacityTo:.05}},
    stroke:{width:2,curve:'smooth'},
    xaxis:{categories:['13/04','15/04','17/04','19/04','21/04','23/04','25/04','27/04','29/04','01/05','03/05','05/05','07/05','09/05','11/05'],labels:{style:{colors:t.tc,fontSize:'10px'}},axisBorder:{show:false},axisTicks:{show:false}},
    yaxis:{labels:{style:{colors:t.tc,fontSize:'10px'}}},
    grid:{borderColor:t.g,strokeDashArray:4},legend:{labels:{colors:t.tc}}
  });
  c.render(); el._c = true;
}

function initRevChart() {
  const el = document.getElementById('CH_REV');
  if (!el||el._c) return;
  const mode = document.documentElement.getAttribute('data-bs-theme')||'dark';
  const t = mode==='dark'?{g:'#2b2b40',tc:'#7e8299'}:{g:'#eff2f5',tc:'#a1a5b7'};
  const p = getComputedStyle(document.documentElement).getPropertyValue('--pr').trim()||'#009ef7';
  const c = new ApexCharts(el,{
    chart:{type:'bar',height:150,background:'transparent',toolbar:{show:false}},
    theme:{mode},tooltip:{theme:mode},
    series:[{name:'Clientes',data:[1,2,3,2,1,3,4,2]}],
    colors:[p],plotOptions:{bar:{borderRadius:4,columnWidth:'55%'}},
    xaxis:{categories:['Abr 1','Abr 8','Abr 15','Abr 22','Abr 29','Mai 6','Mai 13','Mai 20'],labels:{style:{colors:t.tc,fontSize:'10px'}},axisBorder:{show:false},axisTicks:{show:false}},
    yaxis:{labels:{style:{colors:t.tc,fontSize:'10px'}}},
    grid:{borderColor:t.g,strokeDashArray:4}
  });
  c.render(); el._c=true;
}

// =====================================================
// TABS
// =====================================================
function switchTab(btn, id) {
  const parent = btn.closest('.card,.pg,[class=""]') || document.getElementById('MAIN-CONTENT');
  parent.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  parent.querySelectorAll('.tbc').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById(id); if(el) el.classList.add('active');
}

// =====================================================
// THEME
// =====================================================
function toggleTheme() { setTheme(document.documentElement.getAttribute('data-bs-theme')==='dark'?'light':'dark'); }
function setTheme(t) {
  document.documentElement.setAttribute('data-bs-theme',t);
  ['THBTN','LTH'].forEach(id=>{const e=document.getElementById(id);if(e)e.className=t==='dark'?'fas fa-sun':'fas fa-moon';});
  localStorage.setItem('fuze-th',t);
}
function setP(c) { document.documentElement.style.setProperty('--pr',c); }
setTheme(localStorage.getItem('fuze-th')||'dark');

function toggleSB() { document.getElementById('ASIDE').classList.toggle('open'); document.getElementById('OVL').classList.toggle('on'); }
function closeSB() { document.getElementById('ASIDE').classList.remove('open'); document.getElementById('OVL').classList.remove('on'); }

// =====================================================
// TOAST
// =====================================================
function toast(msg, type='i') {
  const icons={s:'fa-check-circle',e:'fa-xmark-circle',i:'fa-info-circle',w:'fa-triangle-exclamation'};
  const colors={s:'#0bb783',e:'#f1416c',i:'#009ef7',w:'#ffa800'};
  const div=document.createElement('div');
  div.className=`toast t${type}`;
  div.innerHTML=`<i class="fas ${icons[type]}" style="color:${colors[type]};font-size:16px"></i><span>${msg}</span>`;
  document.getElementById('TOASTS').appendChild(div);
  setTimeout(()=>div.remove(),3000);
}