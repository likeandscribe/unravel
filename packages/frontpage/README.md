# frontpage

Frontpage AppView and frontend client.

## Running locally

If you just need to work on the app in a logged-out state, then you just need to run the following:

```bash
pnpm run dev
```

If you need to login, you need to setup some additional env vars and serve your dev server over the public internet. You can do this with `cloudflared` although other options are available eg. `ngrok` or `tailscale`:

```bash
pnpm exec tsx ./scripts/generate-jwk.mts # Copy this output into .env.local

# In one terminal, start the dev server
pnpm run dev

# In another terminal, open the tunnel. This example uses `cloudflared`
cloudflared tunnel --url http://localhost:3000
```
