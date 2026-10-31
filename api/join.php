<?php
// Registra un jugador en una partida activa y genera su token.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');

$body = readJsonBody();
$code = normalizeCode((string) ($body['game_code'] ?? ''));
$name = trim((string) ($body['player_name'] ?? ''));

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
}
if ($name === '' || mb_strlen($name, 'UTF-8') > 100) {
    jsonResponse(['ok' => false, 'error' => 'El nombre debe tener entre 1 y 100 caracteres'], 400);
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT id, initial_balance, status FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
}
if ($game['status'] !== 'active') {
    jsonResponse(['ok' => false, 'error' => 'La partida ya finalizó'], 409);
}

$token = bin2hex(random_bytes(16));
$balance = (int) $game['initial_balance'];

try {
    $stmt = $pdo->prepare(
        'INSERT INTO players (game_id, name, token, balance) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([(int) $game['id'], $name, $token, $balance]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        jsonResponse(['ok' => false, 'error' => 'Ese nombre ya está en uso. Si ya te habías unido, continúa desde este dispositivo o pide a la Banca un enlace nuevo.'], 409);
    }
    throw $e;
}

$playerId = (int) $pdo->lastInsertId();

jsonResponse([
    'ok'     => true,
    'token'  => $token,
    'url'    => 'index.php?token=' . $token,
    'player' => [
        'id'      => $playerId,
        'name'    => $name,
        'balance' => $balance,
    ],
], 201);
