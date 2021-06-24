/* import fetch from 'node-fetch'; */
import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop, reply } from './zulip';
import { parseCommand, printAdd } from './command';
import { RedisStore } from './store';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc' });
  const store = new RedisStore();

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    const command = parseCommand(msg.command);
    switch (command.verb) {
      case 'list':
        throw 'not implemented';
      case 'add':
        console.log(printAdd(command));
        store.add(command);
        await reply(z, msg, printAdd(command));
    }
    return Promise.resolve();
  };

  /*   await z.messages.send({ */
  /*     to: 'bot', */
  /*     type: 'stream', */
  /*     subject: 'test', */
  /*     content: 'test msg', */
  /*   }); */

  await messageLoop(z, messageHandler);
})();
