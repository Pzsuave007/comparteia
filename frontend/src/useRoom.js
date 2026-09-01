import { useEffect, useRef, useState, useCallback } from "react";

// In the Emergent preview REACT_APP_BACKEND_URL is set. For a single-port
// self-hosted build leave it empty and the app talks to its own origin.
const BACKEND = process.env.REACT_APP_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "");

function wsUrl(code, role, pid) {
  const base = BACKEND.replace(/^http/, "ws");
  let url = `${base}/api/ws/${code}?role=${role}`;
  if (pid) url += `&pid=${pid}`;
  return url;
}

// Realtime room connection. Returns public state, private state (players only),
// a send() function and connection status.
export function useRoom(code, role, pid) {
  const [state, setState] = useState(null);
  const [priv, setPriv] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const deadRef = useRef(false);

  const connect = useCallback(() => {
    if (!code) return;
    const ws = new WebSocket(wsUrl(code, role, pid));
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "state") setState(msg.state);
        else if (msg.type === "private") setPriv(msg.private);
        else if (msg.type === "reaction") setReaction({ emoji: msg.emoji, name: msg.name, id: Date.now() + Math.random() });
        else if (msg.type === "error") { deadRef.current = true; setState({ error: msg.message }); try { ws.close(); } catch (_) {} }
      } catch (_) {}
    };
    ws.onclose = () => {
      setConnected(false);
      if (deadRef.current) return;
      retryRef.current = setTimeout(connect, 1500);
    };
    ws.onerror = () => { try { ws.close(); } catch (_) {} };
  }, [code, role, pid]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }, []);

  return { state, priv, connected, send, reaction };
}

export { BACKEND };
