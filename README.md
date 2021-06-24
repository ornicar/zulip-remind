# Zulip Remind

Zulip bot that posts messages in a stream at a fixed date.

Also see: https://github.com/apkallum/zulip-reminder-bot.

I wanted a single service using redis, with support for fixed dates and public stream posting.

## Built-in help command

Use `@remind` to set a reminder for yourself, or for a stream.
Some examples include:

- `@remind` me on June 1st to wish Linda happy birthday
- `@remind` me to stop procrastinating tomorrow
- `@remind` here in 3 hours to update the project status
- `@remind` stream to party hard on 2021-09-27 at 10pm

Use `@remind list` to see the list of all your reminders.

Use `@remind delete` id to delete a reminder by its ID

## Setup

In Zulip, go to Settings -> Your bots, and add a new bot.

You may name it `remind` as I did, or anything else you like.

After it's created, download its `zuliprc` file and put it at the root of this project.

```
yarn install
yarn dev
```

## Production

```
yarn build
yarn start
```

Or start it with `node dist/index.js`

### Systemd service definition

```
[Unit]
Description=Zulip remind bot
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/home/zulip-remind
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```
