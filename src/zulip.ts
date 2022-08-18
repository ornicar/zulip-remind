/// <reference path="zulip-js.d.ts"/>

import type { ApiResponse, Msg, ZulipClient } from 'zulip-js';
import { sleep } from './util';

export type UserId = number;

export interface ZulipOrigStream {
  type: 'stream';
  sender_id: UserId;
  stream_id: number;
  subject: string;
}

export interface ZulipOrigPrivate {
  type: 'private';
  sender_id: UserId;
  recipient_id: UserId;
}

export type ZulipOrig = ZulipOrigStream | ZulipOrigPrivate;

export interface ZulipDestStream {
  type: 'stream';
  to: number | string;
  topic: string;
}

export interface ZulipDestPrivate {
  type: 'private';
  to: [UserId];
}

export type ZulipDest = ZulipDestStream | ZulipDestPrivate;

export type GetTimezone = (userId: UserId) => Promise<string>;

export const messageLoop = async (zulip: ZulipClient, handler: (msg: Msg, cmd: string) => Promise<void>) => {
  const q = await assertSuccess(zulip.queues.register({ event_types: ['message'] }));
  const me = await assertSuccess(zulip.users.me.getProfile());
  let lastEventId = q.last_event_id;
  console.log(`Connected to zulip as @${me.full_name}, awaiting commands`);
  await send(zulip, { type: 'stream', to: 'zulip', topic: 'bots log' }, 'I started.');
  while (true) {
    try {
      const res = await zulip.events.retrieve({
        queue_id: q.queue_id,
        last_event_id: lastEventId,
      });
      if (res.result !== 'success') {
        console.error(`Got error response on events.retrieve: ${JSON.stringify(res)}`);
        await sleep(2000);
        continue;
      }
      res.events.forEach(async event => {
        lastEventId = event.id;
        switch (event.type) {
          case 'heartbeat':
            //console.log('Zulip heartbeat');
            break;
          case 'message':
            // ignore own messages
            if (event.message.sender_id != me.user_id) {
              const parts = event.message.content.trim().split(' ');
              // require explicit ping
              if (parts[0] == `@**${me.full_name}**`) {
                await handler(event.message, parts.slice(1).join(' '));
              }
            }
            break;
          default:
            console.log(event);
        }
      });
    } catch (e) {
      console.error(e);
      await sleep(2000);
    }
  }
};

const assertSuccess = async <T>(response: ApiResponse<T>): Promise<T> => {
  const resp = await response;
  if (resp.result !== 'success') throw new Error(`Got error response: ${JSON.stringify(resp)}`);
  return resp;
};

export const botName = async (zulip: ZulipClient): Promise<string> => {
  const me = await assertSuccess(zulip.users.me.getProfile());
  return me.full_name;
};

export const userTimezone =
  (zulip: ZulipClient) =>
  async (userId: UserId): Promise<string> => {
    const res: any = await zulip.callEndpoint(`/users/${userId}`, 'GET', {});
    return res.user.timezone || 'UTC';
  };

const origToDest = (orig: ZulipOrig): ZulipDest => {
  return orig.type == 'stream'
    ? {
        type: 'stream',
        to: orig.stream_id,
        topic: orig.subject,
      }
    : {
        type: 'private',
        to: [orig.sender_id],
      };
};

export const getDestFromMsgId = async (zulip: ZulipClient, msg_id: number): Promise<ZulipDest | undefined> => {
  try {
    const msgs = await zulip.messages.retrieve({
      anchor: msg_id,
      num_before: 0,
      num_after: 0,
      apply_markdown: false,
    });
    if (msgs.result === 'success' && msgs.found_anchor && msgs.messages.length > 0) return origToDest(msgs.messages[0]);
  } catch (e) {
    console.error(e);
  }
};

export const send = async (zulip: ZulipClient, dest: ZulipDest, text: string) => {
  await zulip.messages.send({
    ...dest,
    content: text,
  });
};

export const reply = async (zulip: ZulipClient, to: Msg, text: string) => await send(zulip, origToDest(to), text);

export const react = async (zulip: ZulipClient, to: Msg, emoji: string) =>
  await zulip.reactions.add({
    message_id: to.id,
    emoji_name: emoji,
  });

export const printDest = (dest: ZulipDest) => (dest.type == 'stream' ? `\`${dest.topic}\`` : 'you');
