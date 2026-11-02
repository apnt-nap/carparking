import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { WS_BASE, type BayChange, type FloorDetail } from './api';
import { getMode } from './dataSource';
import { localProvider } from './localProvider';

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

/**
 * Live bay changes for one floor, patched into the cached floor query.
 * Demo mode listens to the on-phone simulator; server mode uses WS /live and reconnects after drops.
 */
export function useLiveFloor(floorId: string) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const patch = (changes: BayChange[]) =>
      qc.setQueryData<FloorDetail>(['floor', floorId], (old) => (old ? applyChanges(old, changes) : old));
    let closed = false;

    if (getMode() === 'demo') {
      let off: (() => void) | undefined;
      localProvider().then((p) => {
        if (closed) return;
        off = p.onBayChanges(patch);
        setConnected(true);
      });
      return () => { closed = true; off?.(); };
    }

    let ws: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/live?floor=${encodeURIComponent(floorId)}`);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(String(e.data));
        if (msg.type === 'bay_changes') patch(msg.changes);
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
