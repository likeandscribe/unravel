ALTER TABLE dead_letter_queue RENAME COLUMN err_msg TO msg;

ALTER TABLE dead_letter_queue
  DROP COLUMN source;

ALTER TABLE dead_letter_queue
  DROP COLUMN err_kind;
