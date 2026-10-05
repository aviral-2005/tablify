import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/restaurants/:slug — Public restaurant info
router.get('/:slug', async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: req.params.slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        coverImageUrl: true,
        description: true,
        phone: true,
        address: true,
        openingHours: true,
        currency: true,
        currencySymbol: true,
        themeColor: true,
      },
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants/:slug/menu — Public menu
router.get('/:slug/menu', async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: req.params.slug, isActive: true },
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        menuItems: {
          where: { restaurantId: restaurant.id },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            isVegetarian: true,
            isAvailable: true,
            categoryId: true,
          },
        },
      },
    });

    res.json({ success: true, data: { restaurant, categories } });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants/:slug/table/:tableNumber — Validate table
router.get('/:slug/table/:tableNumber', async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: req.params.slug, isActive: true },
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    const table = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: req.params.tableNumber,
        },
        isActive: true,
      },
    });

    if (!table) {
      return next(new AppError('Table not found or inactive', 404));
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          logoUrl: restaurant.logoUrl,
          themeColor: restaurant.themeColor,
          currencySymbol: restaurant.currencySymbol,
        },
        table: {
          id: table.id,
          tableNumber: table.tableNumber,
          displayName: table.displayName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
