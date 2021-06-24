# Zulip Remind

Zulip bot that posts messages in a stream at a fixed date.

Also see: https://github.com/apkallum/zulip-reminder-bot.

I wanted a single service using redis, with support for fixed dates and public stream posting.

## Run

Create a standard `zuliprc` bot config file at the root of the project.

```
yarn install
yarn dev
```

Prod: `yarn start`
