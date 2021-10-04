import * as chrono from 'chrono-node';
import { GetTimezone, printDest, UserId, ZulipDest, ZulipOrig } from './zulip';
import { findTimeZone, getUTCOffset } from 'timezone-support';
import { printDate } from './util';

export type RemindId = number;

export interface Remind {
  verb: 'remind';
  what: string;
  dest: ZulipDest;
  when: Date;
  from: UserId;
  id?: RemindId; // auto-increment, set by the store
}

export interface List {
  verb: 'list';
}

export interface Delete {
  verb: 'delete';
  id: RemindId;
  force: boolean;
}

export interface Help {
  verb: 'help';
}

type Command = Remind | List | Delete | Help;

export const parseCommand = async (cmd: string, orig: ZulipOrig, getTimezone: GetTimezone): Promise<Command> => {
  cmd = cmd.trim();
  const verb = cmd.split(' ')[0];
  if (verb == 'list') return { verb };
  if (verb == 'help' || verb == 'halp' || verb == 'h') return { verb: 'help' };
  if (verb == 'delete' || verb == 'del' || verb == 'remove') return parseDelete(cmd);
  else return await parseRemind(cmd, orig, getTimezone);
};

const parseRemind = async (cmd: string, orig: ZulipOrig, getTimezone: GetTimezone): Promise<Remind> => {
  const timezone = await getTimezone(orig.sender_id);
  const chronoedAll = chrono.parse(
    cmd,
    {
      instant: new Date(),
      timezone: getUTCOffset(new Date(), findTimeZone(timezone)).abbreviation,
    },
    {
      forwardDate: true,
    }
  );
  if (chronoedAll[1]) console.log(`Found multiple dates in ${cmd}`, chronoedAll);
  const chronoed = chronoedAll[0];
  const when = chronoed.date();
  const dateText = chronoed.text;
  const withoutDateText = cmd.replace(dateText, '');
  const match = withoutDateText.match(/^(here|stream|me)\s(?:to\s)?(.+)$/);
  const dest = match[1];
  const what = cleanWhat(cleanWhat(match[2]));
  return {
    verb: 'remind',
    dest:
      dest == 'me' || orig.type == 'private'
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
    from: orig.sender_id,
  };
};

const parseDelete = (cmd: string): Delete => {
  const id = parseInt(cmd.split(' ')[1]);
  const force = cmd.split(' ')[2] == 'force';
  if (!id || id < 1) throw `Invalid delete id $id.`;
  return { verb: 'delete', id, force };
};

export const printRemind = (remind: Remind) =>
  `\`${remind.id}\` I will remind ${printDest(remind.dest)} to \`${remind.what}\` on ${printDate(remind.when)}`;

const cleanWhat = (what: string) =>
  what
    .trim()
    .replace(/\s(at|in|on|to)\s?$/, '')
    .replace(/^\s?(at|in|on|to)\s/, '');
