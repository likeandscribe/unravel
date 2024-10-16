# Frontpage Dev Environment

Docker compose file that runs the required peices of infrastructure for frontpage locally.

> ![NOTE]
> Does not include the frontpage service itself, you should run that with `pnpm run dev`

## What's inside

- ATProto [PLC server](https://github.com/did-method-plc/did-method-plc) (http://localhost:4000 & https://plc.dev.unravel.fyi)
- ATProto [PDS](https://github.com/bluesky-social/pds) (http://localhost:4001 & https://pds.dev.unravel.fyi)
- [Drainpipe](../../../packages-rs/drainpipe/README.md) (pushes data from the PDS to the Frontpage Next.js app)
- Turso sqlite server (http://localhost:4002 && https://turso.dev.unravel.fyi)
- [Caddy](https://caddyserver.com/) reverse proxy (it provides the above services over HTTPS)
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) (a public https tunnel to the local Frontpage Next.js app)

## Setup

- `docker-compose up`
- Install the Unravel CA root certificate in your system's trust store. You can find it in the `frontpage-local-infra_caddy_data` volume at `/data/caddy/pki/authorities/unravel/root.crt`
- Grab the auto generated `cloudflared` tunnel URL from the logs of the `cloudflared` container
- Go about your business

> ![IMPORTANT]
> When running Node.js based apps make sure you're setting the `NODE_OPTIONS` environment variable to `--use-openssl-ca` to tell Node.js to use the system's trust store. The scripts inside of Frontpage's `package.json` already do this for you.

## Troubleshooting

### `docker-compose up` fails with `failed to solve: error from sender: open ~/unravel/packages/frontpage/local-infra/plc/db: permission denied`

Delete the ./plc directory and try again.

TODO: This can probably be fixed by using named volumes instead of bind mounts.
