import { createNodeRedisClient } from 'handy-redis';
import { Add } from './command';

export interface Store {
  add: (add: Add) => Promise<void>;
  poll: () => Promise<Add | undefined>;
}

export class RedisStore implements Store {
  private client = createNodeRedisClient();
  private key = 'zulip-remind';

  add = async (add: Add) => {
    await this.client.zadd(this.key, [add.when.getTime(), JSON.stringify(add)]);
  };

  poll = async () => {
    const entry = (await this.client.zrange(this.key, 0, 0))[0];
    if (entry) {
      try {
        const add: Add = JSON.parse(entry);
        add.when = new Date(add.when);
        if (add.when < new Date()) {
          await this.client.zrem(this.key, entry);
          return add;
        }
      } catch {
        console.log('Discarding unreadable entry', entry);
        await this.client.zrem(this.key, entry);
      }
    }
  };
}
