import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@brewandbean.com' },
    update: {},
    create: {
      name: 'Arjun Sharma',
      email: 'admin@brewandbean.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', user.email);

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'brew-and-bean' },
    update: {},
    create: {
      name: 'Brew & Bean Café',
      slug: 'brew-and-bean',
      description: 'A cozy café serving artisanal coffee, fresh sandwiches, and decadent desserts in the heart of the city.',
      phone: '+91 98765 43210',
      address: '12, MG Road, Koramangala, Bengaluru, Karnataka 560034',
      openingHours: 'Mon–Sun: 8:00 AM – 11:00 PM',
      currency: 'INR',
      currencySymbol: '₹',
      themeColor: '#D97706',
      logoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center',
      coverImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=400&fit=crop',
    },
  });

  console.log('✅ Restaurant created:', restaurant.name);

  // Link user to restaurant
  await prisma.restaurantUser.upsert({
    where: { restaurantId_userId: { restaurantId: restaurant.id, userId: user.id } },
    update: {},
    create: {
      restaurantId: restaurant.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  // Create kitchen staff user
  const kitchenPasswordHash = await bcrypt.hash('kitchen123', 12);
  const kitchenUser = await prisma.user.upsert({
    where: { email: 'kitchen@brewandbean.com' },
    update: {},
    create: {
      name: 'Ravi Kumar',
      email: 'kitchen@brewandbean.com',
      passwordHash: kitchenPasswordHash,
      role: 'ADMIN',
    },
  });

  await prisma.restaurantUser.upsert({
    where: { restaurantId_userId: { restaurantId: restaurant.id, userId: kitchenUser.id } },
    update: {},
    create: {
      restaurantId: restaurant.id,
      userId: kitchenUser.id,
      role: 'KITCHEN',
    },
  });

  console.log('✅ Kitchen user created:', kitchenUser.email);

  // Create categories
  const categoryData = [
    { name: 'Coffee', displayOrder: 1 },
    { name: 'Tea', displayOrder: 2 },
    { name: 'Snacks', displayOrder: 3 },
    { name: 'Sandwiches', displayOrder: 4 },
    { name: 'Desserts', displayOrder: 5 },
    { name: 'Shakes & Smoothies', displayOrder: 6 },
  ];

  const categories = {};
  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id, name: cat.name },
    });
    if (!existing) {
      const category = await prisma.category.create({
        data: { ...cat, restaurantId: restaurant.id },
      });
      categories[cat.name] = category;
    } else {
      categories[cat.name] = existing;
    }
  }
  console.log('✅ Categories created');

  // Create menu items
  const menuItems = [
    // Coffee
    {
      categoryId: categories['Coffee'].id,
      name: 'Cappuccino',
      description: 'Rich espresso with velvety steamed milk and a light frothy top. Our signature morning coffee.',
      price: 150,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Coffee'].id,
      name: 'Café Latte',
      description: 'Smooth espresso balanced with creamy steamed milk. Perfect for those who love a milder coffee.',
      price: 160,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
    {
      categoryId: categories['Coffee'].id,
      name: 'Americano',
      description: 'Bold espresso diluted with hot water for a clean, full-bodied cup. For purists only.',
      price: 130,
      imageUrl: 'https://images.unsplash.com/photo-1497935586047-9395ee8f2f9b?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 3,
    },
    {
      categoryId: categories['Coffee'].id,
      name: 'Cold Coffee',
      description: 'Chilled espresso blended with milk and a hint of vanilla. Served over ice.',
      price: 180,
      imageUrl: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 4,
    },
    // Tea
    {
      categoryId: categories['Tea'].id,
      name: 'Masala Chai',
      description: 'Traditional Indian spiced tea brewed with ginger, cardamom, and cinnamon. Comforting and bold.',
      price: 80,
      imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Tea'].id,
      name: 'Green Tea',
      description: 'Light and refreshing green tea from Darjeeling. Rich in antioxidants.',
      price: 90,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
    // Snacks
    {
      categoryId: categories['Snacks'].id,
      name: 'French Fries',
      description: 'Golden crispy fries seasoned with our house spice blend. Served with ketchup and mayo.',
      price: 130,
      imageUrl: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Snacks'].id,
      name: 'Peri Peri Fries',
      description: 'Crispy fries tossed in fiery peri peri seasoning. For spice lovers!',
      price: 150,
      imageUrl: 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
    {
      categoryId: categories['Snacks'].id,
      name: 'Garlic Bread',
      description: 'Toasted baguette slices with garlic herb butter and a sprinkle of cheese. Irresistible!',
      price: 110,
      imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 3,
    },
    // Sandwiches
    {
      categoryId: categories['Sandwiches'].id,
      name: 'Classic Veg Sandwich',
      description: 'Multigrain bread with fresh veggies, cheese, and our house green chutney. Toasted to perfection.',
      price: 180,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Sandwiches'].id,
      name: 'Paneer Tikka Sandwich',
      description: 'Spiced paneer tikka with caramelised onions, bell peppers, and mint chutney in toasted bread.',
      price: 220,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
    {
      categoryId: categories['Sandwiches'].id,
      name: 'Chicken Club Sandwich',
      description: 'Grilled chicken breast with lettuce, tomato, cheese, and our signature mayo in a triple-decker.',
      price: 280,
      imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=300&fit=crop',
      isVegetarian: false,
      displayOrder: 3,
    },
    // Desserts
    {
      categoryId: categories['Desserts'].id,
      name: 'Dark Chocolate Brownie',
      description: 'Dense, fudgy brownie with Belgian dark chocolate chunks. Served warm with vanilla ice cream.',
      price: 160,
      imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Desserts'].id,
      name: 'New York Cheesecake',
      description: 'Velvety smooth cheesecake with a buttery graham cracker crust. Topped with berry compote.',
      price: 190,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
    // Shakes
    {
      categoryId: categories['Shakes & Smoothies'].id,
      name: 'Chocolate Shake',
      description: 'Thick creamy milkshake blended with premium chocolate ice cream and Hershey\'s chocolate syrup.',
      price: 210,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      categoryId: categories['Shakes & Smoothies'].id,
      name: 'Mango Smoothie',
      description: 'Fresh Alphonso mango blended with yoghurt and a touch of honey. A taste of summer.',
      price: 190,
      imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop',
      isVegetarian: true,
      displayOrder: 2,
    },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: item.name },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: restaurant.id },
      });
    }
  }
  console.log('✅ Menu items created (16 items)');

  // Create tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: String(i),
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        tableNumber: String(i),
        displayName: `Table ${i}`,
        isActive: true,
      },
    });
  }
  console.log('✅ Tables created (10 tables)');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:   admin@brewandbean.com / admin123');
  console.log('   Kitchen: kitchen@brewandbean.com / kitchen123');
  console.log('\n🔗 Demo URLs (after starting dev server):');
  console.log('   Menu:    http://localhost:5173/order/brew-and-bean/1');
  console.log('   Admin:   http://localhost:5173/admin/login');
  console.log('   Kitchen: http://localhost:5173/kitchen');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
