#!/bin/bash
set -o errexit
set -o nounset
set -o pipefail

source "$(dirname "$0")/../pds.env"

# curl a URL and fail if the request fails.
function curl_cmd_get {
  curl --fail --silent --show-error "$@"
}

# curl a URL and fail if the request fails.
function curl_cmd_post {
  curl --fail --silent --show-error --request POST --header "Content-Type: application/json" "$@"
}

# curl a URL but do not fail if the request fails.
function curl_cmd_post_nofail {
  curl --silent --show-error --request POST --header "Content-Type: application/json" "$@"
}

USERNAME="${1:-}"

if [[ "${USERNAME}" == "" ]]; then
  read -p "Enter a username: " USERNAME
fi

if [[ "${USERNAME}" == "" ]]; then
  echo "ERROR: missing USERNAME parameter." >/dev/stderr
  echo "Usage: $0 ${SUBCOMMAND} <USERNAME>" >/dev/stderr
  exit 1
fi

PASSWORD="password"
INVITE_CODE="$(curl_cmd_post \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --data '{"useCount": 1}' \
  "https://${PDS_HOSTNAME}/xrpc/com.atproto.server.createInviteCode" | jq --raw-output '.code'
)"
RESULT="$(curl_cmd_post_nofail \
  --data "{\"email\":\"${USERNAME}@${PDS_HOSTNAME}\", \"handle\":\"${USERNAME}.${PDS_HOSTNAME}\", \"password\":\"${PASSWORD}\", \"inviteCode\":\"${INVITE_CODE}\"}" \
  "https://${PDS_HOSTNAME}/xrpc/com.atproto.server.createAccount"
)"

DID="$(echo $RESULT | jq --raw-output '.did')"
if [[ "${DID}" != did:* ]]; then
  ERR="$(echo ${RESULT} | jq --raw-output '.message')"
  echo "ERROR: ${ERR}" >/dev/stderr
  echo "Usage: $0 <EMAIL> <HANDLE>" >/dev/stderr
  exit 1
fi

echo
echo "Account created successfully!"
echo "-----------------------------"
echo "Handle   : ${USERNAME}.pds.dev.unravel.fyi"
echo "DID      : ${DID}"
echo "Password : ${PASSWORD}"
echo "-----------------------------"
echo "Save this password, it will not be displayed again."
echo
