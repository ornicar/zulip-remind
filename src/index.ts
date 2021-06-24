/* import fetch from 'node-fetch'; */
import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop } from './zulip';
import parseCommand from './command';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc' });

  const messageHandler = (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    const command = parseCommand(msg.command);
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
