CREATE TABLE IF NOT EXISTS drainpipe(
  seq integer NOT NULL
);

CREATE TABLE IF NOT EXISTS dead_letter_queue(
  seq integer NOT NULL,
  msg text NOT NULL
);

INSERT INTO drainpipe(seq)
  VALUES (622867028);
