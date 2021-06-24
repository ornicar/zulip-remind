/* import fetch from 'node-fetch'; */
import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop, reply, send } from './zulip';
import { Add, parseCommand, printAdd } from './command';
import { RedisStore } from './store';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc' });
  const store = new RedisStore();

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    try {
      const command = parseCommand(msg.command, msg);
      switch (command.verb) {
        case 'list':
          const all = await store.list();
          all.forEach(async r => await reply(z, msg, printAdd(r)));
          break;
        case 'add':
          console.log(printAdd(command));
          store.add(command);
          await reply(z, msg, printAdd(command));
      }
    } catch {
      await reply(z, msg, 'Sorry, I could not parse that.');
    }
  };

  const remindNow = async (add: Add) => {
    console.log('Reminding now', add);
    await send(z, add.dest, `Reminder: ${add.what}`);
  };

  setInterval(async () => {
    const add = await store.poll();
    if (add) await remindNow(add);
  }, 1000);

  await messageLoop(z, messageHandler);
})();
