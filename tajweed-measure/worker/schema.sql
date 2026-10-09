PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY, public_json TEXT NOT NULL, provenance_json TEXT NOT NULL, object_key TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, clip_id TEXT NOT NULL REFERENCES clips(id), public_json TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY, label TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS invitations (
  token_hash TEXT PRIMARY KEY, expert_id TEXT NOT NULL REFERENCES experts(id), expires_at INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, expert_id TEXT NOT NULL REFERENCES experts(id), expires_at INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS assignments (
  expert_id TEXT NOT NULL REFERENCES experts(id), task_id TEXT NOT NULL REFERENCES tasks(id),
  PRIMARY KEY (expert_id, task_id)
) STRICT;
CREATE TABLE IF NOT EXISTS annotations (
  expert_id TEXT NOT NULL, task_id TEXT NOT NULL, revision INTEGER NOT NULL,
  data_json TEXT NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (expert_id, task_id),
  FOREIGN KEY (expert_id, task_id) REFERENCES assignments(expert_id, task_id)
) STRICT;
CREATE TABLE IF NOT EXISTS annotation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, expert_id TEXT NOT NULL, task_id TEXT NOT NULL,
  revision INTEGER NOT NULL, data_json TEXT NOT NULL, updated_at INTEGER NOT NULL,
  UNIQUE (expert_id, task_id, revision)
) STRICT;
CREATE TRIGGER IF NOT EXISTS annotation_insert AFTER INSERT ON annotations BEGIN
  INSERT INTO annotation_history(expert_id,task_id,revision,data_json,updated_at)
  VALUES(NEW.expert_id,NEW.task_id,NEW.revision,NEW.data_json,NEW.updated_at);
END;
CREATE TRIGGER IF NOT EXISTS annotation_update AFTER UPDATE ON annotations BEGIN
  INSERT INTO annotation_history(expert_id,task_id,revision,data_json,updated_at)
  VALUES(NEW.expert_id,NEW.task_id,NEW.revision,NEW.data_json,NEW.updated_at);
END;
CREATE INDEX IF NOT EXISTS assignments_task ON assignments(task_id);
CREATE INDEX IF NOT EXISTS sessions_expert ON sessions(expert_id);
