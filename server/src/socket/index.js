export const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Kitchen/Admin joins restaurant room
    socket.on('join_restaurant', ({ restaurantId }) => {
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`Socket ${socket.id} joined restaurant:${restaurantId}`);
      }
    });

    // Customer joins specific order room for status tracking
    socket.on('track_order', ({ orderId }) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`Socket ${socket.id} tracking order:${orderId}`);
      }
    });

    socket.on('leave_restaurant', ({ restaurantId }) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
