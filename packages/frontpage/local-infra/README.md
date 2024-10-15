# Frontpage Dev Environment

Docker compose file that runs the required peices of infrastructure for frontpage locally. Does not include the frontpage service itself, you should run that with `pnpm run dev`

## Troubleshooting

### `docker-compose up` fails with `failed to solve: error from sender: open ~/unravel/packages/frontpage/local-infra/plc/db: permission denied`

Delete the ./plc directory and try again.
