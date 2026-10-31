<?php
// Banca web para Monopoly — vista única según parámetros de la URL.
declare(strict_types=1);

header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: no-referrer');

$code  = isset($_GET['code']) ? strtoupper(trim((string) $_GET['code'])) : '';
$join  = isset($_GET['join']) ? strtoupper(trim((string) $_GET['join'])) : '';
$token = isset($_GET['token']) ? trim((string) $_GET['token']) : '';

if ($token !== '') {
    $view = 'player';
} elseif ($code !== '') {
    $view = 'bank';
} elseif ($join !== '') {
    $view = 'join';
} else {
    $view = 'home';
}

$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php')), '/');
if ($base === '.' || $base === '/') {
    $base = '';
}

$config = [
    'view'  => $view,
    'code'  => $code,
    'join'  => $join,
    'token' => $token,
    'base'  => $base,
];
$jsonFlags = JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_INVALID_UTF8_SUBSTITUTE;
$v = '1.0.6';
?>
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#020617" />
    <meta name="description" content="Banca web para partidas de Monopoly" />
    <title>Monopoly Bank</title>
    <script src="<?= $base ?>/assets/tailwind.js"></script>
    <style>
      body { -webkit-tap-highlight-color: transparent; }
      #qr-box svg,
      #link-modal-qr svg { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="app">
      <div class="flex min-h-screen items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
      </div>
    </div>
    <script>
      window.MONOPOLY = <?= json_encode($config, $jsonFlags) ?>;
    </script>
    <script src="<?= $base ?>/assets/js/common.js?v=<?= $v ?>"></script>
    <?php if ($view === 'bank'): ?>
      <script src="<?= $base ?>/assets/js/reasons.js?v=<?= $v ?>"></script>
      <script src="<?= $base ?>/assets/js/qrcode.js?v=<?= $v ?>"></script>
      <script src="<?= $base ?>/assets/js/bank.js?v=<?= $v ?>"></script>
    <?php elseif ($view === 'player'): ?>
      <script src="<?= $base ?>/assets/js/reasons.js?v=<?= $v ?>"></script>
      <script src="<?= $base ?>/assets/js/player.js?v=<?= $v ?>"></script>
    <?php endif; ?>
  </body>
</html>
