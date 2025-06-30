import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertItemSchema, insertCategorySchema, insertTransactionSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [totalItems, totalValue, lowStockCount, todayTransactions] = await Promise.all([
        storage.getTotalItemsCount(),
        storage.getTotalInventoryValue(),
        storage.getLowStockCount(),
        storage.getTodayTransactionsCount(),
      ]);

      res.json({
        totalItems,
        totalValue,
        lowStockCount,
        todayTransactions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/items", async (req, res) => {
    try {
      const { search, category } = req.query;

      let items;
      if (search) {
        items = await storage.searchItems(search as string);
      } else if (category && category !== "all") {
        if (category === "uncategorized") {
          items = (await storage.getAllItems()).filter(item => !item.categoryId);
        } else {
          items = await storage.getItemsByCategoryId(parseInt(category as string));
        }
      } else {
        items = await storage.getAllItems();
      }

      const categories = await storage.getAllCategories();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      const itemsWithCategory = items.map(item => ({
        ...item,
        categoryName: item.categoryId ? categoryMap.get(item.categoryId) : "Uncategorized",
      }));

      res.json(itemsWithCategory);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/items/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/items/expires-soon", async (req, res) => {
    try {
      const threshold = global.expiresSoonThreshold || 7;
      const items = await storage.getExpiringSoonItems(threshold);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiring items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      console.log("Creating item with data:", req.body);

      const processedData = {
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description || "",
        categoryId: req.body.categoryId || null,
        quantity: parseInt(req.body.stockQuantity) || parseInt(req.body.quantity) || 0,
        brokenCount: parseInt(req.body.brokenQuantity) || parseInt(req.body.brokenCount) || 0,
        rentedCount: parseInt(req.body.rentedQuantity) || parseInt(req.body.rentedCount) || 0,
        unitPrice: req.body.unitPrice || "0.00",
        location: req.body.location || "",
        minStockLevel: parseInt(req.body.minStockLevel) || 5,
        rentable: req.body.rentable !== undefined ? req.body.rentable : true,
        expirable: req.body.expirable !== undefined ? req.body.expirable : false,
        expirationDate: req.body.expirationDate ? (() => {
          const dateStr = req.body.expirationDate;
          if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return new Date(dateStr);
        })() : null,
        status: "active"
      };

      console.log("Processed data:", processedData);

      const validatedData = insertItemSchema.parse(processedData);
      console.log("Validated data:", validatedData);

      const item = await storage.createItem(validatedData);
      console.log("Created item:", item);

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create item", message: error.message });
      }
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const processedData = {
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description || "",
        categoryId: req.body.categoryId || null,
        quantity: parseInt(req.body.stockQuantity) || parseInt(req.body.quantity) || 0,
        brokenCount: parseInt(req.body.brokenQuantity) || parseInt(req.body.brokenCount) || 0,
        rentedCount: parseInt(req.body.rentedQuantity) || parseInt(req.body.rentedCount) || 0,
        unitPrice: req.body.unitPrice || "0.00",
        location: req.body.location || "",
        minStockLevel: parseInt(req.body.minStockLevel) || 5,
        rentable: req.body.rentable !== undefined ? req.body.rentable : true,
        expirable: req.body.expirable !== undefined ? req.body.expirable : false,
        expirationDate: req.body.expirationDate ? (() => {
          const dateStr = req.body.expirationDate;
          if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return new Date(dateStr);
        })() : null,
      };

      const validatedData = insertItemSchema.partial().parse(processedData);
      const item = await storage.updateItem(id, validatedData);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update item" });
      }
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);

      if (!success) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.post("/api/items/:id/rent", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity, userId } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Valid quantity required" });
      }

      const item = await storage.rentItem(id, quantity, userId || 1);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Log rent activity
      try {
        await storage.createTransaction({
          type: "out",
          quantity: quantity,
          userId: userId || 26, // Use existing admin user ID
          itemId: id,
          notes: `Rented ${quantity} units of ${item.name}`
        });
      } catch (logError) {
        console.error("Failed to log rent activity:", logError);
      }

      res.json(item);
    } catch (error) {
      console.error('Error renting item:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/items/:id/return", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity, userId } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Valid quantity required" });
      }

      const item = await storage.returnItem(id, quantity, userId || 1);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Log return activity
      try {
        await storage.createTransaction({
          type: "in",
          quantity: quantity,
          userId: userId || 26, // Use existing admin user ID
          itemId: id,
          notes: `Returned ${quantity} units of ${item.name}`
        });
      } catch (logError) {
        console.error("Failed to log return activity:", logError);
      }

      res.json(item);
    } catch (error) {
      console.error('Error returning item:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getAllTransactions(limit);

      const items = await storage.getAllItems();
      const users = await storage.getAllUsers();

      const itemMap = new Map(items.map(item => [item.id, { id: item.id, name: item.name, sku: item.sku }]));
      const userMap = new Map(users.map(user => [user.id, { id: user.id, fullName: user.fullName, username: user.username }]));

      const transactionsWithDetails = transactions.map(transaction => ({
        ...transaction,
        item: transaction.itemId ? itemMap.get(transaction.itemId) : null,
        user: userMap.get(transaction.userId) || null
      }));

      res.json(transactionsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { username, fullName, role } = req.body;

      if (!username || !fullName || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await storage.createUser({ username, fullName, role });
      
      // Log user creation activity
      try {
        // Get first admin user for system operations
        const adminUsers = await storage.getAllUsers();
        const adminUser = adminUsers.find(u => u.role === 'admin');
        
        await storage.createTransaction({
          type: "adjustment",
          quantity: 1,
          userId: adminUser?.id || 26, // Use admin user ID
          itemId: null,
          notes: `User created: ${fullName} (${username}) with role ${role}`
        });
      } catch (logError) {
        console.error("Failed to log user creation:", logError);
      }
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error("User creation error:", error);

      // Handle duplicate username error
      if (error.code === '23505' && error.constraint === 'users_username_unique') {
        return res.status(409).json({ error: "Username already exists" });
      }

      res.status(500).json({ 
        error: "Failed to create user",
        details: error.message 
      });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get user info before deletion for logging
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Log user deletion activity
      try {
        // Get first admin user for system operations
        const adminUsers = await storage.getAllUsers();
        const adminUser = adminUsers.find(u => u.role === 'admin');
        
        await storage.createTransaction({
          type: "adjustment",
          quantity: 1,
          userId: adminUser?.id || 26, // Use admin user ID
          itemId: null,
          notes: `User deleted: ${userToDelete.fullName} (${userToDelete.username})`
        });
      } catch (logError) {
        console.error("Failed to log user deletion:", logError);
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.get("/api/database/backup/export", async (req, res) => {
    try {
      const backup = {
        items: await storage.getAllItems(),
        categories: await storage.getAllCategories(),
        users: await storage.getAllUsers(),
        transactions: await storage.getAllTransactions(),
        exportDate: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="inventoria_backup_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: "Failed to export backup" });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/database/backup/import", upload.single('backup'), async (req, res) => {
    try {
      let backupData;

      // Parse backup data
      if (req.file) {
        try {
          backupData = JSON.parse(req.file.buffer.toString());
        } catch (parseError) {
          return res.status(400).json({ error: "Invalid JSON format in backup file" });
        }
      } else {
        backupData = req.body;
      }

      // Extract data arrays with fallbacks
      const items = backupData.items || (backupData.data && backupData.data.items) || [];
      const categories = backupData.categories || (backupData.data && backupData.data.categories) || [];
      const users = backupData.users || (backupData.data && backupData.data.users) || [];

      // Validate data format
      if (!Array.isArray(items) || !Array.isArray(categories) || !Array.isArray(users)) {
        return res.status(400).json({ error: "Invalid backup data format - expected arrays for items, categories, and users" });
      }

      // Validate minimum required data
      if (categories.length === 0 && items.length > 0) {
        return res.status(400).json({ error: "Cannot import items without categories" });
      }

      if (users.length === 0) {
        return res.status(400).json({ error: "Backup must contain at least one user" });
      }

      // Validate required fields for each data type
      for (const category of categories) {
        if (!category.name) {
          return res.status(400).json({ error: "All categories must have a name" });
        }
      }

      for (const user of users) {
        if (!user.username || !user.fullName || !user.role) {
          return res.status(400).json({ error: "All users must have username, fullName, and role" });
        }
      }

      for (const item of items) {
        if (!item.name || !item.sku || !item.unitPrice) {
          return res.status(400).json({ error: "All items must have name, sku, and unitPrice" });
        }
      }

      console.log(`Starting backup import: ${categories.length} categories, ${users.length} users, ${items.length} items`);

      // Clear existing data only after validation passes
      await storage.clearAllData();

      // Import categories first (needed for items)
      const categoryIdMap = new Map();
      for (const category of categories) {
        try {
          const categoryData = {
            name: category.name,
            description: category.description || null
          };
          const newCategory = await storage.createCategory(categoryData);
          if (category.id) {
            categoryIdMap.set(category.id, newCategory.id);
          }
        } catch (error) {
          console.error(`Failed to create category ${category.name}:`, error);
          throw new Error(`Failed to create category "${category.name}": ${error.message}`);
        }
      }

      // Import users
      const userIdMap = new Map();
      for (const user of users) {
        try {
          const userData = {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive !== undefined ? user.isActive : true
          };
          const newUser = await storage.createUser(userData);
          if (user.id) {
            userIdMap.set(user.id, newUser.id);
          }
        } catch (error) {
          console.error(`Failed to create user ${user.username}:`, error);
          // Don't fail the entire import for duplicate usernames
          if (error.code === '23505' && error.constraint === 'users_username_unique') {
            console.log(`User ${user.username} already exists, skipping...`);
            continue;
          }
          throw new Error(`Failed to create user "${user.username}": ${error.message}`);
        }
      }

      // Import items with updated category IDs
      for (const item of items) {
        try {
          const itemData = {
            name: item.name,
            sku: item.sku,
            description: item.description || null,
            categoryId: item.categoryId && categoryIdMap.has(item.categoryId) 
              ? categoryIdMap.get(item.categoryId) 
              : item.categoryId,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice,
            location: item.location || null,
            minStockLevel: item.minStockLevel || 5,
            status: item.status || 'active',
            rentedCount: item.rentedCount || 0,
            brokenCount: item.brokenCount || 0,
            rentable: item.rentable !== undefined ? item.rentable : true,
            expirable: item.expirable !== undefined ? item.expirable : false,
            expirationDate: item.expirationDate ? (() => {
              try {
                // Handle various date formats
                if (typeof item.expirationDate === 'string') {
                  return new Date(item.expirationDate);
                } else if (item.expirationDate && typeof item.expirationDate === 'object') {
                  return new Date(item.expirationDate);
                }
                return null;
              } catch (error) {
                console.warn(`Invalid expiration date for item ${item.name}:`, item.expirationDate);
                return null;
              }
            })() : null
          };
          await storage.createItem(itemData);
        } catch (error) {
          console.error(`Failed to create item ${item.name}:`, error);
          throw new Error(`Failed to create item "${item.name}": ${error.message}`);
        }
      }

      // Ensure at least one admin user exists
      await storage.createDefaultUser();

      console.log("Backup import completed successfully");
      res.json({ 
        message: "Backup imported successfully",
        imported: {
          categories: categories.length,
          users: users.length,
          items: items.length
        }
      });
    } catch (error) {
      console.error("Backup import failed:", error);
      
      // If import fails, ensure we have default data
      try {
        await storage.createDefaultUser();
      } catch (defaultError) {
        console.error("Failed to create default data after import failure:", defaultError);
      }
      
      res.status(500).json({ 
        error: "Failed to import backup: " + (error.message || "Unknown error"),
        details: "The database has been restored to a safe state with default data."
      });
    }
  });

  app.get("/api/database/export/inventory", async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      const items = await storage.getAllItems();
      const categories = await storage.getAllCategories();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      const exportData = items.map(item => ({
        'Item ID': item.id,
        'Name': item.name,
        'SKU': item.sku,
        'Description': item.description || '',
        'Category': item.categoryId ? categoryMap.get(item.categoryId) : '',
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Location': item.location || '',
        'Min Stock Level': item.minStockLevel || '',
        'Status': item.status,
        'Rented Count': item.rentedCount || 0,
        'Broken Count': item.brokenCount || 0,
        'Expiration Date': item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
        'Created At': item.createdAt.toISOString(),
        'Updated At': item.updatedAt.toISOString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      res.status(500).json({ error: "Failed to export inventory" });
    }
  });

  app.get("/api/database/export/activity", async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      const transactions = await storage.getAllTransactions();
      const items = await storage.getAllItems();
      const users = await storage.getAllUsers();

      const itemMap = new Map(items.map(item => [item.id, item.name]));
      const userMap = new Map(users.map(user => [user.id, user.fullName]));

      const exportData = transactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Item Name': transaction.itemId ? itemMap.get(transaction.itemId) : 'Unknown',
        'Type': transaction.type,
        'Quantity': transaction.quantity,
        'User': transaction.userId ? userMap.get(transaction.userId) : 'Unknown',
        'Notes': transaction.notes || '',
        'Created At': transaction.createdAt.toISOString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activity');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="activity_export.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting activity:', error);
      res.status(500).json({ error: "Failed to export activity" });
    }
  });

  app.post("/api/database/flush-activity", async (req, res) => {
    try {
      await storage.flushActivityLogs();
      res.json({ message: "Activity logs flushed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to flush activity logs" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [totalItems, totalValue, lowStockCount, todayTransactions] = await Promise.all([
        storage.getTotalItemsCount(),
        storage.getTotalInventoryValue(),
        storage.getLowStockCount(),
        storage.getTodayTransactionsCount(),
      ]);

      res.json({
        totalItems,
        totalValue,
        lowStockCount,
        todayTransactions,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get expires soon threshold setting
  app.get("/api/settings/expires-threshold", async (req, res) => {
    try {
      // For now, store in memory. In production, you'd store this in database
      const threshold = global.expiresSoonThreshold || 7;
      res.json({ expiresSoonThreshold: threshold });
    } catch (error) {
      console.error("Error fetching expires threshold:", error);
      res.status(500).json({ error: "Failed to fetch expires threshold" });
    }
  });

  app.put("/api/settings/expires-threshold", async (req, res) => {
    try {
      const { expiresSoonThreshold } = req.body;
      const threshold = parseInt(expiresSoonThreshold);

      if (!expiresSoonThreshold || isNaN(threshold) || threshold < 1 || threshold > 365) {
        return res.status(400).json({ error: "Threshold must be a number between 1 and 365 days" });
      }

      global.expiresSoonThreshold = threshold;

      res.json({ expiresSoonThreshold: threshold });
    } catch (error) {
      console.error("Error updating expires threshold:", error);
      res.status(500).json({ error: "Failed to update expires threshold" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}