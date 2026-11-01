(function () {
  'use strict';

  const M = window.Monopoly;

  function boot() {
    const config = window.MONOPOLY || {};
    const code = (config.code || '').toUpperCase();
    const app = document.getElementById('app');
    const R = window.MonopolyReasons;

    if (!code) {
      app.innerHTML =
        '<main class="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">' +
        '<div class="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<h1 class="text-xl font-bold">Partida no indicada</h1>' +
        '<p class="mt-2 text-sm text-slate-600">El enlace no incluye un código de tablero.</p>' +
        '<a href="' + M.base + '/" class="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Volver al inicio</a>' +
        '</div></main>';
      return;
    }

    if (!R) {
      app.innerHTML =
        '<main class="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">' +
        '<div class="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<h1 class="text-xl font-bold">No se pudo cargar la aplicación</h1>' +
        '<p class="mt-2 text-sm text-slate-600">No se pudo cargar el catálogo de motivos. Recarga la página.</p>' +
        '</div></main>';
      return;
    }

    app.innerHTML =
      '<main class="min-h-screen bg-slate-950 text-slate-100">' +
      '<div class="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">' +
        '<header class="flex flex-wrap items-start justify-between gap-3">' +
          '<div>' +
            '<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Banca Monopoly</p>' +
            '<h1 class="mt-2 text-2xl font-black tracking-tight">Partida <span id="game-code" class="font-mono text-emerald-300">' + M.esc(code) + '</span></h1>' +
            '<p id="game-status" class="mt-1 text-xs text-slate-400">Cargando estado...</p>' +
          '</div>' +
          '<div class="relative">' +
            '<button id="menu-button" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-panel" class="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-900">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>' +
            '</button>' +
            '<div id="menu-panel" class="absolute right-0 z-40 mt-2 hidden w-60 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">' +
              '<a href="' + M.base + '/" class="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">Ir a inicio</a>' +
              '<button id="menu-invite" type="button" class="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800">Mostrar enlace de invitación</button>' +
              '<button id="menu-about" type="button" class="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800">Acerca de...</button>' +
            '</div>' +
          '</div>' +
        '</header>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<div class="mb-3 flex items-center justify-between gap-3">' +
            '<h2 class="font-semibold">Transacciones pendientes</h2>' +
            '<span id="pending-count" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">0</span>' +
          '</div>' +
          '<div id="pending-list" class="space-y-2 text-sm"><p class="text-slate-500">Sin solicitudes pendientes.</p></div>' +
          '<p class="mt-3 text-xs text-slate-500">Las transferencias entre jugadores quedan pendientes hasta que la Banca las apruebe.</p>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Jugadores</h2>' +
          '<div class="overflow-x-auto">' +
            '<table class="w-full text-sm">' +
              '<thead><tr class="text-left text-xs uppercase tracking-wide text-slate-500">' +
                '<th class="py-2">Jugador</th><th class="py-2 text-right">Saldo</th><th class="py-2 text-right">Acciones</th>' +
              '</tr></thead>' +
              '<tbody id="players-body">' +
                '<tr><td colspan="3" class="py-3 text-slate-500">Cargando...</td></tr>' +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<p class="mt-3 text-xs text-slate-500">Si un jugador perdió su enlace, genera uno nuevo y envíaselo. El anterior deja de funcionar.</p>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Movimiento de la banca</h2>' +
          '<form id="transfer-form" class="space-y-3" autocomplete="off" novalidate>' +
            '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">' +
              '<label class="block text-sm font-medium">Motivo' +
                '<select name="reason" required class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                  '<option value="">Selecciona un motivo</option>' +
                '</select>' +
              '</label>' +
              '<label class="block text-sm font-medium">Movimiento' +
                '<select name="tipo" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                  '<option value="pay">La Banca paga</option>' +
                  '<option value="collect">La Banca cobra</option>' +
                  '<option value="between">Entre jugadores</option>' +
                '</select>' +
              '</label>' +
            '</div>' +
            '<div id="bank-single-player">' +
              '<label class="block text-sm font-medium"><span id="single-player-label">Jugador</span>' +
                '<select name="player_id" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                  '<option value="">Cargando...</option>' +
                '</select>' +
              '</label>' +
            '</div>' +
            '<div id="bank-between-players" class="hidden grid grid-cols-1 gap-3 sm:grid-cols-2">' +
              '<label class="block text-sm font-medium">Paga' +
                '<select name="from_player_id" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                  '<option value="">Cargando...</option>' +
                '</select>' +
              '</label>' +
              '<label class="block text-sm font-medium">Cobra' +
                '<select name="to_player_id" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                  '<option value="">Cargando...</option>' +
                '</select>' +
              '</label>' +
            '</div>' +
            '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">' +
              '<label class="block text-sm font-medium">Importe' +
                '<input name="amount" type="number" min="1" max="1000000000" step="1" required inputmode="numeric" placeholder="200" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
              '</label>' +
              '<label class="block text-sm font-medium">Detalle (opcional)' +
                '<input name="detail" maxlength="200" placeholder="Propiedad, jugador, etc." class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
              '</label>' +
            '</div>' +
            '<p id="reason-hint" class="hidden text-xs text-slate-500"></p>' +
            '<button type="submit" class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">Registrar movimiento</button>' +
          '</form>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Últimos movimientos</h2>' +
          '<div id="history" class="space-y-2 text-sm text-slate-700"><p class="text-slate-500">Sin movimientos.</p></div>' +
        '</section>' +
      '</div></main>' +
      '<div id="link-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4">' +
        '<div class="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="link-modal-title">' +
          '<div class="flex items-start justify-between gap-3">' +
            '<div>' +
              '<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Acceso del jugador</p>' +
              '<h2 id="link-modal-title" class="mt-1 text-lg font-bold">Enlace nuevo</h2>' +
            '</div>' +
            '<button id="link-modal-close" type="button" class="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>' +
          '</div>' +
          '<div id="link-modal-qr" class="mx-auto mt-4 flex h-60 w-60 items-center justify-center rounded-xl border border-slate-200 bg-white p-3"></div>' +
          '<p id="link-modal-url" class="mt-4 break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600"></p>' +
          '<div class="mt-4 grid grid-cols-2 gap-3">' +
            '<button id="link-modal-copy" type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copiar enlace</button>' +
            '<button id="link-modal-ok" type="button" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Listo</button>' +
          '</div>' +
          '<p class="mt-3 text-xs text-slate-500">Muéstrale este QR al jugador o comparte el enlace. El enlace anterior ya no funciona.</p>' +
        '</div>' +
      '</div>' +
      '<div id="delete-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4">' +
        '<div class="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">' +
          '<div class="flex items-start justify-between gap-3">' +
            '<div>' +
              '<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Eliminar jugador</p>' +
              '<h2 id="delete-modal-title" class="mt-1 text-lg font-bold">Confirmar eliminación</h2>' +
            '</div>' +
            '<button id="delete-modal-close" type="button" class="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>' +
          '</div>' +
          '<p id="delete-modal-text" class="mt-4 text-sm leading-relaxed text-slate-600"></p>' +
          '<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">' +
            '<p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Captcha de confirmación</p>' +
            '<p id="delete-captcha-question" class="mt-1 font-mono text-base text-slate-800">Cargando...</p>' +
            '<input id="delete-captcha-answer" type="number" inputmode="numeric" autocomplete="off" placeholder="Tu respuesta" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
          '</div>' +
          '<p id="delete-modal-error" class="mt-2 hidden text-xs text-red-600"></p>' +
          '<div class="mt-4 grid grid-cols-2 gap-3">' +
            '<button id="delete-modal-cancel" type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>' +
            '<button id="delete-modal-confirm" type="button" class="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">Eliminar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const form = document.getElementById('transfer-form');
    const reasonSelect = form.querySelector('[name="reason"]');
    const typeSelect = form.querySelector('[name="tipo"]');
    const playerSelect = form.querySelector('[name="player_id"]');
    const fromSelect = form.querySelector('[name="from_player_id"]');
    const toSelect = form.querySelector('[name="to_player_id"]');
    const amountInput = form.querySelector('[name="amount"]');
    const detailInput = form.querySelector('[name="detail"]');
    const submit = form.querySelector('button[type="submit"]');
    const singleWrap = document.getElementById('bank-single-player');
    const betweenWrap = document.getElementById('bank-between-players');
    const singleLabel = document.getElementById('single-player-label');
    const reasonHint = document.getElementById('reason-hint');
    const playersBody = document.getElementById('players-body');
    const historyBox = document.getElementById('history');
    const statusLine = document.getElementById('game-status');
    const pendingList = document.getElementById('pending-list');
    const pendingCount = document.getElementById('pending-count');
    const modal = document.getElementById('link-modal');
    const modalTitle = document.getElementById('link-modal-title');
    const modalQr = document.getElementById('link-modal-qr');
    const modalUrl = document.getElementById('link-modal-url');
    const modalCopy = document.getElementById('link-modal-copy');
    const modalClose = document.getElementById('link-modal-close');
    const modalOk = document.getElementById('link-modal-ok');
    const menuButton = document.getElementById('menu-button');
    const menuPanel = document.getElementById('menu-panel');
    const menuInvite = document.getElementById('menu-invite');
    const menuAbout = document.getElementById('menu-about');
    const deleteModal = document.getElementById('delete-modal');
    const deleteText = document.getElementById('delete-modal-text');
    const deleteQuestion = document.getElementById('delete-captcha-question');
    const deleteAnswer = document.getElementById('delete-captcha-answer');
    const deleteError = document.getElementById('delete-modal-error');
    const deleteConfirm = document.getElementById('delete-modal-confirm');
    const deleteCancel = document.getElementById('delete-modal-cancel');
    const deleteClose = document.getElementById('delete-modal-close');

    let players = [];
    let pending = [];
    let state = null;
    let busy = false;
    let modalLink = '';
    let deletePlayerId = 0;
    let deleteBusy = false;
    let deleteCaptchaReady = false;

    function openLinkModal(link, playerName) {
      modalLink = link;
      modalTitle.textContent = 'Acceso de ' + playerName;
      const svg = M.qrSvg(
        link,
        'Código QR de acceso de ' + playerName,
        'Acceso a la partida'
      );
      modalQr.innerHTML = svg || '<p class="p-2 text-center text-xs text-slate-500">No se pudo generar el QR</p>';
      modalUrl.textContent = link;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      modalClose.focus();
    }

    function closeLinkModal() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      modalQr.innerHTML = '';
      modalUrl.textContent = '';
      modalTitle.textContent = 'Enlace nuevo';
      modalLink = '';
    }

    modalClose.addEventListener('click', closeLinkModal);
    modalOk.addEventListener('click', closeLinkModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        closeLinkModal();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeLinkModal();
      }
    });
    modalCopy.addEventListener('click', function () {
      if (modalLink) {
        M.copy(modalLink);
      }
    });

    function closeMenu() {
      menuPanel.classList.add('hidden');
      menuButton.setAttribute('aria-expanded', 'false');
    }

    menuButton.addEventListener('click', function () {
      const hidden = menuPanel.classList.toggle('hidden');
      menuButton.setAttribute('aria-expanded', String(!hidden));
    });
    document.addEventListener('click', function (event) {
      if (
        !menuPanel.classList.contains('hidden') &&
        !menuPanel.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
    menuInvite.addEventListener('click', function () {
      closeMenu();
      M.openInviteModal(code);
    });
    menuAbout.addEventListener('click', function () {
      closeMenu();
      M.openAboutModal();
    });

    function showDeleteError(message) {
      deleteError.textContent = message;
      deleteError.classList.remove('hidden');
    }

    async function loadDeleteCaptcha() {
      deleteCaptchaReady = false;
      deleteConfirm.disabled = true;
      deleteQuestion.textContent = 'Cargando...';
      deleteError.classList.add('hidden');
      deleteError.textContent = '';

      try {
        const data = await M.api('captcha.php');
        if (!data || !data.question) {
          throw new Error('No se pudo cargar el captcha');
        }
        deleteQuestion.textContent = '¿Cuánto es ' + data.question + '?';
        deleteCaptchaReady = true;
        deleteConfirm.disabled = deleteBusy;
        deleteAnswer.focus();
      } catch (err) {
        deleteQuestion.textContent = 'No se pudo cargar el captcha';
        showDeleteError(err.message);
      }
    }

    function openDeleteModal(playerId, playerName) {
      deletePlayerId = playerId;
      deleteText.textContent =
        'Se eliminará a ' + playerName + ' y todos sus movimientos. Esta acción no se puede deshacer.';
      deleteAnswer.value = '';
      deleteBusy = false;
      deleteConfirm.textContent = 'Eliminar';
      deleteConfirm.disabled = true;
      deleteError.classList.add('hidden');
      deleteError.textContent = '';
      deleteModal.classList.remove('hidden');
      deleteModal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      deleteClose.focus();
      loadDeleteCaptcha();
    }

    function closeDeleteModal() {
      deleteModal.classList.add('hidden');
      deleteModal.classList.remove('flex');
      document.body.style.overflow = '';
      deletePlayerId = 0;
      deleteBusy = false;
      deleteCaptchaReady = false;
      deleteQuestion.textContent = 'Cargando...';
      deleteAnswer.value = '';
      deleteError.classList.add('hidden');
      deleteError.textContent = '';
      deleteConfirm.textContent = 'Eliminar';
      deleteConfirm.disabled = true;
    }

    deleteClose.addEventListener('click', closeDeleteModal);
    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', function (event) {
      if (event.target === deleteModal) {
        closeDeleteModal();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
      }
    });
    deleteAnswer.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        deleteConfirm.click();
      }
    });

    deleteConfirm.addEventListener('click', async function () {
      if (deleteBusy || !deleteCaptchaReady || !deletePlayerId) {
        return;
      }
      const answer = parseInt(deleteAnswer.value, 10);
      if (isNaN(answer)) {
        showDeleteError('Ingresa la respuesta del captcha');
        deleteAnswer.focus();
        return;
      }

      deleteBusy = true;
      deleteConfirm.disabled = true;
      deleteConfirm.textContent = 'Eliminando...';

      try {
        await M.api('delete_player.php', {
          method: 'POST',
          body: {
            game_code: code,
            player_id: deletePlayerId,
            captcha_answer: answer,
          },
        });
        closeDeleteModal();
        M.toast('Jugador eliminado');
        await refresh();
      } catch (err) {
        showDeleteError(err.message);
        deleteAnswer.value = '';
        await loadDeleteCaptcha();
      } finally {
        deleteBusy = false;
        deleteConfirm.textContent = 'Eliminar';
        deleteConfirm.disabled = !deleteCaptchaReady;
      }
    });

    function fillReasons() {
      const flows = ['bank-to-player', 'player-to-bank', 'player-to-player'];
      reasonSelect.innerHTML =
        '<option value="">Selecciona un motivo</option>' +
        flows
          .map(function (flow) {
            const options = R.group(flow)
              .map(function (r) {
                return '<option value="' + r.id + '">' + M.esc(r.label) + '</option>';
              })
              .join('');
            return '<optgroup label="' + M.esc(R.groupLabel(flow)) + '">' + options + '</optgroup>';
          })
          .join('');
    }

    function fillPlayerSelect(select, fallbackIndex) {
      const previous = select.value;
      if (players.length === 0) {
        select.innerHTML = '<option value="">Sin jugadores</option>';
        select.value = '';
        return;
      }
      select.innerHTML = players
        .map(function (p) {
          return (
            '<option value="' + p.id + '">' + M.esc(p.name) + ' · ' + M.money(p.balance) + '</option>'
          );
        })
        .join('');
      const stillThere = players.some(function (p) {
        return String(p.id) === previous;
      });
      if (stillThere) {
        select.value = previous;
      } else {
        const index = Math.min(fallbackIndex, players.length - 1);
        select.value = String(players[index].id);
      }
    }

    function renderPlayerOptions() {
      fillPlayerSelect(playerSelect, 0);
      fillPlayerSelect(fromSelect, 0);
      fillPlayerSelect(toSelect, 1);
    }

    function currentReason() {
      return R.get(reasonSelect.value);
    }

    function updateActionFields() {
      const between = typeSelect.value === 'between';
      betweenWrap.classList.toggle('hidden', !between);
      singleWrap.classList.toggle('hidden', between);
      singleLabel.textContent = typeSelect.value === 'collect' ? 'Jugador que paga' : 'Jugador que cobra';
    }

    function updateHint() {
      const reason = currentReason();
      const between = typeSelect.value === 'between';
      let text = '';
      if (!reason) {
        text = '';
      } else if (between && players.length < 2) {
        text = 'Necesitas al menos dos jugadores para un movimiento entre jugadores.';
      } else if (between && fromSelect.value === toSelect.value) {
        text = 'Elige dos jugadores distintos.';
      } else if (between) {
        text = 'Selecciona quién paga y quién cobra.';
      }
      reasonHint.textContent = text;
      reasonHint.classList.toggle('hidden', !text);
    }

    function syncFormState() {
      const active = state !== null && state.game.status === 'active';
      const reason = currentReason();
      const between = typeSelect.value === 'between';
      let selectionReady;
      if (between) {
        selectionReady =
          players.length >= 2 &&
          fromSelect.value !== '' &&
          toSelect.value !== '' &&
          fromSelect.value !== toSelect.value;
      } else {
        selectionReady = playerSelect.value !== '';
      }
      submit.disabled = busy || !active || !reason || !selectionReady;
      submit.textContent = busy ? 'Registrando...' : 'Registrar movimiento';
      updateHint();
    }

    function applyReason() {
      const reason = currentReason();
      if (!reason) {
        typeSelect.disabled = false;
        if (amountInput.readOnly) {
          amountInput.value = '';
        }
        amountInput.readOnly = false;
        updateActionFields();
        syncFormState();
        return;
      }
      const action = R.bankAction(reason);
      if (action) {
        typeSelect.value = action;
        typeSelect.disabled = true;
      } else {
        typeSelect.disabled = false;
      }
      if (reason.amount != null) {
        amountInput.value = reason.amount;
        amountInput.readOnly = true;
      } else {
        if (amountInput.readOnly) {
          amountInput.value = '';
        }
        amountInput.readOnly = false;
      }
      updateActionFields();
      syncFormState();
    }

    function renderPending() {
      pendingCount.textContent = String(pending.length);
      if (pending.length === 0) {
        pendingList.innerHTML = '<p class="text-slate-500">Sin solicitudes pendientes.</p>';
        return;
      }
      pendingList.innerHTML = pending
        .map(function (p) {
          return (
            '<div class="rounded-xl border border-amber-200 bg-amber-50 p-3">' +
            '<div class="flex items-start justify-between gap-3">' +
            '<div class="min-w-0">' +
            '<p class="truncate font-semibold">' + M.esc(p.from_name) + ' → ' + M.esc(p.to_name) + '</p>' +
            '<p class="truncate text-xs text-slate-600">' + M.esc(p.description || 'Sin detalle') + ' · ' + M.fmtDate(p.created_at) + '</p>' +
            '</div>' +
            '<p class="shrink-0 font-mono font-semibold">' + M.money(p.amount) + '</p>' +
            '</div>' +
            '<div class="mt-3 flex gap-2">' +
            '<button type="button" data-pending-action="approve" data-pending-id="' + p.id + '" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Aprobar</button>' +
            '<button type="button" data-pending-action="reject" data-pending-id="' + p.id + '" class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Rechazar</button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');
    }

    function renderPlayers() {
      if (players.length === 0) {
        playersBody.innerHTML = '<tr><td colspan="3" class="py-3 text-slate-500">Todavía no se unió ningún jugador.</td></tr>';
        return;
      }
      playersBody.innerHTML = players
        .map(function (p) {
          return (
            '<tr class="border-t border-slate-100">' +
            '<td class="py-2 pr-3 font-medium">' + M.esc(p.name) + '</td>' +
            '<td class="py-2 text-right font-mono font-semibold">' + M.money(p.balance) + '</td>' +
            '<td class="py-2 pl-3 text-right">' +
              '<div class="flex justify-end gap-2">' +
                '<button type="button" data-regen-id="' + p.id + '" data-player-name="' + M.esc(p.name) + '" class="whitespace-nowrap rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Nuevo enlace</button>' +
                '<button type="button" data-delete-id="' + p.id + '" data-player-name="' + M.esc(p.name) + '" class="whitespace-nowrap rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>' +
              '</div>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function renderHistory() {
      if (!state || state.transactions.length === 0) {
        historyBox.innerHTML = '<p class="text-slate-500">Sin movimientos.</p>';
        return;
      }
      historyBox.innerHTML = state.transactions
        .map(function (t) {
          return (
            '<div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">' +
            '<div class="min-w-0">' +
            '<p class="truncate font-medium">' + M.esc(t.from_name) + ' → ' + M.esc(t.to_name) + '</p>' +
            '<p class="truncate text-xs text-slate-500">' + M.esc(t.description || 'Sin descripción') + ' · ' + M.fmtDate(t.created_at) + '</p>' +
            '</div>' +
            '<p class="shrink-0 font-mono font-semibold">' + M.money(t.amount) + '</p>' +
            '</div>'
          );
        })
        .join('');
    }

    async function refresh() {
      try {
        state = await M.api('status.php?code=' + encodeURIComponent(code));
      } catch (err) {
        statusLine.textContent = err.message;
        throw err;
      }
      players = state.players;
      pending = state.pending || [];
      document.getElementById('game-code').textContent = state.game.code;
      statusLine.textContent =
        state.game.status === 'active'
          ? players.length + ' jugador' + (players.length === 1 ? '' : 'es') + ' · actualización automática cada 3 s'
          : 'Partida finalizada';
      renderPending();
      renderPlayers();
      renderPlayerOptions();
      updateActionFields();
      renderHistory();
      syncFormState();
    }

    reasonSelect.addEventListener('change', applyReason);
    typeSelect.addEventListener('change', function () {
      updateActionFields();
      syncFormState();
    });
    playerSelect.addEventListener('change', syncFormState);
    fromSelect.addEventListener('change', syncFormState);
    toSelect.addEventListener('change', syncFormState);

    pendingList.addEventListener('click', async function (event) {
      const button = event.target.closest('button[data-pending-action]');
      if (!button || button.disabled) {
        return;
      }
      const pendingId = parseInt(button.getAttribute('data-pending-id'), 10);
      const action = button.getAttribute('data-pending-action');
      if (!pendingId || (action !== 'approve' && action !== 'reject')) {
        return;
      }
      if (action === 'reject' && !window.confirm('¿Rechazar esta solicitud?')) {
        return;
      }
      button.disabled = true;
      try {
        await M.api(action === 'approve' ? 'approve.php' : 'reject.php', {
          method: 'POST',
          body: { game_code: code, pending_id: pendingId },
        });
        M.toast(action === 'approve' ? 'Transferencia aprobada' : 'Solicitud rechazada');
        await refresh();
      } catch (err) {
        M.toast(err.message, 'error');
      } finally {
        button.disabled = false;
      }
    });

    playersBody.addEventListener('click', async function (event) {
      const button = event.target.closest('button[data-regen-id]');
      if (!button || button.disabled) {
        return;
      }
      const playerId = parseInt(button.getAttribute('data-regen-id'), 10);
      const playerName = button.getAttribute('data-player-name') || 'este jugador';
      if (!playerId) {
        return;
      }
      if (!window.confirm('Se invalidará el enlace anterior de ' + playerName + '. ¿Generar uno nuevo?')) {
        return;
      }
      button.disabled = true;
      try {
        const data = await M.api('regenerate.php', {
          method: 'POST',
          body: { game_code: code, player_id: playerId },
        });
        const link = location.origin + M.base + '/?token=' + data.token;
        openLinkModal(link, playerName);
      } catch (err) {
        M.toast(err.message, 'error');
      } finally {
        button.disabled = false;
      }
    });

    playersBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-delete-id]');
      if (!button) {
        return;
      }
      const playerId = parseInt(button.getAttribute('data-delete-id'), 10);
      const playerName = button.getAttribute('data-player-name') || 'este jugador';
      if (!playerId) {
        return;
      }
      openDeleteModal(playerId, playerName);
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) {
        return;
      }
      const reason = currentReason();
      if (!reason) {
        M.toast('Elige un motivo', 'error');
        return;
      }
      const action = typeSelect.value;
      const amount = parseInt(amountInput.value, 10);
      if (isNaN(amount) || amount < 1) {
        M.toast('Ingresa un importe mayor a cero', 'error');
        amountInput.focus();
        return;
      }

      const payload = {
        game_code: code,
        amount: amount,
        description: R.buildDescription(reason, detailInput.value),
      };

      if (action === 'between') {
        const fromId = parseInt(fromSelect.value, 10);
        const toId = parseInt(toSelect.value, 10);
        if (!fromId || !toId) {
          M.toast('Elige quién paga y quién cobra', 'error');
          return;
        }
        if (fromId === toId) {
          M.toast('Elige dos jugadores distintos', 'error');
          return;
        }
        payload.from_token = 'BANK';
        payload.from_player_id = fromId;
        payload.to_player_id = toId;
      } else {
        const playerId = parseInt(playerSelect.value, 10);
        if (!playerId) {
          M.toast('Elige un jugador', 'error');
          return;
        }
        payload.from_token = 'BANK';
        if (action === 'pay') {
          payload.to_player_id = playerId;
        } else {
          payload.from_player_id = playerId;
          payload.to_token = 'BANK';
        }
      }

      busy = true;
      syncFormState();
      try {
        await M.api('transfer.php', { method: 'POST', body: payload });
        detailInput.value = '';
        if (reason.amount == null) {
          amountInput.value = '';
        }
        M.toast('Movimiento registrado');
        await refresh();
      } catch (err) {
        M.toast(err.message, 'error');
      } finally {
        busy = false;
        syncFormState();
      }
    });

    fillReasons();
    updateActionFields();
    syncFormState();
    M.startPolling(refresh, 3000);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
