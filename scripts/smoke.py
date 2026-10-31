#!/usr/bin/env python3
"""Verificación HTTP de Monopoly Bank (sin dependencias externas)."""

import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request

DEFAULT_BASE = os.environ.get("SMOKE_BASE_URL", "http://127.0.0.1:8080")

failures = []


def check(condition, label, detail=""):
    if condition:
        print(f"✓ {label}")
    else:
        print(f"✗ {label}{(' ' + detail) if detail else ''}")
        failures.append(label)


class Client:
    def __init__(self, base, timeout, insecure=False):
        self.base = base.rstrip("/")
        context = ssl.create_default_context()
        if insecure:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPSHandler(context=context)
        )
        self.timeout = timeout

    def request(self, method, path, payload=None):
        url = self.base + path
        data = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=self.timeout) as res:
                return res.status, res.read(), res.headers
        except urllib.error.HTTPError as err:
            return err.code, err.read(), err.headers
        except urllib.error.URLError as err:
            print(f"✗ no se pudo conectar con {url}: {err.reason}")
            failures.append("conexión")
            return 0, b"", {}


def parse(body):
    try:
        return json.loads(body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None


def basic_checks(client):
    status, body, _ = client.request("GET", "/")
    check(status == 200, "GET / → 200", f"(recibido {status})")
    check(b"Monopoly" in body, "la portada contiene Monopoly")

    status, _, _ = client.request("GET", "/api/config.php")
    check(status == 403, "GET /api/config.php → 403", f"(recibido {status})")

    status, _, _ = client.request("GET", "/plan_de_implementaci_n2.md")
    check(status == 403, "GET /plan_de_implementaci_n2.md → 403", f"(recibido {status})")

    status, _, _ = client.request("GET", "/sql/schema.sql")
    check(status == 403, "GET /sql/schema.sql → 403", f"(recibido {status})")

    status, body, _ = client.request("GET", "/api/status.php")
    check(status == 400, "GET /api/status.php sin parámetros → 400", f"(recibido {status})")

    status, _, _ = client.request("GET", "/api/status.php?code=SMOKE_NOEXISTE")
    check(status == 404, "GET /api/status.php?code=inexistente → 404", f"(recibido {status})")

    status, _, _ = client.request("GET", "/api/status.php?token=" + "0" * 32)
    check(status == 404, "GET /api/status.php?token=inválido → 404", f"(recibido {status})")


def full_checks(client):
    stamp = str(int(time.time()))
    code = f"SMOKE_{stamp}"
    name_a = f"SmokeA{stamp}"
    name_b = f"SmokeB{stamp}"

    status, body, _ = client.request(
        "POST", "/api/game.php", {"code": code, "initial_balance": 1500}
    )
    data = parse(body)
    check(
        status == 200 and data and data.get("ok") and data["game"]["code"] == code,
        f"crear partida {code}",
        f"(recibido {status})",
    )
    if not data or not data.get("ok"):
        return code

    status, body, _ = client.request(
        "POST", "/api/join.php", {"game_code": code, "player_name": name_a}
    )
    data_a = parse(body)
    status_b, body_b, _ = client.request(
        "POST", "/api/join.php", {"game_code": code, "player_name": name_b}
    )
    data_b = parse(body_b)
    check(
        status == 201
        and data_a
        and data_a.get("ok")
        and status_b == 201
        and data_b
        and data_b.get("ok"),
        "unir dos jugadores",
        f"(recibido {status}/{status_b})",
    )
    if not data_a or not data_b or not data_a.get("ok") or not data_b.get("ok"):
        return code

    token_a = data_a["token"]
    id_a = data_a["player"]["id"]
    id_b = data_b["player"]["id"]

    status, _, _ = client.request(
        "POST",
        "/api/join.php",
        {"game_code": code, "player_name": name_a},
    )
    check(status == 409, "nombre duplicado → 409", f"(recibido {status})")

    status, _, _ = client.request(
        "POST",
        "/api/transfer.php",
        {"game_code": code, "from_token": "BANK", "to_player_id": id_a, "amount": 0},
    )
    check(status == 400, "importe 0 → 400", f"(recibido {status})")

    status, body, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": "BANK",
            "to_player_id": id_a,
            "amount": 100,
            "description": "smoke",
        },
    )
    data = parse(body)
    check(
        status == 200 and data and data.get("ok"),
        "la Banca paga al jugador A",
        f"(recibido {status})",
    )

    status, body, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": token_a,
            "to_player_id": id_b,
            "amount": 50,
            "description": "smoke pendiente",
        },
    )
    data = parse(body)
    pending_id = data["pending"]["id"] if data and data.get("ok") and data.get("pending") else 0
    check(
        status == 202 and pending_id > 0,
        "el jugador A solicita pagar al jugador B (pendiente)",
        f"(recibido {status})",
    )

    status, body, _ = client.request("GET", f"/api/status.php?code={code}")
    data = parse(body)
    pending = data.get("pending", []) if data and data.get("ok") else []
    balances = {p["id"]: p["balance"] for p in data["players"]} if data and data.get("ok") else {}
    check(
        any(p["id"] == pending_id for p in pending),
        "la solicitud aparece en pendientes de la Banca",
        f"(recibido {pending})",
    )
    check(
        balances.get(id_a) == 1600 and balances.get(id_b) == 1500,
        "la solicitud pendiente no mueve saldos",
        f"(recibido {balances})",
    )

    status, body, _ = client.request("GET", f"/api/status.php?token={token_a}")
    data = parse(body)
    player_pending = data.get("pending", []) if data and data.get("ok") else []
    check(
        any(p["id"] == pending_id for p in player_pending),
        "la solicitud aparece en el panel del jugador",
        f"(recibido {player_pending})",
    )

    status, body, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": token_a,
            "to_token": "BANK",
            "amount": 25,
            "description": "smoke",
        },
    )
    check(status == 200, "el jugador A paga a la Banca", f"(recibido {status})")

    status, _, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": token_a,
            "to_player_id": id_b,
            "amount": 999999999,
        },
    )
    check(status == 409, "saldo insuficiente → 409", f"(recibido {status})")

    status, body, _ = client.request(
        "POST",
        "/api/approve.php",
        {"game_code": code, "pending_id": pending_id},
    )
    data = parse(body)
    check(
        status == 200 and data and data.get("ok"),
        "la Banca aprueba la solicitud",
        f"(recibido {status})",
    )

    status, body, _ = client.request("GET", f"/api/status.php?code={code}")
    data = parse(body)
    balances = {p["id"]: p["balance"] for p in data["players"]} if data and data.get("ok") else {}
    pending = data.get("pending", []) if data and data.get("ok") else []
    check(
        balances.get(id_a) == 1525 and balances.get(id_b) == 1550,
        "saldos tras aprobación A=1525 y B=1550",
        f"(recibido {balances})",
    )
    check(len(pending) == 0, "la solicitud aprobada sale de pendientes", f"(recibido {pending})")

    status, body, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": token_a,
            "to_player_id": id_b,
            "amount": 10,
            "description": "smoke rechazo",
        },
    )
    data = parse(body)
    reject_id = data["pending"]["id"] if data and data.get("ok") and data.get("pending") else 0
    check(
        status == 202 and reject_id > 0,
        "nueva solicitud pendiente para rechazar",
        f"(recibido {status})",
    )

    status, body, _ = client.request(
        "POST",
        "/api/reject.php",
        {"game_code": code, "pending_id": reject_id},
    )
    data = parse(body)
    check(
        status == 200 and data and data.get("ok"),
        "la Banca rechaza la solicitud",
        f"(recibido {status})",
    )

    status, body, _ = client.request("GET", f"/api/status.php?code={code}")
    data = parse(body)
    balances = {p["id"]: p["balance"] for p in data["players"]} if data and data.get("ok") else {}
    pending = data.get("pending", []) if data and data.get("ok") else []
    check(
        balances.get(id_a) == 1525 and balances.get(id_b) == 1550,
        "el rechazo no mueve saldos",
        f"(recibido {balances})",
    )
    check(len(pending) == 0, "la solicitud rechazada sale de pendientes", f"(recibido {pending})")

    status, body, _ = client.request(
        "POST",
        "/api/transfer.php",
        {
            "game_code": code,
            "from_token": "BANK",
            "from_player_id": id_a,
            "to_player_id": id_b,
            "amount": 5,
            "description": "smoke Banca",
        },
    )
    check(status == 200, "la Banca mueve entre jugadores sin pendiente", f"(recibido {status})")

    status, body, _ = client.request("GET", f"/api/status.php?code={code}")
    data = parse(body)
    balances = {p["id"]: p["balance"] for p in data["players"]} if data and data.get("ok") else {}
    check(
        balances.get(id_a) == 1520 and balances.get(id_b) == 1555,
        "saldos finales A=1520 y B=1555",
        f"(recibido {balances})",
    )

    status, body, _ = client.request("GET", f"/api/status.php?token={token_a}")
    data = parse(body)
    check(
        status == 200
        and data
        and data.get("ok")
        and data["current_player"]["balance"] == 1520,
        "status por token devuelve el saldo del jugador",
        f"(recibido {status})",
    )

    status, body, _ = client.request(
        "POST",
        "/api/regenerate.php",
        {"game_code": code, "player_id": id_a},
    )
    data = parse(body)
    new_token = data["token"] if data and data.get("ok") else ""
    check(
        status == 200 and bool(new_token) and new_token != token_a,
        "regenerar enlace del jugador A",
        f"(recibido {status})",
    )

    status, _, _ = client.request("GET", f"/api/status.php?token={token_a}")
    check(status == 404, "el token anterior deja de funcionar → 404", f"(recibido {status})")

    status, body, _ = client.request("GET", f"/api/status.php?token={new_token}")
    data = parse(body)
    check(
        status == 200
        and data
        and data.get("ok")
        and data["current_player"]["id"] == id_a,
        "el token regenerado funciona",
        f"(recibido {status})",
    )

    return code


def main():
    parser = argparse.ArgumentParser(description="Smoke test HTTP de Monopoly Bank")
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--insecure", action="store_true")
    parser.add_argument(
        "--full",
        action="store_true",
        help="crea una partida de prueba y ejecuta el flujo completo",
    )
    args = parser.parse_args()

    client = Client(args.base_url, args.timeout, args.insecure)
    print(f"→ {client.base}\n")
    basic_checks(client)

    code = None
    if args.full:
        print("\n→ Flujo completo")
        code = full_checks(client)

    print("")
    if failures:
        print(f"✗ {len(failures)} chequeo(s) fallaron")
        return 1
    print("✓ Smoke test completado")
    if code:
        print(f"  Partida de prueba: {code} (queda en la base; limpiarla manualmente)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
