-- Your SQL goes here
CREATE TABLE IF NOT EXISTS drainpipe(
  seq bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS dead_letter_queue(
  seq bigint NOT NULL,
  err_kind smallint NOT NULL,
  err_msg text NOT NULL,
  source text NOT NULL
);

INSERT INTO drainpipe(seq)
  VALUES (622867028);
