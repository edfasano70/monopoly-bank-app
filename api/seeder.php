<?php
// Aplica sql/schema.sql. Uso por CLI: php api/seeder.php
declare(strict_types=1);
require __DIR__ . '/conexion.php';

if (PHP_SAPI !== 'cli') {
    jsonResponse(['ok' => false, 'error' => 'Solo disponible por CLI'], 403);
}

$sql = file_get_contents(__DIR__ . '/../sql/schema.sql');
if ($sql === false) {
    fwrite(STDERR, "No se encontró sql/schema.sql\n");
    exit(1);
}

$pdo = getPDO();
$pdo->exec($sql);
fwrite(STDOUT, "Esquema aplicado correctamente.\n");
