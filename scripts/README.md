# LaserHub Operations Scripts

## uptime-check.sh

A minimal HTTP probe for the backend, frontend dev server, and public production URL. Writes `[OK]` / `[DOWN]` lines to stdout and optionally posts to a Slack-style webhook when something fails.

### Manual run

```bash
./scripts/uptime-check.sh
```

Override the targets via env vars if needed:

```bash
BACKEND_URL=https://api.laserhub.hjlabs.in/health \
FRONTEND_URL=https://laserhub.hjlabs.in/ \
PUBLIC_URL=https://laserhub.hjlabs.in/health \
./scripts/uptime-check.sh "$SLACK_WEBHOOK"
```

### Cron (every 5 minutes)

Edit with `crontab -e` and add:

```cron
*/5 * * * * cd /home/hemang/Documents/GitHub/LaserHub && ./scripts/uptime-check.sh $SLACK_WEBHOOK >> /var/log/laserhub-uptime.log 2>&1
```

Set `SLACK_WEBHOOK` in your shell profile (`~/.bashrc` / `~/.zshrc`) or pass it directly in the cron line.

### Alternative: UptimeRobot (free, hosted)

If you don't want to run cron yourself, sign up for the free tier at <https://uptimerobot.com>:

1. Create an HTTP(s) monitor for `https://laserhub.hjlabs.in/health`.
2. Create another for `https://laserhub.hjlabs.in/` (frontend).
3. Set interval to 5 minutes and add your email as an alert contact.

UptimeRobot's free tier covers up to 50 monitors and supports email, Slack, Discord, and webhook notifications.
