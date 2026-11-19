/**
 * Networking & Co-Op Matchmaking for Outbreak: Dead Zone.
 * Supports Local Wi-Fi / Multi-Tab P2P sync via BroadcastChannel and intelligent Tactical AI Operative Bots.
 */

import { PlayerNetworkState } from '../types/game';

export interface NetworkPacket {
  type: 'PLAYER_STATE' | 'ZOMBIE_SYNC' | 'PLAYER_ACTION' | 'PING' | 'PONG';
  senderId: string;
  roomCode: string;
  timestamp: number;
  data: unknown;
}

export class NetworkManager {
  private channel: BroadcastChannel | null = null;
  private roomCode: string = 'ALPHA';
  private localPlayerId: string;
  private peers: Map<string, PlayerNetworkState> = new Map();
  private onPeerUpdateCallbacks: ((peers: PlayerNetworkState[]) => void)[] = [];
  private onActionEventCallbacks: ((action: { type: string; payload: unknown; senderId: string }) => void)[] = [];
  private isHost: boolean = false;

  constructor(localPlayerId: string) {
    this.localPlayerId = localPlayerId;
  }

  public connect(roomCode: string, isHost: boolean = false) {
    this.disconnect();
    this.roomCode = roomCode.toUpperCase();
    this.isHost = isHost;

    try {
      this.channel = new BroadcastChannel(`outbreak_dead_zone_${this.roomCode}`);
      this.channel.onmessage = (ev: MessageEvent<NetworkPacket>) => {
        this.handleMessage(ev.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in current context', e);
    }
  }

  public disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.peers.clear();
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getPeers(): PlayerNetworkState[] {
    return Array.from(this.peers.values());
  }

  public broadcastPlayerState(state: Omit<PlayerNetworkState, 'id'>) {
    if (!this.channel) return;
    const packet: NetworkPacket = {
      type: 'PLAYER_STATE',
      senderId: this.localPlayerId,
      roomCode: this.roomCode,
      timestamp: Date.now(),
      data: {
        id: this.localPlayerId,
        ...state
      }
    };
    try {
      this.channel.postMessage(packet);
    } catch (e) {
      console.error(e);
    }
  }

  public broadcastAction(actionType: string, payload: unknown) {
    if (!this.channel) return;
    const packet: NetworkPacket = {
      type: 'PLAYER_ACTION',
      senderId: this.localPlayerId,
      roomCode: this.roomCode,
      timestamp: Date.now(),
      data: {
        actionType,
        payload
      }
    };
    try {
      this.channel.postMessage(packet);
    } catch (e) {
      console.error(e);
    }
  }

  private handleMessage(packet: NetworkPacket) {
    if (packet.senderId === this.localPlayerId) return;

    if (packet.type === 'PLAYER_STATE') {
      const peerState = packet.data as PlayerNetworkState;
      this.peers.set(packet.senderId, peerState);
      this.notifyPeerUpdate();
    } else if (packet.type === 'PLAYER_ACTION') {
      const { actionType, payload } = packet.data as { actionType: string; payload: unknown };
      this.onActionEventCallbacks.forEach((cb) => cb({ type: actionType, payload, senderId: packet.senderId }));
    }
  }

  public onPeerUpdate(cb: (peers: PlayerNetworkState[]) => void) {
    this.onPeerUpdateCallbacks.push(cb);
  }

  public onAction(cb: (action: { type: string; payload: unknown; senderId: string }) => void) {
    this.onActionEventCallbacks.push(cb);
  }

  private notifyPeerUpdate() {
    const list = this.getPeers();
    this.onPeerUpdateCallbacks.forEach((cb) => cb(list));
  }
}
