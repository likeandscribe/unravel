use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

use crate::{ProcessError, ProcessErrorKind, Source};

pub fn db_connect(database_url: &String) -> anyhow::Result<SqliteConnection> {
    SqliteConnection::establish(&database_url).map_err(Into::into)
}

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");
pub fn run_migrations(
    conn: &mut SqliteConnection,
) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    conn.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

pub fn update_seq(conn: &mut SqliteConnection, new_seq: i64) -> anyhow::Result<()> {
    use crate::schema::drainpipe::dsl::*;

    diesel::update(drainpipe.filter(rowid.eq(1)))
        .set(seq.eq(&new_seq))
        .execute(conn)?;

    Ok(())
}

pub fn record_dead_letter(conn: &mut SqliteConnection, e: &ProcessError) -> anyhow::Result<()> {
    use crate::schema::dead_letter_queue::dsl::*;

    diesel::insert_into(dead_letter_queue)
        .values((
            err_kind.eq(&e.kind),
            err_msg.eq(&e.inner.to_string()),
            seq.eq(&e.seq),
            source.eq(&e.source),
        ))
        .execute(conn)?;

    Ok(())
}

pub fn get_seq(conn: &mut SqliteConnection) -> anyhow::Result<i64> {
    use crate::schema::drainpipe::dsl::*;

    let row = drainpipe.select(seq).first::<i64>(conn)?;

    Ok(row)
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::drainpipe)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DrainpipeMeta {
    pub seq: i64,
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::dead_letter_queue)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DeadLetter {
    pub seq: i64,
    pub err_kind: ProcessErrorKind,
    pub err_msg: String,
    pub source: Source,
}
