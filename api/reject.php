<?php
// Rechaza una transferencia pendiente entre jugadores.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');

$body = readJsonBody();
$code = normalizeCode((string) ($body['game_code'] ?? ''));
$pendingId = filter_var(
    $body['pending_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
}
if ($pendingId === false) {
    jsonResponse(['ok' => false, 'error' => 'Solicitud inválida'], 400);
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT id FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
}

$stmt = $pdo->prepare(
    "UPDATE pending_transfers
     SET status = 'rejected', resolved_at = NOW()
     WHERE id = ? AND game_id = ? AND status = 'pending'"
);
$stmt->execute([(int) $pendingId, (int) $game['id']]);

if ($stmt->rowCount() !== 1) {
    $stmt = $pdo->prepare('SELECT id FROM pending_transfers WHERE id = ? AND game_id = ?');
    $stmt->execute([(int) $pendingId, (int) $game['id']]);
    if (!$stmt->fetch()) {
        jsonResponse(['ok' => false, 'error' => 'Solicitud no encontrada'], 404);
    }
    jsonResponse(['ok' => false, 'error' => 'La solicitud ya fue resuelta'], 409);
}

jsonResponse(['ok' => true]);
