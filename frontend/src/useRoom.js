import { useEffect, useRef, useState, useCallback } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

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
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);

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
        else if (msg.type === "error") setState({ error: msg.message });
      } catch (_) {}
    };
    ws.onclose = () => {
      setConnected(false);
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

  return { state, priv, connected, send };
}

export { BACKEND };
