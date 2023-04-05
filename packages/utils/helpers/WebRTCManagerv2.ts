import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

import {
  Ad4mClient,
  PerspectiveProxy,
  Agent,
  Literal,
  NeighbourhoodProxy,
  PerspectiveExpression,
} from "@perspect3vism/ad4m";

import { AD4MPeer, AD4MPeerInstance } from "./ad4mPeer";

const rtcConfig = {
  iceServers: [
    {
      urls: "stun:relay.ad4m.dev:3478",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:relay.ad4m.dev:443",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
  iceCandidatePoolSize: 10,
};

async function getLinkFromPerspective(expression: PerspectiveExpression) {
  try {
    return expression.data.links[0];
  } catch (e) {
    return null;
  }
}

export const JOIN = "join";
export const JOIN_ACCEPTED = "join-accepted";
export const LEAVE = "leave";
export const HEARTBEAT = "heartbeat";
export const TEST_SIGNAL = "test-signal";
export const TEST_BROADCAST = "test-broadcast";

export type EventLogItem = {
  timeStamp: string;
  type: string;
  value?: string;
};

export type Connection = {
  peer: AD4MPeerInstance;
  eventLog: EventLogItem[];
};

export type Settings = {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
  screen: boolean;
};

export type Props = {
  uuid: string;
  source: string;
};

export enum Event {
  PEER_ADDED = "peer-added",
  PEER_REMOVED = "peer-removed",
  CONNECTION_STATE = "connectionstate",
  CONNECTION_STATE_DATA = "connectionstateData",
  MESSAGE = "message",
  EVENT = "event",
}

export default class WebRTCManager {
  private addedListener: boolean = false;
  private isListening: boolean = false;
  private agent: Agent;
  private client: Ad4mClient;
  private perspective: PerspectiveProxy;
  private neighbourhood: NeighbourhoodProxy;
  private source: string;
  private heartbeatId: NodeJS.Timeout;
  private callbacks: Record<Event, Array<(...args: any[]) => void>> = {
    [Event.PEER_ADDED]: [],
    [Event.PEER_REMOVED]: [],
    [Event.MESSAGE]: [],
    [Event.EVENT]: [],
    [Event.CONNECTION_STATE]: [],
    [Event.CONNECTION_STATE_DATA]: [],
  };

  localStream: MediaStream;
  localEventLog: EventLogItem[];
  connections = new Map<string, Connection>();

  constructor(props: Props) {
    this.init(props);
  }

  async init(props: Props) {
    console.log("init constructor");
    this.localStream = new MediaStream();
    this.localEventLog = [];
    this.source = props.source;
    this.client = await getAd4mClient();
    this.agent = await this.client.agent.me();
    this.perspective = await this.client.perspective.byUUID(props.uuid);
    this.neighbourhood = new NeighbourhoodProxy(
      this.client.neighbourhood,
      this.perspective.uuid
    );
    this.emitPeerEvents();

    // Bind methods
    this.on = this.on.bind(this);
    this.join = this.join.bind(this);
    this.onBroadcastReceived = this.onBroadcastReceived.bind(this);
    this.emitPeerEvents = this.emitPeerEvents.bind(this);
    this.closeConnection = this.closeConnection.bind(this);
    this.addConnection = this.addConnection.bind(this);

    this.sendMessage = this.sendMessage.bind(this);
    this.sendTestSignal = this.sendTestSignal.bind(this);
    this.sendTestBroadcast = this.sendTestBroadcast.bind(this);
    this.addToEventLog = this.addToEventLog.bind(this);
    this.heartbeat = this.heartbeat.bind(this);
    this.leave = this.leave.bind(this);

    // Close connections if we refresh
    window.addEventListener("beforeunload", () => {
      this.leave();
    });
  }

  emitPeerEvents() {
    const that = this;

    this.connections.set = function (key: string, value: Connection) {
      console.log(`✅ Added key: ${key} value: ${value} to the map`);

      that.callbacks[Event.PEER_ADDED].forEach((cb) => {
        cb(key, value);
      });

      return Reflect.apply(Map.prototype.set, this, arguments);
    };

    // Listen for deletions from the map
    this.connections.delete = function (key: string) {
      console.log(`🚫 Deleted key: ${key} from the map`);

      that.callbacks[Event.PEER_REMOVED].forEach((cb) => {
        cb(key);
      });

      return Reflect.apply(Map.prototype.delete, this, arguments);
    };
  }

  on(event: Event, cb: any) {
    this.callbacks[event].push(cb);
  }

  /**
   * Handle incoming signals
   */
  async onBroadcastReceived(expression: PerspectiveExpression) {
    if (!this.isListening) return;

    if (expression.author === this.agent.did) {
      console.log("Received signal from self, ignoring!");
      return null;
    }

    const link = await getLinkFromPerspective(expression);
    console.log(`🔵 ${link?.data?.predicate}`, {
      link,
      author: expression.author,
    });

    if (!link) {
      this.addToEventLog(
        expression.author,
        link?.data?.predicate || "unknown",
        "Missing link!"
      );
      return;
    }

    // if (link.source !== this.agent.did) {
    //   console.log("Signal not adressed to current peer, ignoring");
    //   return null;
    // }

    if (link.data.predicate === JOIN && link.data.source === this.source) {
      this.addConnection(link.author, true);
    }

    if (
      link.data.predicate === JOIN_ACCEPTED &&
      link.data.source === this.source
    ) {
      this.addConnection(link.author, false);
    }

    if (link.data.predicate === LEAVE && link.data.source === this.source) {
      this.closeConnection(link.author);
    }

    return null;
  }

  /**
   * Create connection and add to connections array
   */
  async addConnection(remoteDid: string, initiator: boolean) {
    if (this.connections.get(remoteDid)) {
      return this.connections.get(remoteDid);
    }

    if (initiator) {
      this.neighbourhood.sendBroadcastU({
        links: [
          {
            source: this.source,
            predicate: JOIN_ACCEPTED,
            target: this.agent.did,
          },
        ],
      });
    }

    const ad4mPeer = new AD4MPeer({
      client: this.client,
      uuid: this.perspective.uuid,
      source: this.source,
    });

    const peer = await ad4mPeer.connect(remoteDid, initiator);

    const newConnection = {
      peer,
      eventLog: [],
    };

    this.connections.set(remoteDid, newConnection);

    return newConnection;
  }

  /**
   * Send message via datachannel
   */
  async sendMessage(type: string, message: any, recepients?: string[]) {
    const data = JSON.stringify({
      type,
      message,
    });
    this.connections.forEach((e, key) => {
      if (!recepients || recepients.includes(key)) {
        // if (e.dataChannel.readyState === "open") {
        //   e.dataChannel.send(data);
        // } else {
        //   console.log(
        //     `Couldn't send message to ${key} as connection is not open -> `,
        //     type,
        //     message
        //   );
        // }
      }
    });

    // Notify self of message
    this.callbacks[Event.MESSAGE].forEach((cb) => {
      cb(this.agent.did, type || "unknown", message);
    });
  }

  /**
   * Close connection/datachannel and remove from connections array
   */
  closeConnection(did: string) {
    const connection = this.connections.get(did);

    if (connection) {
      // connection.peer.close();
      this.connections.delete(did);
    }
  }

  /**
   * Add event to peer log
   */
  async addToEventLog(did: string, type: string, value?: string) {
    const event = {
      type,
      value,
      timeStamp: new Date().toISOString(),
    };

    // Check if this is a local event
    if (did === this.agent.did) {
      this.callbacks[Event.EVENT].forEach((cb) => {
        cb(this.agent.did, event);
      });

      this.localEventLog.push(event);
      return;
    }

    const connection = this.connections.get(did);
    if (!connection) {
      console.log("🔴 Failed to add log entry, no connection found!");
      return;
    }

    connection.eventLog.push(event);
  }

  /**
   * Join the chat room, listen for signals and begin heartbeat
   */
  async join(initialSettings?: Settings) {
    console.log("Start joining");

    let settings = { audio: true, video: false, ...initialSettings };

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: settings.audio,
      video: settings.video,
    });

    if (!this.addedListener) {
      await this.neighbourhood.addSignalHandler(this.onBroadcastReceived);
      this.addedListener = true;
    }

    this.isListening = true;

    console.log("🟠 Sending JOIN broadcast");

    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.source,
          predicate: JOIN,
          target: this.agent.did,
        },
      ],
    });

    // this.heartbeatId = setInterval(this.heartbeat, 10000);

    return this.localStream;
  }

  /**
   * Leave the room and close all connections
   */
  async leave() {
    this.isListening = false;

    // Stop heartbeat
    clearInterval(this.heartbeatId);

    if (this.perspective) {
      // Todo: Nico, nico, nico!
      // this.neighbourhood.
    }

    // Announce departure
    this.addToEventLog(this.agent.did, LEAVE);
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.source,
          predicate: LEAVE,
          target: "goodbye!", // could be empty
        },
      ],
    });

    // Close webrtc connections
    this.connections.forEach((c, key) => {
      this.closeConnection(key);
    });

    // Kill media recording
    this.localStream.getTracks().forEach((track) => track.stop());
  }

  async heartbeat() {
    console.log("💚 Sending HEARTBEAT");
    this.addToEventLog(this.agent.did, HEARTBEAT);

    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.source,
          predicate: HEARTBEAT,
          target: this.agent.did,
        },
      ],
    });
  }

  async sendTestSignal(recipientDid: string) {
    console.log("⚙️ Sending TEST_SIGNAL to ", recipientDid);
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.source,
          predicate: TEST_SIGNAL,
          target: recipientDid,
        },
      ],
    });
  }

  async sendTestBroadcast() {
    console.log("⚙️ Sending TEST_BROADCAST to room");
    this.neighbourhood.sendBroadcastU({
      links: [
        {
          source: this.source,
          predicate: TEST_BROADCAST,
          target: Literal.from("test broadcast").toUrl(),
        },
      ],
    });
  }
}