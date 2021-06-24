import { createNodeRedisClient } from 'handy-redis';
import { Add } from './command';

export interface Store {
  add: (add: Add) => Promise<void>;
  list: () => Promise<Add[]>;
  poll: () => Promise<Add | undefined>;
}

export class RedisStore implements Store {
  private client = createNodeRedisClient();
  private key = 'zulip-remind';

  add = async (add: Add) => {
    await this.client.zadd(this.key, [add.when.getTime(), JSON.stringify(add)]);
  };

  list = async () => {
    const entries = await this.client.zrange(this.key, 0, -1);
    return entries.map(this.read);
  };

  poll = async () => {
    const entry = (await this.client.zrange(this.key, 0, 0))[0];
    if (entry) {
      try {
        const r: Add = this.read(entry);
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

  private read = (entry: string): Add => {
    const r = JSON.parse(entry);
    r.when = new Date(r.when);
    return r;
  };
}
