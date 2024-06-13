use chrono::{DateTime, Utc};
use cid::Cid;
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Debug, Deserialize)]
pub struct Header {
    #[serde(rename(deserialize = "t"))]
    pub type_: String,
    #[serde(rename(deserialize = "op"))]
    pub operation: u8,
}

use std::fmt;

#[derive(Debug)]
pub enum Error {
    Header(ciborium::de::Error<std::io::Error>),
    Body(serde_ipld_dagcbor::DecodeError<std::io::Error>),
    UnknownTypeError(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::Header(e) => write!(f, "Header error: {}", e),
            Error::Body(e) => write!(f, "Body error: {}", e),
            Error::UnknownTypeError(s) => write!(f, "Unknown type error: {}", s),
        }
    }
}

impl std::error::Error for Error {}

impl From<ciborium::de::Error<std::io::Error>> for Error {
    fn from(e: ciborium::de::Error<std::io::Error>) -> Self {
        Self::Header(e)
    }
}

impl From<serde_ipld_dagcbor::DecodeError<std::io::Error>> for Error {
    fn from(e: serde_ipld_dagcbor::DecodeError<std::io::Error>) -> Self {
        Self::Body(e)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SubscribeReposCommitOperation {
    pub path: String,
    pub action: String,
    pub cid: Option<Cid>,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposCommit {
    #[serde(with = "serde_bytes")]
    pub blocks: Vec<u8>,
    pub commit: Cid,
    #[serde(rename(deserialize = "ops"))]
    pub operations: Vec<SubscribeReposCommitOperation>,
    pub prev: Option<Cid>,
    pub rebase: bool,
    pub repo: String,
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
    pub time: DateTime<Utc>,
    #[serde(rename(deserialize = "tooBig"))]
    pub too_big: bool,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposHandle {
    pub did: String,
    pub handle: String,
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
    pub time: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposTombstone {
    pub did: String,
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
    pub time: DateTime<Utc>,
}

pub enum SubscribeRepos {
    Commit(SubscribeReposCommit),
    Handle(SubscribeReposHandle),
    Tombstone(SubscribeReposTombstone),
}

pub fn read(data: &[u8]) -> Result<(Header, SubscribeRepos), Error> {
    let mut reader = Cursor::new(data);

    let header = ciborium::de::from_reader::<Header, _>(&mut reader)?;
    let body = match header.type_.as_str() {
        "#commit" => SubscribeRepos::Commit(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#handle" => SubscribeRepos::Handle(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#tombstone" => SubscribeRepos::Tombstone(serde_ipld_dagcbor::from_reader(&mut reader)?),
        _ => {
            return Err(Error::UnknownTypeError(header.type_));
        }
    };

    Ok((header, body))
}
