import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop, reply, send, ZulipDestPrivate, botName } from './zulip';
import { Remind, parseCommand, printRemind } from './command';
import { RedisStore, Store } from './store';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc' });
  const store: Store = new RedisStore();

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    try {
      const command = parseCommand(msg.command, msg);
      switch (command.verb) {
        case 'list':
          await listReminders(msg);
          break;
        case 'remind':
          await addReminder(msg, command);
          break;
        case 'help':
          await help(msg);
          break;
      }
    } catch {
      await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?');
    }
  };

  const addReminder = async (msg: ZulipMsg, remind: Remind) => {
    console.log(printRemind(remind));
    store.add(remind);
    await reply(z, msg, printRemind(remind));
  };

  const listReminders = async (msg: ZulipMsg) => {
    const all = await store.list();

    if (msg.type == 'stream') {
      await reply(z, msg, 'Public reminders in this stream:');
      const publicReminders = all.filter(r => r.dest.type == 'stream' && r.dest.to == msg.stream_id);
      if (publicReminders.length) publicReminders.forEach(async r => await reply(z, msg, printRemind(r)));
      else await reply(z, msg, 'None');
    }

    const pm: ZulipDestPrivate = { type: 'private', to: [msg.sender_id] };
    await send(z, pm, 'Your private reminders:');
    const privateReminders = all.filter(r => r.dest.type == 'private' && r.from == msg.sender_id);
    if (privateReminders.length) privateReminders.forEach(async r => await send(z, pm, printRemind(r)));
    else await send(z, pm, 'None');
  };

  const help = async (msg: ZulipMsg) => {
    const name = await botName(z);
    const mention = `@${name}`;
    await reply(
      z,
      msg,
      [
        'Use `' + mention + '` to set a reminder for yourself, or for a stream.',
        'Some examples include:',
        '- `' + mention + ' me on June 1st to wish Linda happy birthday`',
        '- `' + mention + ' me to stop procrastinating tomorrow`',
        '- `' + mention + ' here to update the project status in 3 hours`',
        '- `' + mention + ' stream to party hard on 2021-09-27 at 10pm`',
        '',
        'Use `' + mention + ' list` to see the list of all your reminders.',
        '',
        'Use `' + mention + ' delete id` to delete a reminder by its ID',
      ].join('\n')
    );
  };

  const remindNow = async (add: Remind) => {
    console.log('Reminding now', add);
    await send(z, add.dest, `Reminder: ${add.what}`);
  };

  setInterval(async () => {
    const add = await store.poll();
    if (add) await remindNow(add);
  }, 1000);

  await messageLoop(z, messageHandler);
})();
