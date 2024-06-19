ALTER TABLE dead_letter_queue RENAME COLUMN msg TO err_msg;

ALTER TABLE dead_letter_queue
  ADD COLUMN source blob;

ALTER TABLE dead_letter_queue
  ADD COLUMN err_kind int;
