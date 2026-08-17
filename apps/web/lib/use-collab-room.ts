'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { auth } from './firebase';

// Deliberately a separate connection from socket.ts's socketService — that
// one auto-joins a user:/tenant: room at connect() for notifications and
// stays open for the whole app session. A collab room is scoped to one
// page, joins a specific room:<id> via collab.join (or automatically via a
// candidate's signed collabToken — see app/services/collab_auth.py), and
// disconnects when the page unmounts. Different auth shape too: a
// candidate has no Firebase login, so it authenticates with `collabToken`
// instead of `token`.
const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// How often the local Yjs doc's full state is pushed as a snapshot for
// persistence — mirrors the ~5-10s debounce app/models/editor_document.py's
// docstring documents on the backend side (that module writes whatever
// bytes it's given; this is the client-side cadence that decides when).
const SNAPSHOT_INTERVAL_MS = 8000;

interface UseCollabRoomOptions {
  roomId: string | null;
  role?: 'interviewer' | 'observer';
  collabToken?: string;
}

interface UseCollabRoomResult {
  ydoc: Y.Doc;
  connected: boolean;
  error: string | null;
}

function applyIncomingBytes(ydoc: Y.Doc, bytes: unknown) {
  if (Array.isArray(bytes)) {
    Y.applyUpdate(ydoc, new Uint8Array(bytes), 'remote');
  }
}

export function useCollabRoom({ roomId, role, collabToken }: UseCollabRoomOptions): UseCollabRoomResult {
  const ydocRef = useRef<Y.Doc>();
  if (!ydocRef.current) ydocRef.current = new Y.Doc();
  const ydoc = ydocRef.current;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId && !collabToken) return;
    let cancelled = false;
    let socket: Socket | null = null;

    const onLocalUpdate = (update: Uint8Array, origin: unknown) => {
      // Skip re-broadcasting updates that were just applied FROM a remote
      // peer (tagged 'remote' above) — otherwise every incoming update
      // would echo straight back out.
      if (origin === 'remote' || !socket?.connected) return;
      socket.emit('collab.editor_update', { update: Array.from(update) });
    };
    ydoc.on('update', onLocalUpdate);

    (async () => {
      const authPayload: Record<string, string> = {};
      if (collabToken) {
        authPayload.collabToken = collabToken;
      } else {
        const token = await auth.currentUser?.getIdToken().catch(() => undefined);
        if (token) authPayload.token = token;
      }
      if (cancelled) return;

      socket = io(WS_URL, {
        auth: authPayload,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        if (cancelled || !socket) return;
        if (collabToken) {
          // Candidate connections join their room automatically at
          // connect() server-side and get the current snapshot pushed via
          // a targeted collab.snapshot emit — nothing to request here.
          setConnected(true);
          return;
        }
        socket.emit(
          'collab.join',
          { roomId, role: role ?? 'interviewer' },
          (ack: { error?: string; snapshot?: number[] | null }) => {
            if (cancelled) return;
            if (ack?.error) {
              setError(ack.error);
              return;
            }
            if (ack?.snapshot) Y.applyUpdate(ydoc, new Uint8Array(ack.snapshot), 'remote');
            setConnected(true);
          },
        );
      });

      socket.on('collab.snapshot', (data: { snapshot?: number[] }) => applyIncomingBytes(ydoc, data?.snapshot));
      socket.on('collab.editor_update', (data: { update?: number[] }) => applyIncomingBytes(ydoc, data?.update));
      socket.on('disconnect', () => {
        if (!cancelled) setConnected(false);
      });
      socket.on('connect_error', (err: Error) => {
        if (!cancelled) setError(err.message);
      });
    })();

    const snapshotTimer = setInterval(() => {
      if (socket?.connected) {
        socket.emit('collab.snapshot', { snapshot: Array.from(Y.encodeStateAsUpdate(ydoc)) });
      }
    }, SNAPSHOT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(snapshotTimer);
      ydoc.off('update', onLocalUpdate);
      if (socket) {
        if (socket.connected) {
          socket.emit('collab.snapshot', { snapshot: Array.from(Y.encodeStateAsUpdate(ydoc)) });
        }
        socket.disconnect();
      }
    };
  }, [roomId, role, collabToken, ydoc]);

  return { ydoc, connected, error };
}
