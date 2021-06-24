export interface Zulip {
  queues: any;
  events: any;
}
export interface ZulipMsg {
  id: number;
  content: string;
}

export const messageLoop = async (zulip: Zulip, handler: (msg: ZulipMsg) => Promise<void>) => {
  const q = await zulip.queues.register({ event_types: ['message'] });
  let lastEventId = q.last_event_id;
  while (true) {
    const res = await zulip.events.retrieve({
      queue_id: q.queue_id,
      last_event_id: lastEventId,
    });
    res.events.forEach(async (event: any) => {
      lastEventId = event.id;
      if (event.type == 'heartbeat') console.log('Zulip heartbeat');
      else if (event.message) await handler(event.message as ZulipMsg);
      else console.log(event);
    });
  }
};
