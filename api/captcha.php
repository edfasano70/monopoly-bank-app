<?php
// Genera un captcha aritmético de un solo uso para confirmar eliminaciones.
declare(strict_types=1);
require __DIR__ . '/conexion.php';

requireMethod('GET');
startSession();

$a = random_int(2, 9);
$b = random_int(2, 9);

if (random_int(0, 1) === 0) {
    $answer = $a + $b;
    $question = $a . ' + ' . $b;
} else {
    if ($a < $b) {
        [$a, $b] = [$b, $a];
    }
    $answer = $a - $b;
    $question = $a . ' - ' . $b;
}

$_SESSION['monopoly_captcha'] = [
    'answer'  => $answer,
    'expires' => time() + 300,
];

jsonResponse(['ok' => true, 'question' => $question]);
