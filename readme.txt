INVENTORIA INVENTORY MANAGEMENT SYSTEM DOCUMENTATION

OVERVIEW
Inventoria is an inventory management software built with Express.js backend and React frontend. It manages items, categories, users, transactions, and provides rental functionality with expiration tracking.

ARCHITECTURE
- Backend: Express.js with TypeScript
- Frontend: React with TypeScript and Vite
- Database: PostgreSQL with Drizzle ORM
- State Management: TanStack Query (React Query)
- UI: Tailwind CSS with shadcn/ui components
- File Structure: Monorepo with shared schema validation

CORE COMPONENTS

SERVER ARCHITECTURE
- server/index.ts: Main server entry point, middleware setup, error handling
- server/routes.ts: All API route definitions and handlers
- server/storage.ts: Data access layer with in-memory storage and database operations
- server/db.ts: Database connection and Drizzle configuration
- server/vite.ts: Development server setup and static file serving

CLIENT ARCHITECTURE
- client/src/App.tsx: Main application component with routing and layout
- client/src/main.tsx: React application entry point
- client/src/index.css: Global styles and dynamic background animations

SHARED COMPONENTS  
- shared/schema.ts: Zod schemas and TypeScript types for data validation

DATA MODELS

Users Table (users)
- id: Primary key
- username: Unique identifier
- fullName: Display name
- role: admin/user/overseer
- isActive: Account status
- createdAt/updatedAt: Timestamps

Categories Table (categories)
- id: Primary key
- name: Unique category name
- description: Optional description
- createdAt: Timestamp

Items Table (items)
- id: Primary key
- name: Item name
- sku: Unique stock keeping unit
- description: Optional description
- categoryId: Foreign key to categories
- quantity: Available stock
- unitPrice: Price per unit
- location: Storage location
- minStockLevel: Low stock threshold
- status: active/inactive/discontinued
- rentedCount: Currently rented quantity
- brokenCount: Damaged items count
- expirationDate: Optional expiration
- rentable: Boolean rental availability
- expirable: Boolean expiration tracking
- createdAt/updatedAt: Timestamps

Transactions Table (transactions)
- id: Primary key
- itemId: Foreign key to items
- userId: Foreign key to users
- type: in/out/adjustment
- quantity: Transaction amount
- unitPrice: Price at transaction time
- notes: Optional notes
- createdAt: Timestamp

API ENDPOINTS

Category Management
GET /api/categories - Retrieve all categories
POST /api/categories - Create new category
PUT /api/categories/:id - Update category
DELETE /api/categories/:id - Delete category

Item Management
GET /api/items - List items with optional search and category filtering
GET /api/items/:id - Get single item details
POST /api/items - Create new item
PUT /api/items/:id - Update item
DELETE /api/items/:id - Delete item
GET /api/items/low-stock - Get items below minimum stock level
GET /api/items/expires-soon - Get items expiring within threshold days
POST /api/items/:id/rent - Rent item quantity
POST /api/items/:id/return - Return rented item quantity

User Management
GET /api/users - List all users
POST /api/users - Create new user
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user

Transaction Tracking
GET /api/transactions - List transactions with optional limit

Dashboard Statistics
GET /api/dashboard/stats - Get summary statistics (total items, value, low stock count, today's transactions)

Database Operations
GET /api/database/backup/export - Export full database backup as JSON
POST /api/database/backup/import - Import database backup from JSON or file upload
GET /api/database/export/inventory - Export inventory data as Excel file
GET /api/database/export/activity - Export transaction history as Excel file
POST /api/database/flush-activity - Clear all transaction logs

Settings
GET /api/settings/expires-threshold - Get expiration warning threshold days
PUT /api/settings/expires-threshold - Update expiration threshold (1-365 days)

FRONTEND PAGES

Dashboard (/dashboard)
- Overview statistics cards
- Recent inventory table
- Low stock alerts
- Expiring items alerts
- Recent activity log
- Quick rent/return actions

Inventory (/inventory)
- Full inventory table with search and filtering
- Add/edit/delete item functionality
- Category filtering
- Stock status indicators
- Rental management
- Item details modal

Activity (/activity)
- Transaction history table
- User activity tracking
- Transaction type filtering
- Export functionality

Users (/users)
- User management interface
- Role assignment
- User creation/editing
- Account status management

Settings (/settings)
- Expiration threshold configuration
- System preferences
- Status definitions display

Database (/database)
- Backup creation and restoration
- Data export functionality
- Activity log management
- System maintenance tools

About (/about)
- Application information
- Feature overview
- User role descriptions
- Getting started guide

COMPONENT STRUCTURE

Layout Components
- components/layout/sidebar.tsx: Navigation sidebar with role-based menu items
- components/layout/top-bar.tsx: Header with page title and user info

Inventory Components
- components/inventory/inventory-table.tsx: Main inventory display with CRUD operations
- components/inventory/add-item-modal.tsx: Item creation/editing modal
- components/inventory/item-details-modal.tsx: Item information display
- components/inventory/stats-cards.tsx: Dashboard statistics display

Activity Components
- components/activity/recent-activity.tsx: Transaction history display
- components/activity/low-stock-alerts.tsx: Low stock notifications

Dashboard Components
- components/dashboard/low-stock-display.tsx: Dashboard low stock section

UI Components
- components/ui/: Reusable UI components (buttons, cards, forms, tables, modals, etc.)

BUSINESS LOGIC

Stock Management
- Automatic stock level calculation
- Low stock detection based on minStockLevel
- Status calculation (Full/Saturated/Low stock)
- Rental quantity tracking separate from available stock

Rental System
- Item rental with quantity tracking
- Return processing with validation
- Rental status updates in transactions
- Availability calculation considering rented items

Expiration Tracking
- Optional expiration dates for items
- Configurable warning threshold
- Automatic expiring soon detection
- Date validation and formatting

Transaction Logging
- Automatic transaction creation for stock changes
- User attribution for all actions
- Transaction type categorization
- Activity history maintenance

Data Validation
- Zod schema validation for all data models
- Frontend form validation
- API request/response validation
- Type safety throughout application

AUTHENTICATION & AUTHORIZATION
- Role-based access control (admin/user/overseer)
- User context management
- Page-level permission checks
- Action-level permission validation

ERROR HANDLING
- Global error boundaries
- API error responses
- Form validation errors
- User feedback through toast notifications

DEPLOYMENT
- Ubuntu setup scripts in ubuntu-setup/
- Automated installation with install.sh
- Service management with systemd
- Backup and restore utilities
- Update mechanism

CONFIGURATION
- Environment-based configuration
- Database connection settings
- Server port configuration (default 5000)
- Development/production mode detection

FILE UPLOADS
- Multer middleware for backup file uploads
- Memory storage for temporary files
- JSON parsing for backup data
- File validation and error handling

EXPORT FUNCTIONALITY
- JSON backup export/import
- Excel file generation for inventory and activity
- Configurable data formatting
- Download prompt handling

SEARCH & FILTERING
- Item search by name/description/SKU
- Category-based filtering
- Real-time search implementation
- Query parameter handling

STATE MANAGEMENT
- TanStack Query for server state
- React Context for user state
- Local state for UI components
- Cache invalidation strategies

STYLING
- Tailwind CSS utility classes
- Dynamic background animations
- Responsive design patterns
- Component-based styling approach
