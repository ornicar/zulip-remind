declare module 'zulip-js' {
  export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH';
  export interface Params {
    [key: string]: any;
    [key: number]: any;
  }

  export interface User {
    full_name: string;
    user_id: number;
  }

  export type Narrow = ['stream' | 'topic', string];

  export type Dest =
    | {
        type: 'private';
        to: [number];
      }
    | {
        type: 'stream';
        to: string | number;
        topic: string;
      };

  export interface Reaction {
    emoji_code: string;
    emoji_name: string;
    user_id: number;
  }

  export type Msg = {
    id: number;
    content: string;
    reactions: Reaction[];
    sender_id: number;
    sender_full_name: string;
    recipient_id: number;
    subject: string;
  } & (
    | {
        type: 'stream';
        stream_id: number;
      }
    | { type: 'private' }
  );

  interface BaseEvent {
    id: number;
  }
  export interface HeartbeatEvent extends BaseEvent {
    type: 'heartbeat';
  }
  export interface MsgEvent extends BaseEvent {
    type: 'message';
    message: Msg;
  }
  export interface ReactionEvent extends BaseEvent {
    type: 'reaction';
    op: 'add' | 'remove';
    emoji_code: string;
    emoji_name: string;
    user_id: number;
    message_id: number;
  }

  export type Event = HeartbeatEvent | MsgEvent | ReactionEvent;

  export interface Config {
    realm: string;
    username: string;
    password: string;
    apiURL: string;
    apiToken: string;
  }

  export interface ZuliprcConfig {
    zuliprc: string;
  }

  export interface ErrorResponse {
    code: string;
    msg: string;
    result: 'error';
  }
  export interface SuccessResponse {
    msg: string;
    result: 'success';
  }

  export type ApiResponse<T = {}> = Promise<(SuccessResponse & T) | ErrorResponse>;

  export interface ZulipClient {
    config: Config;
    callEndpoint: typeof callEndpoint;
    // accounts: AccountsClient;
    // streams: StreamsClient;
    messages: {
      send(
        params: Dest & {
          content: string;
        }
      ): ApiResponse<{ id: number }>;
      retrieve(params: {
        anchor?: number | 'newest' | 'oldest' | 'first_unread';
        num_before: number;
        num_after: number;
        apply_markdown?: boolean;
      }): ApiResponse<{ found_anchor: boolean; messages: Msg[] }>;
    };
    queues: {
      register(params: {
        event_types: string[];
        narrow?: Narrow[];
      }): ApiResponse<{ last_event_id: number; queue_id: string }>;
    };
    events: {
      retrieve(params: {
        queue_id: string;
        last_event_id?: number;
      }): ApiResponse<{ events: Event[]; queue_id: string }>;
    };
    users: {
      me: {
        getProfile(): ApiResponse<User>;
      };
    };
    // emojis: EmojisClient;
    // typing: TypingClient;
    reactions: {
      add(params: { message_id: number; emoji_name: string }): ApiResponse;
      remove(params: { message_id: number; emoji_name: string }): ApiResponse;
    };
    // server: ServerClient;
    // filters: FiltersClient;
  }

  export type InitialConfig = ZuliprcConfig | Pick<Config, 'realm'>;

  export function callEndpoint(endpoint: string, method: HttpMethod, params: Params): Promise<unknown>;

  export default function zulip(initialConfig: Partial<InitialConfig>): Promise<ZulipClient>;
}
