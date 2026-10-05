# Tablify — QR-Based Café & Restaurant Ordering SaaS ☕📱

> **A Production-Ready, Multi-Tenant QR-Based Ordering & Kitchen Management SaaS Platform built for Independent Cafés & Restaurants in India.**

---

## 🌟 Product Architecture Overview

```mermaid
flowchart TD
    subgraph Customer Experience [Customer - Mobile Web UI]
        QR[Scan Table QR Code] --> Menu[Browse Menu & Filter Categories]
        Menu --> Item[Customize Item & Add to Cart]
        Item --> Checkout[Place Order - Pay at Counter]
        Checkout --> Track[Live Order Tracking Timeline]
    end

    subgraph Backend Core [Node.js / Express SaaS Core]
        API[Express REST API + Socket.IO]
        Auth[JWT & Multi-Tenant Auth Guard]
        TenantFilter[Restaurant Tenant Isolation]
    end

    subgraph Kitchen Dashboard [Kitchen Staff UI]
        LiveKitchen[Kitchen Kanban Board]
        AudioAlert[Audio Beep Notification]
        StatusAction[Status Transition Buttons]
    end

    subgraph Admin Portal [Restaurant Owner Dashboard]
        Analytics[Recharts Analytics]
        MenuMgmt[Menu & Category CRUD]
        QRMgmt[Table & QR Generator]
        Settings[Branding & Theme Settings]
    end

    subgraph Database [PostgreSQL + Prisma ORM]
        DB[(Multi-Tenant Schema)]
    end

    QR --> API
    Checkout --> API
    API --> DB
    API -- Socket.IO Room: restaurant:{id} --> LiveKitchen
    StatusAction -- Socket.IO Emit --> Track
    AdminPortal --> Auth --> TenantFilter --> API
```

---

## ✨ Features

### 📱 Customer Mobile Web App
- **Zero Friction**: No customer login or app download required. Scan QR code and start ordering instantly.
- **Dynamic Context**: Detects café details (`slug`) and table number automatically from URL `/order/:slug/:tableNumber`.
- **Mobile-First UX**: Sleek top header, search bar, sliding category pills, item cards with vegetarian indicators (`Green` dot for Veg, `Red` dot for Non-Veg).
- **Customization**: Detailed modal for item special instructions (e.g. *"Extra hot"*, *"Less sugar"*).
- **Cart & Order Summary**: Quick side drawer with quantity adjustment, customer notes, and instant subtotal calculation in ₹ (INR).
- **Live Order Tracking**: Visual timeline showing order progress: `Order Received` → `Accepted` → `Preparing` → `Ready` → `Completed`. Auto-updates in real-time via Socket.IO.

### 🍳 Kitchen Kanban Dashboard
- **Tablet / Laptop Optimized**: Clear column view (`NEW`, `PREPARING`, `READY`, `COMPLETED`).
- **Real-Time Delivery**: New orders pop up instantly without page refresh.
- **Audio Alerts**: Plays subtle chime sound when a new order arrives.
- **One-Tap Actions**: Quick status transition buttons (`ACCEPT`, `START PREPARING`, `MARK READY`, `COMPLETE`).
- **Item Snapshots & Notes**: Displays table number, exact item list, quantities, and customer instructions.

### 📊 Restaurant Admin SaaS Portal
- **Overview Dashboard**: Key stats (Today's Orders, Today's Revenue, Active Tables, Pending Orders) and interactive status bar chart powered by Recharts.
- **Menu Management**: Full CRUD for menu items, pricing in INR, availability toggling (instantly disables items on customer menu), veg/non-veg tags, and category assignment.
- **Category Manager**: Add/edit/delete categories and reorder display sequence.
- **Table & QR Code Manager**: Add/edit tables, generate unique QR code URLs (`/order/brew-and-bean/1`), and download high-resolution PNG QR codes directly for printing.
- **Live Orders Monitor**: Filter orders by status tabs with instant search and detailed order breakdown modal.
- **Café Branding Settings**: Custom café name, logo URL, cover image, phone, address, currency symbol (`₹`), opening hours, and accent color selection.

---

## 🔒 Multi-Tenant SaaS Architecture

Multi-tenancy is enforced at both the database and middleware layers:
1. **Database Schema**: Every entity (`User`, `Category`, `MenuItem`, `Table`, `Order`) belongs directly or indirectly to a `Restaurant` entity with a foreign key constraint.
2. **Tenant Isolation Guard**: JWT payloads contain user context. Express authorization middleware extracts `restaurantId` from the authenticated session and scopes all Prisma queries strictly to that `restaurantId`.
3. **Socket.IO Scoping**: Real-time broadcasts use isolated Socket rooms (`restaurant:${restaurantId}`). Café A will never receive order notifications from Café B.
4. **Historical Price Snapshots**: `OrderItem` stores `itemNameSnapshot` and `priceSnapshot` at the moment of order creation. Future menu price updates will never alter historical financial records.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Lucide Icons, Recharts, QRCode |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, bcryptjs, Zod Validation |
| **Database & ORM** | PostgreSQL, Prisma ORM (v5) |
| **Real-Time** | Socket.IO Server & Client |
| **Testing** | Node.js Native Test Runner (`node --test`), Strict Tenant Isolation Tests |

