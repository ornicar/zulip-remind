import * as chrono from 'chrono-node';

export interface Add {
  verb: 'add';
  dest: string;
  what: string;
  when: Date;
}

export interface List {
  verb: 'list';
}

type Command = List | Add;

export const parseCommand = (cmd: string): Command => {
  const verb = cmd.split(' ')[0];
  if (verb == 'list') return { verb };
  else return parseAdd(cmd);
};

export const parseAdd = (cmd: string): Add => {
  const chronoed = chrono.parse(cmd)[0];
  const when = chronoed.date();
  const dateText = chronoed.text;
  const withoutDateText = cmd.replace(dateText, '');
  const match = withoutDateText.match(/^(here)\s(?:to\s)?(.+)$/);
  const dest = match[1];
  const what = match[2].replace(/\s?(at|in|on)\s?$/, '').trim();
  return {
    verb: 'add',
    dest,
    what,
    when,
  };
};

export const printAdd = (add: Add) => `I will remind ${add.dest} to “${add.what}” on ${dateFormat.format(add.when)}`;

const dateFormat = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});
