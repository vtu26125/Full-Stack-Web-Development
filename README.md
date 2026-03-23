# Electronics Inventory Control & Stock Tracking System

A business-ready inventory management system for electronics shops. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **Product Management** – CRUD for electronic products (name, SKU, category, supplier, min stock, quantity, unit price)
- **Category Management** – CRUD for product categories
- **Supplier Management** – CRUD for suppliers
- **Stock In** – Record purchases and increase product quantity
- **Stock Out** – Record sales and decrease quantity (prevents negative stock)
- **Low Stock Alerts** – Visual highlight and report when quantity ≤ min_stock
- **Reports** – Current stock, low stock, sales history, purchase history

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

## Setup

### 1. Create PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE electronics_inventory;"
```

Or use pgAdmin / any PostgreSQL client to create a database named `electronics_inventory`.

### 2. Configure environment

Copy the example env file and set your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=electronics_inventory
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Install and run

```bash
npm install
node server.js
```

Tables are created automatically from `database.sql` on server startup. No manual SQL execution is required.

### 4. Open the app

Go to **http://localhost:3000** in your browser.

## Project structure

```
inventory-system/
├── server.js           # Entry point, runs schema init and Express
├── package.json
├── .env.example
├── database.sql        # Schema (auto-executed on start)
├── config/
│   └── db.js           # PostgreSQL connection pool
├── routes/
│   ├── products.js
│   ├── categories.js
│   ├── suppliers.js
│   ├── purchases.js
│   └── sales.js
├── controllers/
│   ├── products.js
│   ├── categories.js
│   ├── suppliers.js
│   ├── purchases.js
│   └── sales.js
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products |
| GET | /api/products/low-stock | Low stock products |
| GET | /api/products/:id | Get one product |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Create supplier |
| PUT | /api/suppliers/:id | Update supplier |
| DELETE | /api/suppliers/:id | Delete supplier |
| GET | /api/purchases | List purchases |
| POST | /api/purchases | Stock in |
| GET | /api/sales | List sales |
| POST | /api/sales | Stock out |

## License

ISC
