<?php
// Crea o recupera una partida por código.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');

$body = readJsonBody();
$code = normalizeCode((string) ($body['code'] ?? ''));
$initial = filter_var(
    $body['initial_balance'] ?? 1500,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 0, 'max_range' => 1000000000]]
);

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código inválido. Usa letras, números, guion o guion bajo.'], 400);
}
if ($initial === false) {
    jsonResponse(['ok' => false, 'error' => 'Saldo inicial inválido'], 400);
}

$pdo = getPDO();
$pdo->prepare('INSERT IGNORE INTO games (code, initial_balance) VALUES (?, ?)')
    ->execute([$code, $initial]);

$stmt = $pdo->prepare(
    'SELECT id, code, initial_balance, status, created_at FROM games WHERE code = ?'
);
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'No se pudo crear la partida'], 500);
}

jsonResponse([
    'ok'   => true,
    'game' => [
        'id'              => (int) $game['id'],
        'code'            => $game['code'],
        'initial_balance' => (int) $game['initial_balance'],
        'status'          => $game['status'],
        'created_at'      => $game['created_at'],
    ],
]);
