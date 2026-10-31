<?php
// Devuelve el estado de la partida para el polling del frontend.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('GET');

$code = normalizeCode((string) ($_GET['code'] ?? ''));
$token = trim((string) ($_GET['token'] ?? ''));

if ($code === '' && $token === '') {
    jsonResponse(['ok' => false, 'error' => 'Indica code o token'], 400);
}

$pdo = getPDO();
$current = null;

if ($token !== '') {
    if (preg_match('/^[a-f0-9]{32}$/', $token) !== 1) {
        jsonResponse(['ok' => false, 'error' => 'Token inválido'], 400);
    }
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.balance, p.game_id,
                g.code, g.status, g.initial_balance
         FROM players p
         JOIN games g ON g.id = p.game_id
         WHERE p.token = ?'
    );
    $stmt->execute([$token]);
    $current = $stmt->fetch();
    if (!$current) {
        jsonResponse(['ok' => false, 'error' => 'Enlace de jugador inválido'], 404);
    }
    $gameId = (int) $current['game_id'];
    $game = [
        'code'            => $current['code'],
        'status'          => $current['status'],
        'initial_balance' => (int) $current['initial_balance'],
    ];
} else {
    if (!isValidCode($code)) {
        jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
    }
    $stmt = $pdo->prepare(
        'SELECT id, code, status, initial_balance FROM games WHERE code = ?'
    );
    $stmt->execute([$code]);
    $game = $stmt->fetch();
    if (!$game) {
        jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
    }
    $gameId = (int) $game['id'];
}

$stmt = $pdo->prepare('SELECT id, name, balance FROM players WHERE game_id = ? ORDER BY id ASC');
$stmt->execute([$gameId]);
$players = array_map(static function (array $p): array {
    return [
        'id'      => (int) $p['id'],
        'name'    => $p['name'],
        'balance' => (int) $p['balance'],
    ];
}, $stmt->fetchAll());

$stmt = $pdo->prepare(
    'SELECT t.id, t.from_player_id, t.to_player_id, t.amount, t.description, t.created_at,
            pf.name AS from_name, pt.name AS to_name
     FROM transactions t
     LEFT JOIN players pf ON pf.id = t.from_player_id
     LEFT JOIN players pt ON pt.id = t.to_player_id
     WHERE t.game_id = ?
     ORDER BY t.id DESC
     LIMIT 50'
);
$stmt->execute([$gameId]);
$transactions = array_map(static function (array $t): array {
    return [
        'id'             => (int) $t['id'],
        'from_player_id' => $t['from_player_id'] !== null ? (int) $t['from_player_id'] : null,
        'to_player_id'   => $t['to_player_id'] !== null ? (int) $t['to_player_id'] : null,
        'from_name'      => $t['from_name'] ?? 'Banca',
        'to_name'        => $t['to_name'] ?? 'Banca',
        'amount'         => (int) $t['amount'],
        'description'    => $t['description'],
        'created_at'     => $t['created_at'],
    ];
}, $stmt->fetchAll());

$pendingSql =
    "SELECT pt.id, pt.from_player_id, pt.to_player_id, pt.amount, pt.description, pt.created_at,
            pf.name AS from_name, pto.name AS to_name
     FROM pending_transfers pt
     JOIN players pf ON pf.id = pt.from_player_id
     JOIN players pto ON pto.id = pt.to_player_id
     WHERE pt.game_id = ? AND pt.status = 'pending'";
$pendingParams = [$gameId];
if ($current !== null) {
    $pendingSql .= ' AND (pt.from_player_id = ? OR pt.to_player_id = ?)';
    $pendingParams[] = (int) $current['id'];
    $pendingParams[] = (int) $current['id'];
}
$pendingSql .= ' ORDER BY pt.id DESC LIMIT 50';
$stmt = $pdo->prepare($pendingSql);
$stmt->execute($pendingParams);
$pending = array_map(static function (array $p): array {
    return [
        'id'             => (int) $p['id'],
        'from_player_id' => (int) $p['from_player_id'],
        'to_player_id'   => (int) $p['to_player_id'],
        'from_name'      => $p['from_name'],
        'to_name'        => $p['to_name'],
        'amount'         => (int) $p['amount'],
        'description'    => $p['description'],
        'created_at'     => $p['created_at'],
    ];
}, $stmt->fetchAll());

jsonResponse([
    'ok'             => true,
    'game'           => $game,
    'current_player' => $current !== null ? [
        'id'      => (int) $current['id'],
        'name'    => $current['name'],
        'balance' => (int) $current['balance'],
    ] : null,
    'players'        => $players,
    'transactions'   => $transactions,
    'pending'        => $pending,
]);
