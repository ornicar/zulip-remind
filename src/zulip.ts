import { TextDecoder } from 'util';

export interface Zulip {
  queues: any;
  events: any;
  users: any;
  messages: any;
}

export interface ZulipOrig {
  sender_id: number;
  stream_id: number;
  subject: string;
}

export interface ZulipMsg extends ZulipOrig {
  id: number;
  content: string;
  command: string;
}

export interface ZulipDestStream {
  type: 'stream';
  to: number;
  topic: string;
}

export interface ZulipDestPrivate {
  type: 'private';
  to: [number];
}

export type ZulipDest = ZulipDestStream | ZulipDestPrivate;

export const messageLoop = async (zulip: Zulip, handler: (msg: ZulipMsg) => Promise<void>) => {
  const q = await zulip.queues.register({ event_types: ['message'] });
  const me = await zulip.users.me.getProfile();
  let lastEventId = q.last_event_id;
  while (true) {
    const res = await zulip.events.retrieve({
      queue_id: q.queue_id,
      last_event_id: lastEventId,
    });
    res.events.forEach(async (event: any) => {
      lastEventId = event.id;
      if (event.type == 'heartbeat') console.log('Zulip heartbeat');
      else if (event.message) {
        event.message.command = event.message.content.replace(`@**${me.full_name}**`, '').trim();
        await handler(event.message as ZulipMsg);
      } else console.log(event);
    });
  }
};

export const reply = async (zulip: Zulip, to: ZulipMsg, text: string) =>
  await zulip.messages.send({
    to: to.stream_id,
    type: 'stream',
    topic: to.subject,
    content: text,
  });

export const send = async (zulip: Zulip, dest: ZulipDest, text: string) => {
  await zulip.messages.send({
    ...dest,
    content: text,
  });
};
