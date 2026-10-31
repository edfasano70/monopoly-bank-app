-- Esquema de base de datos "Monopoly Bank" (MySQL 8, InnoDB).
-- Aplicar manualmente: mysql monopoly < sql/schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS games (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)   NOT NULL,
  initial_balance INT           NOT NULL DEFAULT 1500,
  status          ENUM('active', 'finished') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_games_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS players (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  token      CHAR(32)     NOT NULL,
  balance    INT          NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_players_token (token),
  UNIQUE KEY uniq_players_game_name (game_id, name),
  KEY idx_players_game (game_id),
  CONSTRAINT fk_players_game
    FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT chk_players_balance CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id        INT UNSIGNED    NOT NULL,
  from_player_id INT UNSIGNED    DEFAULT NULL COMMENT 'NULL representa a la Banca',
  to_player_id   INT UNSIGNED    DEFAULT NULL COMMENT 'NULL representa a la Banca',
  amount         INT             NOT NULL,
  description    VARCHAR(255)    NOT NULL DEFAULT '',
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_game (game_id, id),
  KEY idx_transactions_from (from_player_id),
  KEY idx_transactions_to (to_player_id),
  CONSTRAINT fk_transactions_game
    FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_from
    FOREIGN KEY (from_player_id) REFERENCES players (id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_to
    FOREIGN KEY (to_player_id) REFERENCES players (id) ON DELETE SET NULL,
  CONSTRAINT chk_transactions_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pending_transfers (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id        INT UNSIGNED    NOT NULL,
  from_player_id INT UNSIGNED    NOT NULL,
  to_player_id   INT UNSIGNED    NOT NULL,
  amount         INT             NOT NULL,
  description    VARCHAR(255)    NOT NULL DEFAULT '',
  status         ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at    TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_pending_game_status (game_id, status, id),
  CONSTRAINT fk_pending_game
    FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT fk_pending_from
    FOREIGN KEY (from_player_id) REFERENCES players (id) ON DELETE CASCADE,
  CONSTRAINT fk_pending_to
    FOREIGN KEY (to_player_id) REFERENCES players (id) ON DELETE CASCADE,
  CONSTRAINT chk_pending_amount CHECK (amount > 0),
  CONSTRAINT chk_pending_distinct CHECK (from_player_id <> to_player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
