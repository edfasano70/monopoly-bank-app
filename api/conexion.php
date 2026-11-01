<?php
// Conexión PDO compartida y utilidades de respuesta JSON.
declare(strict_types=1);

function appConfig(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) {
            jsonResponse(['ok' => false, 'error' => 'Configuración no disponible'], 500);
        }
        $config = require $path;
    }
    return $config;
}

function getPDO(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = appConfig();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $c['db_host'],
        $c['db_name'],
        $c['db_charset']
    );
    $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function jsonResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function requireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        jsonResponse(['ok' => false, 'error' => 'Método no permitido'], 405);
    }
}

function startSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => $https,
        ]);
        session_start();
    }
}

function normalizeCode(string $code): string
{
    return strtoupper(trim($code));
}

function isValidCode(string $code): bool
{
    return preg_match('/^[A-Z0-9_-]{1,50}$/', $code) === 1;
}

if (PHP_SAPI !== 'cli') {
    set_exception_handler(static function (Throwable $e): void {
        error_log('monopoly: ' . $e->getMessage());
        jsonResponse(['ok' => false, 'error' => 'Error interno del servidor'], 500);
    });
}
