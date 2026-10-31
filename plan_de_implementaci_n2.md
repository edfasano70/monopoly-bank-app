# Plan de Implementación: Banca Web para Monopoly

Este documento define la arquitectura, el diseño de la base de datos, las API endpoints y la interfaz de usuario para una aplicación de Banca de Monopoly ligera en PHP nativo, MySQL, Vanilla JS y Tailwind CSS.

---

## 1. Stack Tecnológico

* **Base de Datos:** MySQL (con motor InnoDB para soporte de transacciones).
* **Backend:** PHP Nativo (uso de PDO para consultas preparadas y salida en formato JSON).
* **Frontend:** Vanilla JavaScript (ES6+ sin frameworks).
* **Estilos:** Tailwind CSS (vía CDN para desarrollo ágil y sin compiladores).

---

## 2. Esquema de Base de Datos (MySQL)

El diseño garantiza integridad referencial y atomicidad en el registro de saldos y transferencias.

```sql
CREATE DATABASE IF NOT EXISTS monopoly_bank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monopoly_bank;

-- Tabla de Partidas
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    initial_balance INT NOT NULL DEFAULT 1500,
    status ENUM('active', 'finished') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Jugadores
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    balance INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de Transacciones (Auditoría de fondos)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    from_player_id INT NULL COMMENT 'NULL representa a la Banca',
    to_player_id INT NULL COMMENT 'NULL representa a la Banca',
    amount INT NOT NULL,
    description VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (from_player_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (to_player_id) REFERENCES players(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

---

## 3. Estructura de Directorios

```text
monopoly-bank/
├── config/
│   └── database.php       # Conexión PDO centralizada
├── api/
│   ├── game.php           # Crear o cargar partida existente por código
│   ├── join.php           # Registrar nuevos jugadores y generar token único
│   ├── transfer.php       # Procesamiento de transacciones (Jugador <-> Jugador / Banca)
│   └── status.php         # Endpoint de sondeo (polling) de saldos e historial
├── assets/
│   └── js/
│       ├── bank.js        # Lógica del panel de administración (La Banca)
│       └── player.js      # Lógica del panel individual de cada jugador
├── PLAN.md                # Plan de implementación
└── index.php              # Vista dinámica única (Banca / Formulario / Jugador)
```

---

## 4. Diseño de la API Backend (PHP Nativo)

### `POST /api/game.php`
* **Propósito:** Inicia o recupera una partida según el código del tablero.
* **Payload Request:**
  ```json
  {
    "code": "TABLERO_01",
    "initial_balance": 1500
  }
  ```
* **Lógica:** Si el código existe, devuelve la partida existente; de lo contrario, registra una nueva partida con el saldo inicial especificado.

### `POST /api/join.php`
* **Propósito:** Registrar un jugador a una partida activa mediante el código.
* **Payload Request:**
  ```json
  {
    "game_code": "TABLERO_01",
    "player_name": "Carlos"
  }
  ```
* **Lógica:** Genera un token aleatorio de 32 bytes (`bin2hex(random_bytes(16))`), asigna el saldo inicial de la partida y devuelve el enlace único (`index.php?token=TOKEN_UNICO`).

### `POST /api/transfer.php`
* **Propósito:** Ejecutar transferencias de fondos de forma atómica.
* **Payload Request:**
  ```json
  {
    "game_id": 1,
    "from_token": "HASH_EMISOR", 
    "to_token": "HASH_RECEPTOR", 
    "amount": 200,
    "description": "Pago de propiedad"
  }
  ```
  *(Nota: Se usa `"BANK"` en los tokens si el origen o el destino es la Banca)*.
* **Lógica:** Uso de `$pdo->beginTransaction()`. Descuenta saldo del emisor (si no es Banca), acredita saldo al receptor (si no es Banca) y registra en `transactions`.

### `GET /api/status.php`
* **Propósito:** Fuente de datos para actualizar la UI en tiempo real.
* **Query Params:** `?code=TABLERO_01` o `?token=TOKEN_JUGADOR`
* **Payload Response:**
  ```json
  {
    "game": { "code": "TABLERO_01", "status": "active" },
    "current_player": { "name": "Carlos", "balance": 1300 },
    "players": [
      { "id": 1, "name": "Carlos", "balance": 1300 },
      { "id": 2, "name": "Ana", "balance": 1700 }
    ],
    "transactions": [...]
  }
  ```

---

## 5. Arquitectura del Frontend y Flujos de Pantalla

La aplicación dispondrá de un único archivo de entrada `index.php` que evaluará los parámetros URL para presentar la vista correspondiente:

1. **Modo Creación / Carga (`index.php` sin parámetros):** Formulario para ingresar el código del tablero y crear o reanudar una partida.
2. **Modo Registro de Jugador (`index.php?join=CODIGO`):** Formulario donde los jugadores colocan su nombre para unirse y recibir su enlace individual.
3. **Modo Panel de Banca (`index.php?code=CODIGO`):** Vista general con enlace de invitación, saldos globales de todos los participantes y controles bancarios directos.
4. **Modo Panel de Jugador (`index.php?token=HASH`):** Interfaz optimizada para móviles con el saldo del usuario en grande, selector rápido de destinatario y tabla de saldos de rivales.

* **Sincronización:** Mediante `setInterval` ejecutando `fetch('/api/status.php?...')` cada 3 segundos en Vanilla JS para mantener refrescada la información en pantalla.

---

## 6. Plan de Pasos para el Desarrollo

1. **Paso 1:** Configuración de la Base de Datos (`schema.sql`) y script de conexión `config/database.php`.
2. **Paso 2:** Desarrollo de los endpoints API backend (`game.php`, `join.php`, `transfer.php`, `status.php`).
3. **Paso 3:** Implementación del frontend dinámico en `index.php` usando Tailwind CSS por CDN.
4. **Paso 4:** Integración de Vanilla JS (`bank.js` y `player.js`) con manejo de sondeo (*polling*) y eventos de formulario.