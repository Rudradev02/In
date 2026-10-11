# InvLab — Modern Inventory & Sales Management Workspace

InvLab is an enterprise-grade inventory, product catalog, and sales management workspace built with a **Django 5.2 REST API** backend and a high-performance **React 19 + TypeScript + Vite** Single-Page Application (SPA).

---

## Architecture Overview

InvLab uses a decoupled architecture allowing both modern SPA workflows and legacy server-rendered views to operate side-by-side:

- **Backend REST API (`/api/v1/`)**: Built on Django REST Framework with session-cookie authentication, CSRF validation, OpenAPI 3 interactive documentation (`/api/docs/`), atomic transaction handling (`select_for_update()`), and optimized date aggregation queries.
- **Frontend SPA (`frontend/`)**: Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query v5, Framer Motion, Recharts, and Radix UI primitives. Uses an Ivory (`#F8F8F5`), Forest Green (`#173D32`), Sage (`#D9E8DB`), and Terracotta (`#C77B55`) palette.
- **Authoritative Business Logic**: All stock validation and deductions are executed inside atomic server transactions (`sales/services.py` and `inventory/services.py`).

---

## Features

### Workspace & Dashboard
- **Real-Time KPIs**: Total Products, Total Stock Units, Low Stock Alert Count, Today's Sales Count, Today's Revenue, and Lifetime Revenue.
- **Interactive Revenue Chart**: Smooth Recharts area visualization with 7-day, 30-day, and 90-day time range toggles.
- **Category Stock Breakdown**: Dynamic bar visualization of inventory distribution across departments.
- **Low Stock Watchlist**: Instant alert list for products at or below threshold with quick-adjustment shortcuts.
- **Recent Transactions Ledger**: Instant transaction log with direct receipt views.

### Product Management
- **Full Inventory Catalog**: Search by name or SKU, filter by category or stock status (All, Low Stock, In Stock, Out of Stock), and multi-column sorting.
- **Add / Edit Modal**: Clean drawer modals for instant CRUD without page reloads.
- **Quick Stock Adjustment**: Add or remove stock with audit reasons (`/api/v1/products/<id>/adjust-stock/`).
- **Product Detail View**: Dedicated specification page with stock threshold badges, timestamp audit trails, and deletion protection against products with sales records.

### Category Taxonomy
- **Taxonomy Organization**: Create and manage product categories with assigned product count badges.
- **Deletion Protection**: Backend and UI safeguards prevent deleting categories that still have assigned products.

### Sales & Order Recording
- **Real-Time Invoice Preview**: Live bill calculation with unit prices and remaining stock impact before submission.
- **Stock Guard**: Disallows recording sales that exceed available inventory with clear user feedback.
- **Printable Receipts**: Formal printable sales receipt modal with cashier details, item breakdown, and unique transaction numbers.

---

## Tech Stack

### Backend
- **Python**: 3.12+ / 3.14
- **Framework**: Django 5.2+, Django REST Framework 3.18+
- **API Documentation**: `drf-spectacular` (OpenAPI 3 / Swagger UI)
- **Database**: PostgreSQL on Neon (`psycopg 3`, `dj-database-url`), local SQLite fallback
- **Static Assets**: WhiteNoise for production build serving

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Custom Variables
- **State & Server Cache**: TanStack Query (React Query v5)
- **Routing**: React Router v7
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts
- **Icons & UI Primitives**: Lucide React, Radix UI Primitives, Sonner (Toasts)

---

## Quick Start

### 1. Prerequisites
- Python 3.12 or higher
- Node.js 18+ and npm
- Git

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/Rudradev02/InvLab.git
cd InvLab

# Create and activate virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to set DJANGO_DEBUG=1 and optionally your DATABASE_URL

# Apply database migrations
python manage.py migrate

# Seed demo data (demo categories, products, transactions, and user)
python manage.py seed_data

# Run Django backend server
python manage.py runserver
```

The Django server will be available at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).
- Interactive API Docs: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- Django Admin: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### 3. Frontend Setup (React SPA)

In a new terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server (proxies /api to http://127.0.0.1:8000)
npm run dev
```

The React SPA will open at [http://localhost:5173/](http://localhost:5173/).

---

## Demo Credentials

After running `python manage.py seed_data`:
- **Username**: `demo`
- **Password**: `demo12345`

---

## Testing

Run the automated backend test suite:

```bash
python manage.py test api
```

Typecheck and build the frontend production bundle:

```bash
cd frontend
npm run build
```

---

## License

This project is licensed under the MIT License.