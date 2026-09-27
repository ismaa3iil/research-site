CREATE TABLE IF NOT EXISTS preferences (
  study_version TEXT NOT NULL,
  atlas_version TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  comparison_rank INTEGER NOT NULL CHECK (comparison_rank BETWEEN 1 AND 120),
  first_choice TEXT NOT NULL,
  second_choice TEXT NOT NULL,
  third_choice TEXT NOT NULL,
  diagram_ids_json TEXT NOT NULL,
  presentation_json TEXT NOT NULL,
  client_timestamp TEXT NOT NULL,
  received_at TEXT NOT NULL,
  PRIMARY KEY (study_version, atlas_version, visitor_hash, comparison_rank)
);

CREATE INDEX IF NOT EXISTS preferences_received_at
  ON preferences (received_at);

CREATE INDEX IF NOT EXISTS preferences_first_choice
  ON preferences (study_version, atlas_version, first_choice);
