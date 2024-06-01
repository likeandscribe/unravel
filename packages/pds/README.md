## Building dockerfile locally

```
docker build -f ./packages/pds/Dockerfile .
```

## Deploying to fly.io

```
fly deploy . -c ./packages/pds/fly.toml --dockerfile ./packages/pds/Dockerfile
```
