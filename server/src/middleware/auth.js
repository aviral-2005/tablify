import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Authenticate any logged-in user
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { restaurants: { include: { restaurant: true } } },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Require restaurant admin role
export const requireRestaurantAccess = (role = null) => async (req, res, next) => {
  const { restaurantId } = req.params;

  if (!restaurantId) {
    return res.status(400).json({ success: false, message: 'Restaurant ID required' });
  }

  const membership = req.user.restaurants.find(
    (ru) => ru.restaurantId === restaurantId
  );

  if (!membership) {
    return res.status(403).json({ success: false, message: 'Access denied to this restaurant' });
  }

  if (role && membership.role !== role && membership.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  req.restaurantMembership = membership;
  req.restaurant = membership.restaurant;
  next();
};

// Middleware to load restaurant from authenticated user (for admin routes without restaurantId param)
export const loadUserRestaurant = async (req, res, next) => {
  const membership = req.user.restaurants[0];
  if (!membership) {
    return res.status(403).json({ success: false, message: 'No restaurant assigned' });
  }
  req.restaurantMembership = membership;
  req.restaurant = membership.restaurant;
  req.params.restaurantId = membership.restaurantId;
  next();
};

export const signToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
