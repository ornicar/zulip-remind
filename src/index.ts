/* import fetch from 'node-fetch'; */
import * as zulipInit from 'zulip-js';
import { Zulip, ZulipMsg, messageLoop } from './zulip';
import { parseCommand, printAdd } from './command';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc' });

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    const command = parseCommand(msg.command);
    switch (command.verb) {
      case 'list':
        throw 'not implemented';
      case 'add':
        console.log(printAdd(command));
        /* store.insert(command); */
        await z.messages.send({
          to: msg.stream_id,
          type: 'stream',
          topic: msg.subject,
          content: printAdd(command),
        });
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
