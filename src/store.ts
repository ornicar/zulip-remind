import { createNodeRedisClient } from 'handy-redis';
import { Add } from './command';

export interface Store {
  add: (add: Add) => Promise<void>;
}

export class RedisStore implements Store {
  private client = createNodeRedisClient();
  private key = 'zulip-remind';

  add = async (add: Add) => {
    await this.client.zadd(this.key, [add.when.getTime(), JSON.stringify(add)]);
  };
}
