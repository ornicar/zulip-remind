import { createNodeRedisClient } from 'handy-redis';
import { Remind } from './command';

export interface Store {
  add: (remind: Remind) => Promise<void>;
  list: () => Promise<Remind[]>;
  poll: () => Promise<Remind | undefined>; // deletes the Remind it returns
}

// Just one possible implementation.
export class RedisStore implements Store {
  private client = createNodeRedisClient();
  private key = 'zulip-remind';

  add = async (remind: Remind) => {
    await this.client.zadd(this.key, [remind.when.getTime(), JSON.stringify(remind)]);
  };

  list = async () => {
    const entries = await this.client.zrange(this.key, 0, -1);
    return entries.map(this.read);
  };

  poll = async () => {
    const entry = (await this.client.zrange(this.key, 0, 0))[0];
    if (entry) {
      try {
        const r: Remind = this.read(entry);
        if (r.when < new Date()) {
          await this.client.zrem(this.key, entry);
          return r;
        }
      } catch {
        console.log('Discarding unreadable entry', entry);
        await this.client.zrem(this.key, entry);
      }
    }
  };

  private read = (entry: string): Remind => {
    const r = JSON.parse(entry);
    r.when = new Date(r.when);
    return r;
  };
}
