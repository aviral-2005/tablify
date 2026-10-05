import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = rawSocketUrl.replace(/\/+$/, '').replace(/\/api$/, '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export const joinRestaurantRoom = (restaurantId) => {
  const s = connectSocket();
  s.emit('join_restaurant', { restaurantId });
};

export const trackOrder = (orderId) => {
  const s = connectSocket();
  s.emit('track_order', { orderId });
};
