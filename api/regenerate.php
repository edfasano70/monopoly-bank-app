<?php
// La Banca regenera el enlace de acceso de un jugador (invalida el anterior).
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');

$body = readJsonBody();
$code = normalizeCode((string) ($body['game_code'] ?? ''));
$playerId = filter_var(
    $body['player_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
}
if ($playerId === false) {
    jsonResponse(['ok' => false, 'error' => 'Jugador inválido'], 400);
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT id FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
}

$stmt = $pdo->prepare('SELECT id, name FROM players WHERE id = ? AND game_id = ?');
$stmt->execute([(int) $playerId, (int) $game['id']]);
$player = $stmt->fetch();

if (!$player) {
    jsonResponse(['ok' => false, 'error' => 'El jugador no pertenece a esta partida'], 404);
}

$token = bin2hex(random_bytes(16));
$stmt = $pdo->prepare('UPDATE players SET token = ? WHERE id = ? AND game_id = ?');
$stmt->execute([$token, (int) $player['id'], (int) $game['id']]);

if ($stmt->rowCount() !== 1) {
    jsonResponse(['ok' => false, 'error' => 'No se pudo regenerar el enlace'], 500);
}

jsonResponse([
    'ok'     => true,
    'token'  => $token,
    'url'    => 'index.php?token=' . $token,
    'player' => [
        'id'   => (int) $player['id'],
        'name' => $player['name'],
    ],
]);
