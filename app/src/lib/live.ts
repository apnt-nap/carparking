import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { WS_BASE, type BayChange, type FloorDetail } from './api';

/** Apply live bay changes to a floor (FR-11). Returns the same object when nothing applies. */
export function applyChanges(floor: FloorDetail, changes: BayChange[]): FloorDetail {
  const byId = new Map(changes.filter((c) => c.floor_id === floor.id).map((c) => [c.bay_id, c]));
  if (byId.size === 0) return floor;
  return {
    ...floor,
    bays: floor.bays.map((b) => {
      const c = byId.get(b.id);
      return c ? { ...b, status: c.status, updated_at: c.updated_at } : b;
    }),
  };
}

/** Subscribes to WS /live for one floor and patches the cached floor query. Reconnects after drops. */
export function useLiveFloor(floorId: string) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let ws: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/live?floor=${encodeURIComponent(floorId)}`);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(String(e.data));
        if (msg.type !== 'bay_changes') return;
        qc.setQueryData<FloorDetail>(['floor', floorId], (old) => (old ? applyChanges(old, msg.changes) : old));
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [floorId, qc]);
  return connected;
}
