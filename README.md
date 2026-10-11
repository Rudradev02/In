# Stockroom — Inventory & Sales Management System

A complete, polished Django inventory and sales management workspace built for small businesses and portfolio showcase. It tracks products, categories, real-time stock levels, and sales transactions in a clean, responsive web application.

---

## Features

- **Authentication & Authorization**: Built-in Django auth with registration, login/logout, and route protection.
- **Interactive Dashboard**: Real-time business KPIs (Total Products, Stock Units, Low-Stock Alerts, Today's Sales/Revenue, Total Revenue), recent transactions table, and a 7-day revenue trend chart powered by Chart.js.
- **Product Management**: Complete CRUD operations, unique SKU enforcement, low-stock threshold monitoring, category filtering, search, and delete protection.
- **Category Management**: Organized product categorization.
- **Sales Transactions**: Transactional stock reduction with row-locking, automatic price calculations, quantity availability checks, and audit logging of selling user.
- **Management Commands**: Pre-configured `seed_data` command to instantly populate demo categories, products, sales history, and demo account.
- **Modern UI/UX**: Professional Bootstrap 5 responsive layout with custom design styling.
- **Database Support**: Built-in support for **PostgreSQL** (Neon, AWS, Heroku) via `dj-database-url` and `psycopg 3`, with automatic local **SQLite** fallback.

---

## Tech Stack

- **Backend**: Python 3.12+, Django 5.1+
- **Database**: PostgreSQL (Neon Serverless PostgreSQL) / SQLite (local fallback)
- **Database Driver**: `psycopg` (v3), `dj-database-url`
- **Frontend**: HTML5, CSS3, Bootstrap 5, Chart.js
- **Environment Management**: `python-dotenv`

---

## Project Structure

```text
Inventory-Sales-Manager/
├── accounts/               # User registration and authentication views
├── config/                 # Django settings, root URL configuration, WSGI entry point
├── inventory/              # Categories, products, dashboard views, forms, seed command
├── sales/                  # Sales transaction model, views, forms, business logic
├── static/                 # Static CSS, JavaScript, and assets
│   └── css/app.css
├── templates/              # Bootstrap 5 HTML templates
│   ├── base.html
│   ├── inventory/
│   ├── registration/
│   └── sales/
├── .env.example            # Environment configuration template
├── .gitignore              # Python / Django / PostgreSQL gitignore rules
├── manage.py               # Django management CLI
├── requirements.txt        # Production & development dependencies
└── README.md               # Project documentation
```

---

## Getting Started

### 1. Prerequisites

- Python 3.12 or higher
- Git

### 2. Clone and Setup Environment

```bash
git clone https://github.com/Rudradev02/Inventory-Sales-Manager.git
cd Inventory-Sales-Manager

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (cmd):
venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
copy .env.example .env     # Windows
cp .env.example .env       # macOS / Linux
```

Edit `.env` to configure your settings and database:

```env
DJANGO_DEBUG=1
SESSION_SECRET=your-secret-key-here
ALLOWED_HOSTS=*

# Neon PostgreSQL connection string:
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-example-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> **Note**: If `DATABASE_URL` is commented or empty, Django will automatically fall back to a local SQLite database (`db.sqlite3`).

### 4. Database Migrations & Demo Data

Apply migrations to initialize your PostgreSQL schema:

```bash
python manage.py migrate
```

Populate the database with demo products, categories, sample transactions, and a demo staff user:

```bash
python manage.py seed_data
```

### 5. Run the Application

```bash
python manage.py runserver
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.

---

## Demo Credentials

After running `python manage.py seed_data`:

- **Username**: `demo`
- **Password**: `demo12345`

To create an administrator with full Django Admin access:

```bash
python manage.py createsuperuser
```
Admin dashboard is accessible at [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/).

---

## License

This project is licensed under the MIT License.