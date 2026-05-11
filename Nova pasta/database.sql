CREATE DATABASE IF NOT EXISTS painel_fuze DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE painel_fuze;

CREATE TABLE IF NOT EXISTS planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    srv VARCHAR(50) NOT NULL,
    cred INT DEFAULT 0,
    dur VARCHAR(50) NOT NULL,
    conn INT DEFAULT 1,
    valor VARCHAR(20) DEFAULT '—',
    teste BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS revendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) DEFAULT NULL,
    wpp VARCHAR(30) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    cred INT DEFAULT 0,
    nivel INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'Ativo',
    master VARCHAR(50) DEFAULT NULL,
    clientes INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) DEFAULT NULL,
    wpp VARCHAR(30) DEFAULT NULL,
    srv VARCHAR(50) NOT NULL,
    plano VARCHAR(100) NOT NULL,
    plano_id INT NOT NULL,
    exp VARCHAR(20) NOT NULL,
    conn INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'Ativo',
    revenda VARCHAR(50) NOT NULL,
    valor VARCHAR(20) DEFAULT '—'
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id VARCHAR(20) PRIMARY KEY,
    user VARCHAR(50) NOT NULL,
    plano VARCHAR(100) NOT NULL,
    valor VARCHAR(20) NOT NULL,
    data VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Aguardando'
);

-- Inserindo alguns dados de teste parecidos com o mock original
INSERT IGNORE INTO planos (id, nome, srv, cred, dur, conn, valor, teste) VALUES
(1, 'TESTE COMPLETO', 'Fz Play', 0, '4 Horas', 1, '—', TRUE),
(3, '1 MES COMPLETO', 'Fz Play', 1, '30 Dias', 2, 'R$30', FALSE),
(4, '1 MES SEM ADULTOS', 'Fz Play', 1, '30 Dias', 2, 'R$30', FALSE),
(9, 'MAX ANUAL', 'Max Player', 4, '365 Dias', 6, 'R$250', FALSE);

INSERT IGNORE INTO revendas (id, user, nome, wpp, email, cred, nivel, status, master, clientes) VALUES
(1, 'Slayker', 'Slayker Rev', '+55 85 99810-0727', 'slayker@email.com', 3, 1, 'Ativo', 'super-fuze', 42),
(2, 'elson', 'Elson IPTV', '+55 85 97777-2345', 'elson@email.com', 7, 1, 'Ativo', 'super-fuze', 18);

INSERT IGNORE INTO clientes (id, user, nome, wpp, srv, plano, plano_id, exp, conn, status, revenda, valor) VALUES
(1, 'juaniptv1', 'João Silva', '+55 85 99999-1234', 'Fz Play', '1 MES SEM ADULTOS', 4, '26/05/2026', 2, 'Ativo', 'Slayker', 'R$ 30,00'),
(2, '7731533', 'Maria Santos', '+55 85 98888-5678', 'Fz Play', '1 MES COMPLETO', 3, '15/05/2026', 2, 'Ativo', 'Slayker', 'R$ 30,00');

INSERT IGNORE INTO pagamentos (id, user, plano, valor, data, status) VALUES
('354751093', 'juaniptv1', '1 MES SEM ADULTOS', 'R$ 30,00', '27/04/2026', 'Pago');
