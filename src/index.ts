import zulipInit, { type Msg } from 'zulip-js';
import { messageLoop, reply, send, react, getDestFromMsgId, botName, userTimezone, printDest } from './zulip';
import { Remind, parseCommand, printRemind, Delete } from './command';
import { RedisStore, Store } from './store';
import { markdownTable, printDate, sleep } from './util';

(async () => {
  const z = await zulipInit({ zuliprc: 'zuliprc' });
  const store: Store = new RedisStore();

  const messageHandler = async (msg: Msg, cmd: string) => {
    console.log(`Command: ${cmd}`);
    try {
      const command = await parseCommand(cmd, msg, userTimezone(z));
      switch (command.verb) {
        case 'list':
          await listReminders(msg);
          break;
        case 'remind':
          await addReminder(msg, command);
          break;
        case 'delete':
          await deleteReminder(msg, command);
          break;
        case 'help':
          await help(msg);
          break;
      }
    } catch (err) {
      console.error(err);
      await react(z, msg, 'cross_mark');
      /* await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?'); */
    }
  };

  const addReminder = async (msg: Msg, remind: Remind) => {
    remind.id = await store.add(remind);
    console.log(printRemind(remind));
    await reply(z, msg, `:check_mark: ${printRemind(remind)}`);
  };

  const listReminders = async (msg: Msg) => {
    const all = await store.list();

    const printTable = (title: string, rs: Remind[]) =>
      rs.length
        ? markdownTable([
            ['ID', 'Date', title, 'Topic'],
            ...rs.map(r => ['' + r.id, printDate(r.when), r.what, printDest(r.dest)]),
          ])
        : 'No upcoming reminders here.';

    if (msg.type == 'stream')
      await reply(
        z,
        msg,
        printTable(
          'Public reminders in this stream',
          all.filter(r => r.dest.type == 'stream' && r.dest.to == msg.stream_id)
        )
      );

    const privateReminders = all.filter(r => r.dest.type == 'private' && r.from == msg.sender_id);
    if (privateReminders.length || msg.type == 'private') {
      await send(z, { type: 'private', to: [msg.sender_id] }, printTable('Your private reminders', privateReminders));
    }
  };

  const deleteReminder = async (msg: Msg, command: Delete) => {
    const entry = await store.delete(command.id, !command.force && msg.sender_id);
    if (entry) await reply(z, msg, `:check_mark: Deleted: ${printRemind(entry)}`);
    else await react(z, msg, 'cross_mark');
  };

  const help = async (msg: Msg) => {
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
        '- `' + mention + ' here in 3 hours to update the project status`',
        '- `' + mention + ' stream to party hard on 2021-09-27 at 10pm`',
        '',
        'Use `' + mention + ' list` to see the list of all your reminders.',
        '',
        'Use `' + mention + ' delete id` to delete a reminder by its ID',
        'Use `' + mention + ' delete id force` to delete a reminder that you did not create',
      ].join('\n')
    );
  };

  const remindNow = async (add: Remind) => {
    console.log('Reminding now', add);
    const dest = add.dest.type == 'stream' ? (await getDestFromMsgId(z, add.orig_msg_id)) ?? add.dest : add.dest;
    await send(z, dest, `Reminder: ${add.what}`);
  };

  setInterval(async () => {
    const add = await store.poll();
    if (add) await remindNow(add);
  }, 1000);

  while (true) {
    await messageLoop(z, messageHandler);
    await sleep(10_000);
  }
})();
