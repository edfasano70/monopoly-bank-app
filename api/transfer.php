<?php
// Ejecuta una transferencia atómica entre jugadores y/o la Banca.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');

function fetchPlayerByToken(PDO $pdo, string $token, int $gameId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, name, balance FROM players WHERE token = ? AND game_id = ?'
    );
    $stmt->execute([$token, $gameId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function fetchPlayerById(PDO $pdo, int $playerId, int $gameId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, name, balance FROM players WHERE id = ? AND game_id = ?'
    );
    $stmt->execute([$playerId, $gameId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function positiveIdOrNull(mixed $value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        jsonResponse(['ok' => false, 'error' => 'ID de jugador inválido'], 400);
    }
    return (int) $id;
}

$body = readJsonBody();
$code = normalizeCode((string) ($body['game_code'] ?? ''));
$fromToken = trim((string) ($body['from_token'] ?? ''));
$toToken = trim((string) ($body['to_token'] ?? ''));
$fromPlayerId = positiveIdOrNull($body['from_player_id'] ?? null);
$toPlayerId = positiveIdOrNull($body['to_player_id'] ?? null);
$amount = filter_var(
    $body['amount'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1, 'max_range' => 1000000000]]
);
$description = trim((string) ($body['description'] ?? ''));

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
}
if ($amount === false) {
    jsonResponse(['ok' => false, 'error' => 'Importe inválido: debe ser un entero mayor a cero'], 400);
}
if (mb_strlen($description, 'UTF-8') > 255) {
    jsonResponse(['ok' => false, 'error' => 'La descripción supera los 255 caracteres'], 400);
}
if ($fromToken === '') {
    jsonResponse(['ok' => false, 'error' => 'Falta el emisor'], 400);
}

$fromIsBank = strtoupper($fromToken) === 'BANK';
$toIsBank = strtoupper($toToken) === 'BANK';

if ($fromIsBank && $fromPlayerId === null && $toIsBank) {
    jsonResponse(['ok' => false, 'error' => 'La Banca no puede transferirse a sí misma'], 400);
}
if (!$fromIsBank && $fromPlayerId !== null) {
    jsonResponse(['ok' => false, 'error' => 'from_player_id solo se usa cuando el emisor es la Banca'], 400);
}
if (!$fromIsBank && preg_match('/^[a-f0-9]{32}$/', $fromToken) !== 1) {
    jsonResponse(['ok' => false, 'error' => 'Token de emisor inválido'], 400);
}
if ($toIsBank && $toPlayerId !== null) {
    jsonResponse(['ok' => false, 'error' => 'Destinatario ambiguo'], 400);
}
if (!$toIsBank && $toToken !== '' && $toPlayerId !== null) {
    jsonResponse(['ok' => false, 'error' => 'Destinatario ambiguo'], 400);
}
if (!$toIsBank && $toToken === '' && $toPlayerId === null) {
    jsonResponse(['ok' => false, 'error' => 'Falta el destinatario'], 400);
}
if (!$toIsBank && $toToken !== '' && preg_match('/^[a-f0-9]{32}$/', $toToken) !== 1) {
    jsonResponse(['ok' => false, 'error' => 'Token de destinatario inválido'], 400);
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

if (!$fromIsBank) {
    $sender = fetchPlayerByToken($pdo, $fromToken, $gameId);
    if (!$sender) {
        jsonResponse(['ok' => false, 'error' => 'El emisor no pertenece a esta partida'], 404);
    }
} elseif ($fromPlayerId !== null) {
    $sender = fetchPlayerById($pdo, $fromPlayerId, $gameId);
    if (!$sender) {
        jsonResponse(['ok' => false, 'error' => 'El jugador a cobrar no pertenece a esta partida'], 404);
    }
} else {
    $sender = null;
}

if ($toIsBank) {
    $receiver = null;
} elseif ($toPlayerId !== null) {
    $receiver = fetchPlayerById($pdo, $toPlayerId, $gameId);
    if (!$receiver) {
        jsonResponse(['ok' => false, 'error' => 'El destinatario no pertenece a esta partida'], 404);
    }
} else {
    $receiver = fetchPlayerByToken($pdo, $toToken, $gameId);
    if (!$receiver) {
        jsonResponse(['ok' => false, 'error' => 'El destinatario no pertenece a esta partida'], 404);
    }
}

if ($sender !== null && $receiver !== null && (int) $sender['id'] === (int) $receiver['id']) {
    jsonResponse(['ok' => false, 'error' => 'El emisor y el destinatario son el mismo jugador'], 400);
}

if (!$fromIsBank && $receiver !== null) {
    if ((int) $sender['balance'] < $amount) {
        jsonResponse(['ok' => false, 'error' => 'Saldo insuficiente'], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO pending_transfers (game_id, from_player_id, to_player_id, amount, description)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $gameId,
        (int) $sender['id'],
        (int) $receiver['id'],
        $amount,
        $description,
    ]);

    jsonResponse([
        'ok'      => true,
        'pending' => [
            'id'          => (int) $pdo->lastInsertId(),
            'amount'      => (int) $amount,
            'description' => $description,
            'from'        => ['id' => (int) $sender['id'], 'name' => $sender['name']],
            'to'          => ['id' => (int) $receiver['id'], 'name' => $receiver['name']],
        ],
        'message' => 'Solicitud enviada. Queda pendiente de aprobación de la Banca.',
    ], 202);
}

$pdo->beginTransaction();
try {
    $lockIds = [];
    if ($sender !== null) {
        $lockIds[] = (int) $sender['id'];
    }
    if ($receiver !== null) {
        $lockIds[] = (int) $receiver['id'];
    }
    $lockIds = array_values(array_unique($lockIds));
    sort($lockIds);

    if ($lockIds !== []) {
        $placeholders = implode(',', array_fill(0, count($lockIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT id FROM players WHERE game_id = ? AND id IN ($placeholders) ORDER BY id FOR UPDATE"
        );
        $stmt->execute(array_merge([$gameId], $lockIds));
        if (count($stmt->fetchAll()) !== count($lockIds)) {
            throw new RuntimeException('No se pudieron bloquear los jugadores');
        }
    }

    if ($sender !== null) {
        $stmt = $pdo->prepare(
            'UPDATE players SET balance = balance - ? WHERE id = ? AND game_id = ? AND balance >= ?'
        );
        $stmt->execute([$amount, (int) $sender['id'], $gameId, $amount]);
        if ($stmt->rowCount() !== 1) {
            $pdo->rollBack();
            jsonResponse(['ok' => false, 'error' => 'Saldo insuficiente'], 409);
        }
    }

    if ($receiver !== null) {
        $stmt = $pdo->prepare(
            'UPDATE players SET balance = balance + ? WHERE id = ? AND game_id = ?'
        );
        $stmt->execute([$amount, (int) $receiver['id'], $gameId]);
        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('No se pudo acreditar al destinatario');
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO transactions (game_id, from_player_id, to_player_id, amount, description)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $gameId,
        $sender !== null ? (int) $sender['id'] : null,
        $receiver !== null ? (int) $receiver['id'] : null,
        $amount,
        $description,
    ]);
    $transactionId = (int) $pdo->lastInsertId();

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

$senderAfter = $sender !== null ? fetchPlayerById($pdo, (int) $sender['id'], $gameId) : null;
$receiverAfter = $receiver !== null ? fetchPlayerById($pdo, (int) $receiver['id'], $gameId) : null;

jsonResponse([
    'ok'          => true,
    'transaction' => [
        'id'          => $transactionId,
        'amount'      => (int) $amount,
        'description' => $description,
    ],
    'sender'   => $senderAfter,
    'receiver' => $receiverAfter,
]);
