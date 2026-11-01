(function () {
  'use strict';

  const M = window.Monopoly;

  function boot() {
    const config = window.MONOPOLY || {};
    const token = config.token || '';
    const app = document.getElementById('app');
    const R = window.MonopolyReasons;

    if (!token) {
      app.innerHTML =
        '<main class="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">' +
        '<div class="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<h1 class="text-xl font-bold">Enlace inválido</h1>' +
        '<p class="mt-2 text-sm text-slate-600">El enlace no incluye un token de jugador.</p>' +
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
      '<div class="mx-auto w-full max-w-md space-y-5 px-4 py-8">' +
        '<header class="flex items-start justify-between gap-3">' +
          '<div>' +
            '<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Mi Wallet Monopoly</p>' +
            '<h1 class="mt-2 text-2xl font-black tracking-tight" id="player-name">Cargando...</h1>' +
            '<p id="game-status" class="mt-1 text-xs text-slate-400">Partida <span id="game-code" class="font-mono text-emerald-300">' + M.esc((config.code || '').toUpperCase()) + '</span></p>' +
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
        '<section class="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-xl">' +
          '<p class="text-xs font-semibold uppercase tracking-wide text-emerald-100">Saldo disponible</p>' +
          '<p id="balance" class="mt-1 font-mono text-5xl font-black tracking-tight">$0</p>' +
        '</section>' +
        '<section id="pending-card" class="hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xl">' +
          '<h2 class="font-semibold">Transacciones pendientes</h2>' +
          '<div id="pending-list" class="mt-2 space-y-2 text-sm"></div>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Transferir</h2>' +
          '<form id="transfer-form" class="space-y-3" autocomplete="off" novalidate>' +
            '<label class="block text-sm font-medium">Motivo' +
              '<select name="reason" required class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                '<option value="">Selecciona un motivo</option>' +
              '</select>' +
            '</label>' +
            '<label class="block text-sm font-medium">Destinatario' +
              '<select name="recipient" class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">' +
                '<option value="BANK">Banca</option>' +
              '</select>' +
            '</label>' +
            '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">' +
              '<label class="block text-sm font-medium">Importe' +
                '<input name="amount" type="number" min="1" max="1000000000" step="1" required inputmode="numeric" placeholder="200" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
              '</label>' +
              '<label class="block text-sm font-medium">Detalle (opcional)' +
                '<input name="detail" maxlength="200" placeholder="Propiedad, jugador, etc." class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
              '</label>' +
            '</div>' +
            '<p id="reason-hint" class="hidden text-xs text-slate-500"></p>' +
            '<button type="submit" class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">Transferir</button>' +
          '</form>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Saldos de la partida</h2>' +
          '<div class="overflow-x-auto">' +
            '<table class="w-full text-sm">' +
              '<thead><tr class="text-left text-xs uppercase tracking-wide text-slate-500">' +
                '<th class="py-2">Jugador</th><th class="py-2 text-right">Saldo</th>' +
              '</tr></thead>' +
              '<tbody id="players-body"><tr><td colspan="2" class="py-3 text-slate-500">Cargando...</td></tr></tbody>' +
            '</table>' +
          '</div>' +
        '</section>' +
        '<section class="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">' +
          '<h2 class="mb-3 font-semibold">Últimos movimientos</h2>' +
          '<div id="history" class="space-y-2 text-sm text-slate-700"><p class="text-slate-500">Sin movimientos.</p></div>' +
        '</section>' +
      '</div></main>';

    const form = document.getElementById('transfer-form');
    const reasonSelect = form.querySelector('[name="reason"]');
    const recipientSelect = form.querySelector('[name="recipient"]');
    const amountInput = form.querySelector('[name="amount"]');
    const detailInput = form.querySelector('[name="detail"]');
    const submit = form.querySelector('button[type="submit"]');
    const reasonHint = document.getElementById('reason-hint');
    const balanceEl = document.getElementById('balance');
    const nameEl = document.getElementById('player-name');
    const statusLine = document.getElementById('game-status');
    const playersBody = document.getElementById('players-body');
    const historyBox = document.getElementById('history');
    const pendingCard = document.getElementById('pending-card');
    const pendingList = document.getElementById('pending-list');
    const menuButton = document.getElementById('menu-button');
    const menuPanel = document.getElementById('menu-panel');
    const menuInvite = document.getElementById('menu-invite');
    const menuAbout = document.getElementById('menu-about');

    let me = null;
    let pending = [];
    let state = null;
    let busy = false;
    let invalid = false;

    function renderInvalid(message) {
      app.innerHTML =
        '<main class="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">' +
        '<div class="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<h1 class="text-xl font-bold">Enlace inválido</h1>' +
        '<p class="mt-2 text-sm text-slate-600">' + M.esc(message || 'El enlace de jugador no es válido.') + '</p>' +
        '<a href="' + M.base + '/" class="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Volver al inicio</a>' +
        '</div></main>';
    }

    function fillReasons() {
      const flows = ['player-to-bank', 'player-to-player'];
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

    function currentReason() {
      return R.get(reasonSelect.value);
    }

    function currentFlow() {
      const reason = currentReason();
      if (!reason) {
        return null;
      }
      return R.playerFlow(reason);
    }

    function updateHint() {
      const reason = currentReason();
      const flow = currentFlow();
      let text = '';
      if (!reason) {
        text = '';
      } else if (flow === null) {
        text = 'Este motivo lo registra la Banca desde su panel.';
      } else if (flow === 'player' && recipientSelect.value === '') {
        text = 'No hay otros jugadores en la partida.';
      } else if (flow === 'player') {
        text = 'La Banca debe aprobar esta transferencia. Quedará pendiente hasta entonces.';
      } else {
        text = 'Se descuenta de tu saldo y se paga a la Banca.';
      }
      reasonHint.textContent = text;
      reasonHint.classList.toggle('hidden', !text);
    }

    function syncFormState() {
      const active = state !== null && state.game.status === 'active';
      const reason = currentReason();
      const flow = currentFlow();
      const actionable = reason !== null && flow !== null;
      const recipientReady = !actionable ? false : flow === 'bank' ? true : recipientSelect.value !== '';
      submit.disabled = busy || me === null || !active || !actionable || !recipientReady;
      submit.textContent = busy ? 'Transfiriendo...' : 'Transferir';
      updateHint();
    }

    function renderPending() {
      if (pending.length === 0) {
        pendingCard.classList.add('hidden');
        pendingList.innerHTML = '';
        return;
      }
      pendingCard.classList.remove('hidden');
      pendingList.innerHTML = pending
        .map(function (p) {
          const outgoing = me !== null && p.from_player_id === me.id;
          const other = outgoing ? p.to_name : p.from_name;
          const text = outgoing
            ? 'Enviaste ' + M.money(p.amount) + ' a ' + M.esc(other) + '.'
            : M.esc(other) + ' te envía ' + M.money(p.amount) + '.';
          return (
            '<div class="border-b border-amber-200 pb-2 last:border-0 last:pb-0">' +
            '<p class="font-medium">' + text + '</p>' +
            '<p class="text-xs text-amber-800/80">' + M.esc(p.description || 'Sin detalle') + ' · Esperando aprobación de la Banca.</p>' +
            '</div>'
          );
        })
        .join('');
    }

    function renderPlayers() {
      if (state.players.length === 0) {
        playersBody.innerHTML = '<tr><td colspan="2" class="py-3 text-slate-500">Sin jugadores.</td></tr>';
        return;
      }
      playersBody.innerHTML = state.players
        .map(function (p) {
          const mine = me !== null && p.id === me.id;
          return (
            '<tr class="border-t border-slate-100' + (mine ? ' bg-emerald-50' : '') + '">' +
            '<td class="py-2 pr-3 font-medium">' + M.esc(p.name) + (mine ? ' <span class="text-xs font-semibold text-emerald-700">(tú)</span>' : '') + '</td>' +
            '<td class="py-2 text-right font-mono font-semibold">' + M.money(p.balance) + '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    function renderRecipients() {
      if (!state) {
        return;
      }
      const previous = recipientSelect.value;
      const reason = currentReason();
      const flow = reason ? R.playerFlow(reason) : null;
      const others = state.players.filter(function (p) {
        return me === null || p.id !== me.id;
      });

      if (flow === 'player') {
        recipientSelect.disabled = false;
        if (others.length === 0) {
          recipientSelect.innerHTML = '<option value="">Sin otros jugadores</option>';
          recipientSelect.value = '';
          return;
        }
        recipientSelect.innerHTML = others
          .map(function (p) {
            return '<option value="' + p.id + '">' + M.esc(p.name) + ' · ' + M.money(p.balance) + '</option>';
          })
          .join('');
        const stillThere = others.some(function (p) {
          return String(p.id) === previous;
        });
        recipientSelect.value = stillThere ? previous : String(others[0].id);
        return;
      }

      if (flow === 'bank') {
        recipientSelect.disabled = true;
        recipientSelect.innerHTML = '<option value="BANK">Banca</option>';
        recipientSelect.value = 'BANK';
        return;
      }

      recipientSelect.disabled = false;
      recipientSelect.innerHTML =
        '<option value="BANK">Banca</option>' +
        others
          .map(function (p) {
            return '<option value="' + p.id + '">' + M.esc(p.name) + ' · ' + M.money(p.balance) + '</option>';
          })
          .join('');
      const stillThere = previous === 'BANK' || others.some(function (p) {
        return String(p.id) === previous;
      });
      recipientSelect.value = stillThere ? previous : 'BANK';
    }

    function applyReason() {
      const reason = currentReason();
      if (reason && reason.amount != null) {
        amountInput.value = reason.amount;
        amountInput.readOnly = true;
      } else {
        if (amountInput.readOnly) {
          amountInput.value = '';
        }
        amountInput.readOnly = false;
      }
      renderRecipients();
      syncFormState();
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
      if (invalid) {
        return;
      }
      try {
        state = await M.api('status.php?token=' + encodeURIComponent(token));
      } catch (err) {
        if (err.status === 404) {
          invalid = true;
          M.clearPlayerSessionByToken(token);
          renderInvalid(err.message);
        } else {
          statusLine.textContent = err.message;
        }
        throw err;
      }
      me = state.current_player;
      if (me === null) {
        invalid = true;
        M.clearPlayerSessionByToken(token);
        renderInvalid('El enlace no corresponde a un jugador de la partida.');
        return;
      }
      M.savePlayerSession(state.game.code, token, me.name);
      pending = state.pending || [];
      nameEl.textContent = 'Hola, ' + me.name;
      balanceEl.textContent = M.money(me.balance);
      statusLine.innerHTML =
        'Partida <span id="game-code" class="font-mono text-emerald-300">' + M.esc(state.game.code) + '</span>' +
        (state.game.status === 'active' ? ' · en curso' : ' · finalizada');
      renderPending();
      renderPlayers();
      renderRecipients();
      renderHistory();
      syncFormState();
    }

    reasonSelect.addEventListener('change', applyReason);
    recipientSelect.addEventListener('change', syncFormState);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy || state === null) {
        return;
      }
      const reason = currentReason();
      if (!reason) {
        M.toast('Elige un motivo', 'error');
        return;
      }
      const flow = R.playerFlow(reason);
      if (!flow) {
        M.toast('Este motivo lo registra la Banca', 'error');
        return;
      }
      const amount = parseInt(amountInput.value, 10);
      if (isNaN(amount) || amount < 1) {
        M.toast('Ingresa un importe mayor a cero', 'error');
        amountInput.focus();
        return;
      }

      const payload = {
        game_code: state.game.code,
        from_token: token,
        amount: amount,
        description: R.buildDescription(reason, detailInput.value),
      };

      if (flow === 'player') {
        const recipient = parseInt(recipientSelect.value, 10);
        if (!recipient) {
          M.toast('Elige un jugador', 'error');
          return;
        }
        payload.to_player_id = recipient;
      } else {
        payload.to_token = 'BANK';
      }

      busy = true;
      syncFormState();
      try {
        const result = await M.api('transfer.php', { method: 'POST', body: payload });
        detailInput.value = '';
        if (reason.amount == null) {
          amountInput.value = '';
        }
        if (result.pending) {
          M.toast('Solicitud enviada. Queda pendiente de aprobación de la Banca.');
        } else {
          M.toast('Transferencia realizada');
        }
        await refresh();
      } catch (err) {
        M.toast(err.message, 'error');
      } finally {
        busy = false;
        syncFormState();
      }
    });

    fillReasons();
    syncFormState();
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
      if (!state) {
        M.toast('La partida todavía está cargando', 'error');
        return;
      }
      M.openInviteModal(state.game.code);
    });
    menuAbout.addEventListener('click', function () {
      closeMenu();
      M.openAboutModal();
    });

    M.startPolling(refresh, 3000);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
