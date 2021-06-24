import { createNodeRedisClient } from 'handy-redis';
import { Remind } from './command';

export interface Store {
  add: (remind: Remind) => Promise<void>; // sets a unique id field on the Remind
  list: () => Promise<Remind[]>;
  poll: () => Promise<Remind | undefined>; // deletes the Remind it returns
}

// Just one possible implementation.
export class RedisStore implements Store {
  private client = createNodeRedisClient();
  private prefix = 'zulip-remind';
  private setKey = `${this.prefix}-set`;
  private incKey = `${this.prefix}-key`;

  add = async (remind: Remind) => {
    remind.id = await this.client.incr(this.incKey);
    await this.client.zadd(this.setKey, [remind.when.getTime(), JSON.stringify(remind)]);
  };

  list = async () => {
    const entries = await this.client.zrange(this.setKey, 0, -1);
    return entries.map(this.read);
  };

  poll = async () => {
    const entry = (await this.client.zrange(this.setKey, 0, 0))[0];
    if (entry) {
      try {
        const r: Remind = this.read(entry);
        if (r.when < new Date()) {
          await this.client.zrem(this.setKey, entry);
          return r;
        }
      } catch {
        console.log('Discarding unreadable entry', entry);
        await this.client.zrem(this.setKey, entry);
      }
    }
  };

  private read = (entry: string): Remind => {
    const r = JSON.parse(entry);
    r.when = new Date(r.when);
    return r;
  };
}
