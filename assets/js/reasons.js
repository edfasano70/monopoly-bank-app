(function (global) {
  'use strict';

  const GROUP_LABELS = {
    'bank-to-player': 'Banca → Jugador',
    'player-to-bank': 'Jugador → Banca',
    'player-to-player': 'Jugador → Jugador',
  };

  const REASONS = [
    { id: 'salida', label: 'Paso por Salida (+200)', flow: 'bank-to-player', amount: 200 },
    { id: 'tarjeta-cobro-banca', label: 'Cobro de Tarjeta (Suerte / Arca)', flow: 'bank-to-player' },
    { id: 'hipotecar', label: 'Hipotecar Propiedad', flow: 'bank-to-player' },
    { id: 'venta-casas', label: 'Venta de Casas / Hoteles', flow: 'bank-to-player' },

    { id: 'compra', label: 'Compra de Propiedad', flow: 'player-to-bank' },
    { id: 'construccion', label: 'Construcción (Casa / Hotel)', flow: 'player-to-bank' },
    { id: 'deshipotecar', label: 'Deshipotecar Propiedad', flow: 'player-to-bank' },
    { id: 'impuesto', label: 'Impuesto / Multa', flow: 'player-to-bank' },
    { id: 'fianza', label: 'Fianza de Cárcel ($50)', flow: 'player-to-bank', amount: 50 },
    { id: 'reparaciones', label: 'Pago de Reparaciones (Tarjeta)', flow: 'player-to-bank' },

    { id: 'alquiler', label: 'Pago de Alquiler / Renta', flow: 'player-to-player' },
    { id: 'compraventa', label: 'Compra / Venta de Propiedad', flow: 'player-to-player' },
    { id: 'comercio', label: 'Comercio / Trato Particular', flow: 'player-to-player' },
    { id: 'tarjeta-todos', label: 'Cobro de Tarjeta (Todos pagan)', flow: 'player-to-player' },
  ];

  function get(id) {
    for (let i = 0; i < REASONS.length; i += 1) {
      if (REASONS[i].id === id) {
        return REASONS[i];
      }
    }
    return null;
  }

  function group(flow) {
    return REASONS.filter(function (reason) {
      return reason.flow === flow;
    });
  }

  function groupLabel(flow) {
    return GROUP_LABELS[flow] || flow;
  }

  function bankAction(reason) {
    if (!reason) {
      return null;
    }
    if (reason.flow === 'bank-to-player') {
      return 'pay';
    }
    if (reason.flow === 'player-to-bank') {
      return 'collect';
    }
    if (reason.flow === 'player-to-player') {
      return 'between';
    }
    return null;
  }

  function playerFlow(reason) {
    if (!reason || reason.flow === 'bank-to-player') {
      return null;
    }
    return reason.flow === 'player-to-player' ? 'player' : 'bank';
  }

  function isPlayerActionable(reason) {
    return Boolean(reason) && reason.flow !== 'bank-to-player';
  }

  function buildDescription(reason, detail) {
    const extra = String(detail || '').trim();
    return extra ? reason.label + ' · ' + extra : reason.label;
  }

  global.MonopolyReasons = {
    list: REASONS,
    get: get,
    group: group,
    groupLabel: groupLabel,
    bankAction: bankAction,
    playerFlow: playerFlow,
    isPlayerActionable: isPlayerActionable,
    buildDescription: buildDescription,
  };
})(window);
