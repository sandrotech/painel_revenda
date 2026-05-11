<?php
// Configuration file for FUZE IPTV Panel

define('DB_HOST', 'localhost');
define('DB_NAME', 'painel_fuze');
define('DB_USER', 'root');
define('DB_PASS', '');

// ============================================================
// XUI One API Integration
// ============================================================
define('XUI_API_URL',        'https://621195.lat');
define('XUI_ACCESS_CODE',    'SJefmjJQTESTE');
define('XUI_API_KEY',        'C34A2AD41B9B6B864BDEC9417659D1C1');

// Monta a base URL completa para chamadas à API
// Exemplo: https://621195.lat/SJefmjJQTESTE/?api_key=C34A2AD41B9B6B864BDEC9417659D1C1&action=get_movies
define('XUI_API_BASE', XUI_API_URL . '/' . XUI_ACCESS_CODE . '/?api_key=' . XUI_API_KEY);

/**
 * Função helper para chamar a API do XUI One
 * 
 * @param string $action  Ação da API (ex: get_movies, get_users, create_line)
 * @param array  $params  Parâmetros adicionais para a requisição
 * @param string $method  Método HTTP (GET ou POST)
 * @return array|null      Resposta decodificada em JSON ou null em caso de erro
 */
function xuiApiCall(string $action, array $params = [], string $method = 'GET'): ?array {
    $url = XUI_API_BASE . '&action=' . urlencode($action);

    if ($method === 'GET' && !empty($params)) {
        $url .= '&' . http_build_query($params);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("XUI API Error: $error");
        return null;
    }

    return json_decode($response, true);
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

session_start();

// Helper to check if user is logged in
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: index.php");
        exit;
    }
}
?>
