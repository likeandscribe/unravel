use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

pub fn db_connect(database_url: &String) -> anyhow::Result<SqliteConnection> {
    SqliteConnection::establish(&database_url).map_err(Into::into)
}

pub fn update_seq(conn: &mut SqliteConnection, seq: i32) -> anyhow::Result<()> {
    use crate::schema::drainpipe::dsl::*;

    diesel::insert_into(drainpipe)
        .values(seq.eq(&seq))
        .execute(conn)?;

    Ok(())
}

pub fn record_dead_letter(conn: &mut SqliteConnection, msg: &str) -> anyhow::Result<()> {
    use crate::schema::dead_letter_queue::dsl::*;

    diesel::insert_into(dead_letter_queue)
        .values(msg.eq(msg))
        .load(conn)?;

    Ok(())
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::drainpipe)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DrainpipeMeta {
    pub seq: i32,
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::dead_letter_queue)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DeadLetter {
    pub seq: i32,
    pub msg: String,
}
