-- Your SQL goes here
CREATE TABLE IF NOT EXISTS drainpipe(
  seq bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS dead_letter_queue(
  seq bigint NOT NULL,
  msg text NOT NULL
);
