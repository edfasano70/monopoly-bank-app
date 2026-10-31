<?php
// Aprueba una transferencia pendiente entre jugadores.
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
$stmt = $pdo->prepare('SELECT id, status FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
}
if ($game['status'] !== 'active') {
    jsonResponse(['ok' => false, 'error' => 'La partida ya finalizó'], 409);
}

$gameId = (int) $game['id'];

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'SELECT id, from_player_id, to_player_id, amount, description, status
         FROM pending_transfers
         WHERE id = ? AND game_id = ?
         FOR UPDATE'
    );
    $stmt->execute([(int) $pendingId, $gameId]);
    $pending = $stmt->fetch();

    if (!$pending) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'error' => 'Solicitud no encontrada'], 404);
    }
    if ($pending['status'] !== 'pending') {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'error' => 'La solicitud ya fue resuelta'], 409);
    }

    $fromId = (int) $pending['from_player_id'];
    $toId = (int) $pending['to_player_id'];
    $amount = (int) $pending['amount'];
    $description = $pending['description'];

    $lockIds = [$fromId, $toId];
    sort($lockIds);
    $placeholders = implode(',', array_fill(0, count($lockIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT id FROM players WHERE game_id = ? AND id IN ($placeholders) ORDER BY id FOR UPDATE"
    );
    $stmt->execute(array_merge([$gameId], $lockIds));
    if (count($stmt->fetchAll()) !== count($lockIds)) {
        throw new RuntimeException('Jugadores no encontrados');
    }

    $stmt = $pdo->prepare(
        'UPDATE players SET balance = balance - ? WHERE id = ? AND game_id = ? AND balance >= ?'
    );
    $stmt->execute([$amount, $fromId, $gameId, $amount]);
    if ($stmt->rowCount() !== 1) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'error' => 'Saldo insuficiente'], 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE players SET balance = balance + ? WHERE id = ? AND game_id = ?'
    );
    $stmt->execute([$amount, $toId, $gameId]);
    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('No se pudo acreditar al destinatario');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO transactions (game_id, from_player_id, to_player_id, amount, description)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$gameId, $fromId, $toId, $amount, $description]);
    $transactionId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare(
        "UPDATE pending_transfers
         SET status = 'approved', resolved_at = NOW()
         WHERE id = ? AND status = 'pending'"
    );
    $stmt->execute([(int) $pendingId]);
    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('No se pudo actualizar la solicitud');
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

jsonResponse([
    'ok'          => true,
    'transaction' => [
        'id'          => $transactionId,
        'amount'      => $amount,
        'description' => $description,
    ],
]);
