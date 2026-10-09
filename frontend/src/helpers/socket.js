// helpers/socket.js — one shared Socket.io connection for live updates.
//
// Connects to the same origin as the app (Nginx proxies /socket.io/ to the
// backend), authenticated with the same JWT as the REST API. Socket.io tries
// WebSocket first and falls back to HTTP long-polling on its own if the
// network blocks WebSockets.
import { io } from 'socket.io-client';

let socket = null;
let socketToken = null;

export function getSocket() {
  const token = localStorage.getItem('tf_token');
  if (!token) return null;

  // Re-create the connection if the user logged in as someone else.
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socketToken = token;
    socket = io({
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}