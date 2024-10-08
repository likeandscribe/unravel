use cid::Cid;
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Debug, Deserialize)]
pub struct Header {
    #[serde(rename(deserialize = "t"))]
    pub type_: String,
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

fn cid_serialize<S>(x: &Option<Cid>, s: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match x {
        Some(cid) => s.serialize_str(&cid.to_string()),
        None => s.serialize_none(),
    }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SubscribeReposCommitOperationAction {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SubscribeReposCommitOperation {
    pub path: String,
    pub action: SubscribeReposCommitOperationAction,
    #[serde(serialize_with = "cid_serialize")]
    pub cid: Option<Cid>,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposCommit {
    #[serde(rename(deserialize = "ops"))]
    pub operations: Vec<SubscribeReposCommitOperation>,
    pub repo: String,
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposHandle {
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposTombstone {
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposAccount {
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
}

#[derive(Debug, Deserialize)]
pub struct SubscribeReposIdentity {
    #[serde(rename(deserialize = "seq"))]
    pub sequence: i64,
}

#[derive(Debug)]
pub enum SubscribeRepos {
    Commit(SubscribeReposCommit),
    Handle(SubscribeReposHandle),
    Tombstone(SubscribeReposTombstone),
    Account(SubscribeReposAccount),
    Identity(SubscribeReposIdentity),
}

impl SubscribeRepos {
    pub fn sequence(&self) -> i64 {
        match self {
            SubscribeRepos::Commit(commit) => commit.sequence,
            SubscribeRepos::Handle(handle) => handle.sequence,
            SubscribeRepos::Tombstone(tombstone) => tombstone.sequence,
            SubscribeRepos::Account(account) => account.sequence,
            SubscribeRepos::Identity(identity) => identity.sequence,
        }
    }
}

pub fn read(data: &[u8]) -> Result<(Header, SubscribeRepos), Error> {
    let mut reader = Cursor::new(data);

    let header = ciborium::de::from_reader::<Header, _>(&mut reader)?;
    let body = match header.type_.as_str() {
        "#commit" => SubscribeRepos::Commit(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#handle" => SubscribeRepos::Handle(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#tombstone" => SubscribeRepos::Tombstone(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#account" => SubscribeRepos::Account(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#identity" => SubscribeRepos::Identity(serde_ipld_dagcbor::from_reader(&mut reader)?),
        _ => {
            return Err(Error::UnknownTypeError(header.type_));
        }
    };

    Ok((header, body))
}
