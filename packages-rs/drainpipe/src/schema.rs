// @generated automatically by Diesel CLI.

diesel::table! {
    dead_letter_queue (rowid) {
        rowid -> Integer,
        seq -> BigInt,
        msg -> Text,
    }
}

diesel::table! {
    drainpipe (rowid) {
        rowid -> Integer,
        seq -> BigInt,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    dead_letter_queue,
    drainpipe,
);
