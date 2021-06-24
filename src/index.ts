import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop, reply, send, ZulipDestPrivate } from './zulip';
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
      }
    } catch {
      await reply(z, msg, 'Sorry, I could not parse that.');
    }
  };

  const remindNow = async (add: Remind) => {
    console.log('Reminding now', add);
    await send(z, add.dest, `Reminder: ${add.what}`);
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

  setInterval(async () => {
    const add = await store.poll();
    if (add) await remindNow(add);
  }, 1000);

  await messageLoop(z, messageHandler);
})();
