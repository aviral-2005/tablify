import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const orderSchema = z.object({
  restaurantSlug: z.string().min(1),
  tableNumber: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    note: z.string().max(200).optional(),
  })).min(1, 'Order must have at least one item'),
  customerNote: z.string().max(500).optional(),
});

// POST /api/orders — Place an order (public)
router.post('/', async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);

    // Validate restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: data.restaurantSlug, isActive: true },
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Validate table
    const table = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: data.tableNumber,
        },
        isActive: true,
      },
    });

    if (!table) {
      return next(new AppError('Table not found or inactive', 404));
    }

    // Validate all menu items belong to this restaurant and are available
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurant.id,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return next(new AppError('One or more menu items are invalid', 400));
    }

    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      return next(new AppError(`Item "${unavailable[0].name}" is currently unavailable`, 400));
    }

    // Calculate subtotal
    const menuItemMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const menuItem = menuItemMap[item.menuItemId];
      const price = Number(menuItem.price);
      subtotal += price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        itemNameSnapshot: menuItem.name,
        priceSnapshot: price,
        quantity: item.quantity,
        note: item.note || null,
      };
    });

    // Get next order number for this restaurant
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber || 1000) + 1;

    // Create order
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        orderNumber,
        status: 'NEW',
        paymentStatus: 'UNPAID',
        subtotal,
        customerNote: data.customerNote || null,
        items: { create: orderItems },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Emit new_order via socket
    req.io.to(`restaurant:${restaurant.id}`).emit('new_order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: table.tableNumber,
      displayName: table.displayName,
      status: order.status,
      subtotal: order.subtotal,
      customerNote: order.customerNote,
      items: order.items,
      createdAt: order.createdAt,
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: table.tableNumber,
        status: order.status,
        subtotal: order.subtotal,
        items: order.items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:orderId — Track order status (public)
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: true,
        table: { select: { tableNumber: true, displayName: true } },
        restaurant: { select: { name: true, slug: true, currencySymbol: true } },
      },
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
