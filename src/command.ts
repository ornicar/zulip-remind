import * as chrono from 'chrono-node';
import { ZulipDest, ZulipOrig } from './zulip';

export interface Add {
  verb: 'add';
  what: string;
  dest: ZulipDest;
  when: Date;
}

export interface List {
  verb: 'list';
}

type Command = List | Add;

export const parseCommand = (cmd: string, orig: ZulipOrig): Command => {
  const verb = cmd.split(' ')[0];
  if (verb == 'list') return { verb };
  else return parseAdd(cmd, orig);
};

export const parseAdd = (cmd: string, orig: ZulipOrig): Add => {
  const chronoed = chrono.parse(cmd)[0];
  const when = chronoed.date();
  const dateText = chronoed.text;
  const withoutDateText = cmd.replace(dateText, '');
  const match = withoutDateText.match(/^(here|me)\s(?:to\s)?(.+)$/);
  const dest = match[1];
  const what = cleanWhat(cleanWhat(match[2]));
  return {
    verb: 'add',
    dest:
      dest == 'me'
        ? {
            type: 'private',
            to: [orig.sender_id],
          }
        : {
            type: 'stream',
            to: orig.stream_id,
            topic: orig.subject,
          },
    what,
    when,
  };
};

export const printAdd = (add: Add) =>
  `I will remind ${printDest(add.dest)} to “${add.what}” on ${dateFormat.format(add.when)}`;
const printDest = (dest: ZulipDest) => (dest.type == 'stream' ? 'this stream' : 'you');

const cleanWhat = (what: string) =>
  what
    .trim()
    .replace(/\s?(at|in|on|to)\s?$/, '')
    .replace(/^\s?(at|in|on|to)\s?/, '');

const dateFormat = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});
