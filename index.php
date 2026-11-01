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
$v = '1.0.9';
?>
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#020617" />
    <meta name="description" content="Banca web para partidas de Monopoly" />
    <meta name="application-name" content="Monopoly Wallet" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Monopoly Wallet" />
    <title>Monopoly Wallet</title>
    <link rel="manifest" href="<?= $base ?>/manifest.json?v=<?= $v ?>" />
    <link rel="icon" type="image/png" sizes="256x256" href="<?= $base ?>/icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="<?= $base ?>/icon-180.png" />
    <script src="<?= $base ?>/assets/tailwind.js?v=<?= $v ?>"></script>
    <style>
      body { -webkit-tap-highlight-color: transparent; }
      #link-modal-qr svg,
      #invite-modal-qr svg { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="app">
      <div class="flex min-h-screen items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
      </div>
    </div>
    <div id="invite-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Invitación</p>
            <h2 id="invite-modal-title" class="mt-1 text-lg font-bold">Enlace de invitación</h2>
          </div>
          <button id="invite-modal-close" type="button" class="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>
        </div>
        <div id="invite-modal-qr" class="mx-auto mt-4 flex h-60 w-60 items-center justify-center rounded-xl border border-slate-200 bg-white p-3"></div>
        <p id="invite-modal-url" class="mt-4 break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600"></p>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button id="invite-modal-copy" type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copiar enlace</button>
          <button id="invite-modal-ok" type="button" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Listo</button>
        </div>
        <p class="mt-3 text-xs text-slate-500">Comparte este enlace o QR para que más jugadores se unan.</p>
      </div>
    </div>
    <div id="about-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Información</p>
            <h2 id="about-modal-title" class="mt-1 text-lg font-bold">Acerca de...</h2>
          </div>
          <button id="about-modal-close" type="button" class="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>
        </div>
        <img src="<?= $base ?>/icon.png" alt="Monopoly Wallet" class="mx-auto mt-4 h-24 w-24 rounded-2xl shadow-lg" />
        <p class="mt-4 text-center text-lg font-bold">Monopoly Wallet</p>
        <p class="text-center text-xs text-slate-500">Versión <?= $v ?></p>
        <p class="mt-2 text-center text-sm font-medium text-slate-600">un programa de @EdFasano70</p>
        <p class="mt-4 text-xs leading-relaxed text-slate-500">Monopoly es una marca registrada de Hasbro. Esta aplicación es una herramienta no oficial para llevar la banca de una partida y no está afiliada, patrocinada ni respaldada por Hasbro. Todos los derechos de la marca y del juego pertenecen a sus respectivos titulares.</p>
        <button id="about-modal-ok" type="button" class="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Listo</button>
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
      <script src="<?= $base ?>/assets/js/qrcode.js?v=<?= $v ?>"></script>
      <script src="<?= $base ?>/assets/js/player.js?v=<?= $v ?>"></script>
    <?php endif; ?>
    <script>
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('<?= $base ?>/sw.js?v=<?= $v ?>', { scope: '<?= $base ?>/' }).catch(function () {});
        });
      }
    </script>
  </body>
</html>
