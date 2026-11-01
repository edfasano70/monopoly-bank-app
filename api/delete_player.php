<?php
// Elimina un jugador de la partida junto con sus movimientos y solicitudes.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('POST');
startSession();

$body = readJsonBody();
$code = normalizeCode((string) ($body['game_code'] ?? ''));
$playerId = filter_var(
    $body['player_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
$captchaAnswer = filter_var($body['captcha_answer'] ?? null, FILTER_VALIDATE_INT);
$captcha = $_SESSION['monopoly_captcha'] ?? null;
unset($_SESSION['monopoly_captcha']);

if (!isValidCode($code)) {
    jsonResponse(['ok' => false, 'error' => 'Código de partida inválido'], 400);
}
if ($playerId === false) {
    jsonResponse(['ok' => false, 'error' => 'Jugador inválido'], 400);
}
if ($captchaAnswer === false) {
    jsonResponse(['ok' => false, 'error' => 'Captcha inválido'], 400);
}
if (!$captcha || (int) $captcha['expires'] < time()) {
    jsonResponse(['ok' => false, 'error' => 'El captcha venció. Genera uno nuevo.'], 400);
}
if ((int) $captcha['answer'] !== (int) $captchaAnswer) {
    jsonResponse(['ok' => false, 'error' => 'Captcha incorrecto. Intenta de nuevo.'], 400);
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT id FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    jsonResponse(['ok' => false, 'error' => 'Partida no encontrada'], 404);
}

$gameId = (int) $game['id'];

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT id, name FROM players WHERE id = ? AND game_id = ? FOR UPDATE');
    $stmt->execute([(int) $playerId, $gameId]);
    $player = $stmt->fetch();

    if (!$player) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'error' => 'Jugador no encontrado'], 404);
    }

    $stmt = $pdo->prepare(
        'DELETE FROM pending_transfers WHERE game_id = ? AND (from_player_id = ? OR to_player_id = ?)'
    );
    $stmt->execute([$gameId, (int) $playerId, (int) $playerId]);

    $stmt = $pdo->prepare(
        'DELETE FROM transactions WHERE game_id = ? AND (from_player_id = ? OR to_player_id = ?)'
    );
    $stmt->execute([$gameId, (int) $playerId, (int) $playerId]);

    $stmt = $pdo->prepare('DELETE FROM players WHERE id = ? AND game_id = ?');
    $stmt->execute([(int) $playerId, $gameId]);
    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('No se pudo eliminar el jugador');
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

jsonResponse([
    'ok'     => true,
    'player' => [
        'id'   => (int) $player['id'],
        'name' => $player['name'],
    ],
]);
