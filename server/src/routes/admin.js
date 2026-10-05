import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { authenticate, loadUserRestaurant } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);
router.use(loadUserRestaurant);

// ─── Dashboard ───────────────────────────────────────────────
// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const restaurantId = req.restaurant.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, pendingOrders, completedOrders, recentOrders, topItems] = await Promise.all([
      prisma.order.count({
        where: { restaurantId, createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.count({
        where: { restaurantId, status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'] } },
      }),
      prisma.order.count({
        where: { restaurantId, status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { table: { select: { tableNumber: true } }, items: true },
      }),
      prisma.orderItem.groupBy({
        by: ['itemNameSnapshot'],
        where: { order: { restaurantId, createdAt: { gte: today, lt: tomorrow } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const revenueResult = await prisma.order.aggregate({
      where: { restaurantId, status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } },
      _sum: { subtotal: true },
    });

    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: { status: true },
    });

    res.json({
      success: true,
      data: {
        stats: {
          todayOrders,
          todayRevenue: Number(revenueResult._sum.subtotal || 0),
          pendingOrders,
          completedOrders,
        },
        statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.status })),
        recentOrders,
        topItems: topItems.map((i) => ({ name: i.itemNameSnapshot, quantity: i._sum.quantity })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Restaurant Settings ──────────────────────────────────────
// GET /api/admin/restaurant
router.get('/restaurant', async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.restaurant.id },
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

const restaurantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  themeColor: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
});

// PATCH /api/admin/restaurant
router.patch('/restaurant', async (req, res, next) => {
  try {
    const data = restaurantUpdateSchema.parse(req.body);
    const restaurant = await prisma.restaurant.update({
      where: { id: req.restaurant.id },
      data,
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

// ─── Categories ───────────────────────────────────────────────
// GET /api/admin/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { restaurantId: req.restaurant.id },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { menuItems: true } } },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// POST /api/admin/categories
router.post('/categories', async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, restaurantId: req.restaurant.id },
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    // Ensure category belongs to this restaurant
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Category not found', 404));

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Category not found', 404));

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── Menu Items ───────────────────────────────────────────────
// GET /api/admin/menu
router.get('/menu', async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: req.restaurant.id },
      orderBy: [{ categoryId: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isVegetarian: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// POST /api/admin/menu
router.post('/menu', async (req, res, next) => {
  try {
    const data = menuItemSchema.parse(req.body);
    // Verify category belongs to restaurant
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId: req.restaurant.id },
    });
    if (!category) return next(new AppError('Category not found', 404));

    const item = await prisma.menuItem.create({
      data: { ...data, restaurantId: req.restaurant.id, imageUrl: data.imageUrl || null },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/menu/:id
router.put('/menu/:id', async (req, res, next) => {
  try {
    const data = menuItemSchema.partial().parse(req.body);
    const existing = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Menu item not found', 404));

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, restaurantId: req.restaurant.id },
      });
      if (!category) return next(new AppError('Category not found', 404));
    }

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { ...data, imageUrl: data.imageUrl || null },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/menu/:id/availability
router.patch('/menu/:id/availability', async (req, res, next) => {
  try {
    const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);
    const existing = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Menu item not found', 404));

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable },
    });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/menu/:id
router.delete('/menu/:id', async (req, res, next) => {
  try {
    const existing = await prisma.menuItem.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Menu item not found', 404));

    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── Tables ───────────────────────────────────────────────────
// GET /api/admin/tables
router.get('/tables', async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const tables = await prisma.table.findMany({
      where: { restaurantId: req.restaurant.id },
      orderBy: { tableNumber: 'asc' },
      include: {
        _count: { select: { orders: { where: { status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'] } } } } },
      },
    });

    // Generate QR codes
    const tablesWithQR = await Promise.all(
      tables.map(async (table) => {
        const qrUrl = `${clientUrl}/order/${req.restaurant.slug}/${table.tableNumber}`;
        const qrCode = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        return { ...table, qrUrl, qrCode };
      })
    );

    res.json({ success: true, data: tablesWithQR });
  } catch (error) {
    next(error);
  }
});

const tableSchema = z.object({
  tableNumber: z.string().min(1),
  displayName: z.string().optional(),
  isActive: z.boolean().optional(),
});

// POST /api/admin/tables
router.post('/tables', async (req, res, next) => {
  try {
    const data = tableSchema.parse(req.body);
    const table = await prisma.table.create({
      data: { ...data, restaurantId: req.restaurant.id },
    });
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/tables/:id
router.put('/tables/:id', async (req, res, next) => {
  try {
    const data = tableSchema.partial().parse(req.body);
    const existing = await prisma.table.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Table not found', 404));

    const table = await prisma.table.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/tables/:id
router.delete('/tables/:id', async (req, res, next) => {
  try {
    const existing = await prisma.table.findFirst({
      where: { id: req.params.id, restaurantId: req.restaurant.id },
    });
    if (!existing) return next(new AppError('Table not found', 404));

    await prisma.table.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Table deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── Orders ───────────────────────────────────────────────────
// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, date, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { restaurantId: req.restaurant.id };
    if (status && status !== 'ALL') where.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          table: { select: { tableNumber: true, displayName: true } },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

export default router;
