(function () {
  'use strict';

  const config = window.MONOPOLY || {};
  const base = (config.base || '').replace(/\/$/, '');

  async function api(path, options) {
    const opts = options || {};
    const init = {
      method: opts.method || 'GET',
      cache: 'no-store',
      headers: {},
    };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }

    let res;
    try {
      res = await fetch(base + '/api/' + path, init);
    } catch (err) {
      throw new Error('No se pudo conectar con el servidor');
    }

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (!res.ok || !data || data.ok !== true) {
      const error = new Error(data && data.error ? data.error : 'Error de conexión');
      error.status = res.status;
      throw error;
    }
    return data;
  }

  function money(value) {
    const n = Number(value) || 0;
    return '$' + n.toLocaleString('es-AR');
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[ch];
    });
  }

  function fmtDate(value) {
    if (!value) {
      return '';
    }
    const date = new Date(String(value).replace(' ', 'T'));
    if (isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }

  let toastTimer = null;
  function toast(message, kind) {
    let box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.className = 'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4';
      document.body.appendChild(box);
    }
    const color = kind === 'error' ? 'bg-red-600' : 'bg-slate-900';
    box.innerHTML =
      '<div class="pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ' +
      color +
      '">' +
      esc(message) +
      '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      box.innerHTML = '';
    }, 3800);
  }

  function startPolling(task, intervalMs) {
    let timer = null;
    let running = false;

    async function tick() {
      if (!document.hidden && !running) {
        running = true;
        try {
          await task();
        } catch (err) {
          void err;
        } finally {
          running = false;
        }
      }
      timer = setTimeout(tick, intervalMs || 3000);
    }

    tick();
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        clearTimeout(timer);
        tick();
      }
    });
  }

  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message || 'Enlace copiado');
    } catch (err) {
      window.prompt('Copia el enlace:', text);
    }
  }

  const PLAYER_KEY_PREFIX = 'monopoly.player.';

  function playerSessionKey(code) {
    return PLAYER_KEY_PREFIX + String(code || '').toUpperCase();
  }

  function savePlayerSession(code, token, name) {
    if (!code || !token) {
      return;
    }
    try {
      localStorage.setItem(
        playerSessionKey(code),
        JSON.stringify({ token: token, name: name || '' })
      );
    } catch (err) {
      void err;
    }
  }

  function getPlayerSession(code) {
    if (!code) {
      return null;
    }
    try {
      const raw = localStorage.getItem(playerSessionKey(code));
      if (!raw) {
        return null;
      }
      const data = JSON.parse(raw);
      if (!data || typeof data.token !== 'string' || !data.token) {
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  function clearPlayerSessionByToken(token) {
    if (!token) {
      return;
    }
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.indexOf(PLAYER_KEY_PREFIX) === 0) {
          keys.push(key);
        }
      }
      keys.forEach(function (key) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.token === token) {
            localStorage.removeItem(key);
          }
        } catch (err) {
          void err;
        }
      });
    } catch (err) {
      void err;
    }
  }

  function pageShell(inner) {
    return (
      '<main class="min-h-screen bg-slate-950 text-slate-100">' +
      '<div class="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">' +
      inner +
      '</div></main>'
    );
  }

  function bootHome() {
    const app = document.getElementById('app');
    app.innerHTML = pageShell(
      '<header class="mb-8">' +
        '<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Monopoly</p>' +
        '<h1 class="mt-2 text-3xl font-black tracking-tight">Banca del juego</h1>' +
        '<p class="mt-2 text-sm text-slate-400">Crea la partida con el código del tablero y comparte el enlace de invitación con los jugadores.</p>' +
      '</header>' +
      '<section class="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<form id="game-form" class="space-y-4" autocomplete="off">' +
          '<label class="block text-sm font-medium">Código del tablero' +
            '<input name="code" maxlength="50" required placeholder="TABLERO_01" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
          '</label>' +
          '<label class="block text-sm font-medium">Saldo inicial por jugador' +
            '<input name="initial_balance" type="number" min="0" max="1000000000" step="1" value="1500" required inputmode="numeric" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
          '</label>' +
          '<button type="submit" class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">Crear o abrir la banca</button>' +
        '</form>' +
        '<div class="mt-5 border-t border-slate-200 pt-5">' +
          '<p class="mb-2 text-xs text-slate-500">¿Eres jugador? Usa el código para entrar a la partida.</p>' +
          '<button id="join-button" type="button" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Unirme como jugador</button>' +
        '</div>' +
      '</section>'
    );

    const form = document.getElementById('game-form');
    const codeInput = form.querySelector('[name="code"]');
    const balanceInput = form.querySelector('[name="initial_balance"]');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const code = codeInput.value.trim().toUpperCase();
      const initial = parseInt(balanceInput.value, 10);
      if (!code) {
        toast('Ingresa el código del tablero', 'error');
        codeInput.focus();
        return;
      }
      if (isNaN(initial) || initial < 0) {
        toast('Saldo inicial inválido', 'error');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Abriendo...';
      try {
        const data = await api('game.php', {
          method: 'POST',
          body: { code: code, initial_balance: initial },
        });
        location.href = base + '/?code=' + encodeURIComponent(data.game.code);
      } catch (err) {
        toast(err.message, 'error');
        submit.disabled = false;
        submit.textContent = 'Crear o abrir la banca';
      }
    });

    document.getElementById('join-button').addEventListener('click', function () {
      const code = codeInput.value.trim().toUpperCase();
      if (!code) {
        toast('Ingresa el código del tablero', 'error');
        codeInput.focus();
        return;
      }
      location.href = base + '/?join=' + encodeURIComponent(code);
    });
  }

  function bootJoin() {
    const app = document.getElementById('app');
    const code = (config.join || '').toUpperCase();

    if (!code) {
      app.innerHTML = pageShell(
        '<div class="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
          '<h1 class="text-xl font-bold">Partida no indicada</h1>' +
          '<p class="mt-2 text-sm text-slate-600">El enlace de invitación no incluye un código.</p>' +
          '<a href="' + base + '/" class="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Volver al inicio</a>' +
        '</div>'
      );
      return;
    }

    const saved = getPlayerSession(code);
    const savedCard = saved
      ? '<section id="saved-session" class="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">' +
          '<p class="text-sm text-emerald-100">Ya te uniste en este dispositivo como <span class="font-semibold">' + esc(saved.name || 'jugador') + '</span>.</p>' +
          '<a href="' + base + '/?token=' + encodeURIComponent(saved.token) + '" class="mt-3 block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700">Continuar como ' + esc(saved.name || 'jugador') + '</a>' +
          '<p class="mt-2 text-xs text-emerald-200/80">Si quieres entrar con otro nombre, usa el formulario de abajo.</p>' +
        '</section>'
      : '';

    app.innerHTML = pageShell(
      '<header class="mb-8">' +
        '<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Monopoly</p>' +
        '<h1 class="mt-2 text-3xl font-black tracking-tight">Unirse a la partida</h1>' +
        '<p class="mt-2 text-sm text-slate-400">Código del tablero: <span class="font-mono font-semibold text-emerald-300">' + esc(code) + '</span></p>' +
      '</header>' +
      savedCard +
      '<section class="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
        '<form id="join-form" class="space-y-4" autocomplete="off">' +
          '<label class="block text-sm font-medium">Tu nombre' +
            '<input name="player_name" maxlength="100" required placeholder="Carlos" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />' +
          '</label>' +
          '<button type="submit" class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">Entrar a la partida</button>' +
        '</form>' +
        '<p class="mt-4 text-xs text-slate-500">Al entrar recibirás un enlace personal y lo guardaremos en este dispositivo. Si cambias de dispositivo o borras los datos, pide a la Banca un enlace nuevo.</p>' +
      '</section>'
    );

    const form = document.getElementById('join-form');
    const nameInput = form.querySelector('[name="player_name"]');
    const submit = form.querySelector('button[type="submit"]');

    if (saved) {
      api('status.php?token=' + encodeURIComponent(saved.token)).catch(function (err) {
        if (err.status === 404) {
          clearPlayerSessionByToken(saved.token);
          const card = document.getElementById('saved-session');
          if (card) {
            card.remove();
          }
        }
      });
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const name = nameInput.value.trim();
      if (!name) {
        toast('Ingresa tu nombre', 'error');
        nameInput.focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Entrando...';
      try {
        const data = await api('join.php', {
          method: 'POST',
          body: { game_code: code, player_name: name },
        });
        const link = location.origin + base + '/?token=' + data.token;
        savePlayerSession(code, data.token, data.player.name);
        app.innerHTML = pageShell(
          '<header class="mb-8">' +
            '<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Monopoly</p>' +
            '<h1 class="mt-2 text-3xl font-black tracking-tight">¡Listo, ' + esc(data.player.name) + '!</h1>' +
            '<p class="mt-2 text-sm text-slate-400">Ya estás dentro de la partida ' + esc(code) + '.</p>' +
          '</header>' +
          '<section class="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">' +
            '<p class="text-sm font-medium">Tu enlace personal</p>' +
            '<input readonly value="' + esc(link) + '" class="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700" />' +
            '<div class="mt-4 grid grid-cols-2 gap-3">' +
              '<button id="copy-link" type="button" class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copiar enlace</button>' +
              '<a href="' + esc(link) + '" class="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700">Abrir mi panel</a>' +
            '</div>' +
            '<p class="mt-4 text-xs text-slate-500">No compartas este enlace: quien lo tenga puede mover tu dinero.</p>' +
          '</section>'
        );
        document.getElementById('copy-link').addEventListener('click', function () {
          copy(link);
        });
      } catch (err) {
        toast(err.message, 'error');
        submit.disabled = false;
        submit.textContent = 'Entrar a la partida';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (config.view === 'home') {
      bootHome();
    } else if (config.view === 'join') {
      bootJoin();
    }
  });

  window.Monopoly = {
    api: api,
    money: money,
    esc: esc,
    fmtDate: fmtDate,
    toast: toast,
    startPolling: startPolling,
    copy: copy,
    savePlayerSession: savePlayerSession,
    getPlayerSession: getPlayerSession,
    clearPlayerSessionByToken: clearPlayerSessionByToken,
    base: base,
  };
})();
