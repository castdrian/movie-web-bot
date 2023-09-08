# discord-bot

Simple discord bot to work along-side movie-web

## Usage

### Production

```bash
docker run --env-file=.env --name=mw-bot --restart=unless-stopped ghcr.io/movie-web/discord-bot:master
```

### Development

```bash
docker-compose up
```
