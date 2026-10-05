import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, loadUserRestaurant } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);
router.use(loadUserRestaurant);

// GET /api/kitchen/orders — Get active orders
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: req.restaurant.id,
        status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: { select: { tableNumber: true, displayName: true } },
        items: true,
      },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

const validTransitions = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// PATCH /api/kitchen/orders/:id/status
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
    }).parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
      include: { table: { select: { tableNumber: true } } },
    });

    if (!order) return next(new AppError('Order not found', 404));

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { table: true, items: true },
    });

    // Emit status update to restaurant room AND to the specific order room
    req.io.to(`restaurant:${req.restaurant.id}`).emit('order_status_updated', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table.tableNumber,
    });

    req.io.to(`order:${updated.id}`).emit('order_status_updated', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table.tableNumber,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
