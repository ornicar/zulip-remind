export interface Zulip {
  queues: any;
  events: any;
  users: any;
  messages: any;
}
export interface ZulipMsg {
  id: number;
  content: string;
  command: string;
  subject: string;
  stream_id: number;
}

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
