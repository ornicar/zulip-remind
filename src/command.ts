import * as chrono from 'chrono-node';

export interface Command {
  action: 'list' | 'add';
}

export interface Add extends Command {
  action: 'add';
  dest: string;
  what: string;
  when: Date;
}

export interface List extends Command {
  action: 'list';
}

export const parseCommand = (cmd: string): Command => {
  const verb = cmd.split(' ')[0];
  if (verb == 'list') return { action: 'list' };
  else return parseAdd(cmd);
};

export const parseAdd = (cmd: string): Add => {
  const chronoed = chrono.parse(cmd)[0];
  const when = chronoed.date();
  const dateText = chronoed.text;
  const withoutDateText = cmd.replace(dateText, '');
  const match = withoutDateText.match(/^(here)\s(?:to\s)?(.+)$/);
  const dest = match[1];
  const what = cleanUpWhat(match[2]);
  return {
    action: 'add',
    dest,
    what,
    when,
  };
};

const cleanUpWhat = (what: string): string => what.replace(/\s?(at|in|on)\s?$/, '').trim();