---

## 📁 Repository Structure

```
MVP/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, CartDrawer, Modal, ItemCard, etc.)
│   │   ├── context/            # AuthContext, CartContext, ToastContext
│   │   ├── layouts/            # AdminLayout, CustomerLayout
│   │   ├── pages/
│   │   │   ├── admin/          # Dashboard, Menu, Categories, Tables, Orders, Settings
│   │   │   ├── customer/       # CustomerMenu, OrderTrackingPage
│   │   │   └── kitchen/        # KitchenDashboard
│   │   ├── services/           # Axios API client & endpoints
│   │   ├── utils/              # Socket.IO client helper
│   │   ├── App.jsx             # React Router routing setup
│   │   └── index.css           # Tailwind design tokens & component styles
│   └── package.json
│
├── server/                     # Express + Prisma Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL Prisma Data Schema
│   │   └── seed.js             # Demo Seed Script for Brew & Bean Café
│   ├── src/
│   │   ├── controllers/        # Request Handlers
│   │   ├── middleware/         # Auth, Multi-tenant guard, Error Handler
│   │   ├── routes/             # Auth, Restaurants, Orders, Admin, Kitchen
│   │   ├── socket/             # Socket.IO Event Handlers & Rooms
│   │   ├── tests/              # Multi-tenant API Integration Tests
│   │   └── index.js            # Express & Socket.IO Entry point
│   ├── .env                    # Local environment variables
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL server running locally (or remote PostgreSQL URL from Neon / Supabase)

### 1. Database Setup & Environment Configuration
Ensure `server/.env` contains your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/qrcafe"
JWT_SECRET="qrcafe-super-secret-jwt-key-2024-change-in-production"
CLIENT_URL="http://localhost:5173"
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies & Seed Demo Café Data
Run the following in `server/`:
```bash
cd server
npm install
npx prisma db push
npm run seed
```

### 3. Run Backend Server
In `server/`:
```bash
npm run dev
```
Backend API will start at `http://localhost:3001`.

### 4. Run Frontend App
In `client/`:
```bash
cd client
npm install
npm run dev
```
Frontend will start at `http://localhost:5173`.

---

## 🔑 Demo Credentials & URLs

| Role | Access URL | Credentials |
|---|---|---|
| **Customer (Table 1)** | `http://localhost:5173/order/brew-and-bean/1` | No login required |
| **Kitchen Dashboard** | `http://localhost:5173/kitchen` | `kitchen@brewandbean.com` / `kitchen123` |
| **Admin Portal** | `http://localhost:5173/admin/login` | `admin@brewandbean.com` / `admin123` |

---

## 🧪 Running Automated Integration & Tenant Isolation Tests

Run the test suite in `server/`:
```bash
cd server
npm test
```
The test suite executes 14 end-to-end integration tests using Node's native test runner:
- ✅ **Auth**: Login with valid/invalid credentials
- ✅ **Public Menu**: Menu retrieval & table validation
- ✅ **Order Placement**: Order creation & validation failure handling
- ✅ **Kitchen Lifecycle**: Status updates (`NEW` → `ACCEPTED` → `PREPARING` → `READY` → `COMPLETED`)
- ✅ **Tenant Isolation**: Verifies that Admin of Café B cannot view, modify, or delete Café A's orders or menu items.

---

## 🌐 Deployment Instructions

### Backend (Render / Railway)
1. Push project to GitHub.
2. Create a Web Service on Render / Railway pointing to `/server`.
3. Set environment variables:
   - `DATABASE_URL`: Connection string from Neon / Supabase / Render PostgreSQL.
   - `JWT_SECRET`: Random 64-character secret.
   - `CLIENT_URL`: Deployed frontend URL (e.g., `https://qrcafe.vercel.app`).
4. Build command: `npm install && npx prisma db push`
5. Start command: `npm start`

### Frontend (Vercel)
1. Import client folder to Vercel.
2. Set Environment Variable:
   - `VITE_API_URL`: Backend service URL (e.g., `https://qrcafe-api.onrender.com/api`)
3. Deploy! Rewrite rule in `vercel.json` forwards single-page client routing to `index.html`.

---

## 📋 Future Roadmap (V2 & V3)
- **V2**: Razorpay / UPI online payments integration, Waiter call button, Add-on modifiers.
- **V3**: POS integration, Multi-branch management, GST invoicing & reporting.
