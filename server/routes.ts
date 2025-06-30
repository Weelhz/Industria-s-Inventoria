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
      
      const itemsWithCategory = await storage.getItemsByCategoryId(id);
      if (itemsWithCategory.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category", 
          message: `Category is being used by ${itemsWithCategory.length} item(s). Please reassign or delete those items first.`
        });
      }
      
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category", message: error.message });
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

      try {
        await storage.createTransaction({
          type: "out",
          quantity: quantity,
          userId: userId || 26,
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

      try {
        await storage.createTransaction({
          type: "in",
          quantity: quantity,
          userId: userId || 26,
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
      
      try {
        const adminUsers = await storage.getAllUsers();
        const adminUser = adminUsers.find(u => u.role === 'admin');
        
        await storage.createTransaction({
          type: "adjustment",
          quantity: 1,
          userId: adminUser?.id || 26,
          itemId: null,
          notes: `User created: ${fullName} (${username}) with role ${role}`
        });
      } catch (logError) {
        console.error("Failed to log user creation:", logError);
      }
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error("User creation error:", error);

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
      
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const allUsers = await storage.getAllUsers();
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      if (userToDelete.role === 'admin' && adminUsers.length === 1) {
        return res.status(400).json({ error: "Cannot delete the last admin user" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      
      try {
        const remainingAdminUsers = await storage.getAllUsers();
        const adminUser = remainingAdminUsers.find(u => u.role === 'admin');
        
        if (adminUser) {
          await storage.createTransaction({
            type: "adjustment",
            quantity: 1,
            userId: adminUser.id,
            itemId: null,
            notes: `User deleted: ${userToDelete.fullName} (${userToDelete.username})`
          });
        }
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

      if (req.file) {
        try {
          backupData = JSON.parse(req.file.buffer.toString());
        } catch (parseError) {
          return res.status(400).json({ error: "Invalid JSON format in backup file" });
        }
      } else {
        backupData = req.body;
      }

      const items = backupData.items || (backupData.data && backupData.data.items) || [];
      const categories = backupData.categories || (backupData.data && backupData.data.categories) || [];
      const users = backupData.users || (backupData.data && backupData.data.users) || [];

      if (!Array.isArray(items) || !Array.isArray(categories) || !Array.isArray(users)) {
        return res.status(400).json({ error: "Invalid backup data format - expected arrays for items, categories, and users" });
      }

      if (categories.length === 0 && items.length > 0) {
        return res.status(400).json({ error: "Cannot import items without categories" });
      }

      if (users.length === 0) {
        return res.status(400).json({ error: "Backup must contain at least one user" });
      }

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

      await storage.clearAllData();

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
          if (error.code === '23505' && error.constraint === 'users_username_unique') {
            console.log(`User ${user.username} already exists, skipping...`);
            continue;
          }
          throw new Error(`Failed to create user "${user.username}": ${error.message}`);
        }
      }

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
      const { 
        category, 
        status, 
        rentable, 
        expirable, 
        lowStock,
        expired 
      } = req.query;
      
      let items = await storage.getAllItems();
      const categories = await storage.getAllCategories();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      if (category && category !== 'all') {
        if (category === 'uncategorized') {
          items = items.filter(item => !item.categoryId);
        } else {
          const categoryObj = categories.find(cat => cat.name === category);
          if (categoryObj) {
            items = items.filter(item => item.categoryId === categoryObj.id);
          }
        }
      }

      if (status && status !== 'all') {
        items = items.filter(item => item.status === status);
      }

      if (rentable !== undefined && rentable !== 'all') {
        const isRentable = rentable === 'true';
        items = items.filter(item => item.rentable === isRentable);
      }

      if (expirable !== undefined && expirable !== 'all') {
        const isExpirable = expirable === 'true';
        items = items.filter(item => item.expirable === isExpirable);
      }

      if (lowStock === 'true') {
        items = items.filter(item => {
          const minStock = item.minStockLevel || 5;
          return item.quantity < minStock;
        });
      }

      if (expired === 'true') {
        const now = new Date();
        items = items.filter(item => 
          item.expirable && 
          item.expirationDate && 
          item.expirationDate <= now
        );
      }

      const exportData = items.map(item => ({
        'Item ID': item.id,
        'Name': item.name,
        'SKU': item.sku,
        'Description': item.description || '',
        'Category': item.categoryId ? categoryMap.get(item.categoryId) : 'Uncategorized',
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Total Value': (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
        'Location': item.location || '',
        'Min Stock Level': item.minStockLevel || 5,
        'Status': item.status || 'active',
        'Rentable': item.rentable ? 'Yes' : 'No',
        'Expirable': item.expirable ? 'Yes' : 'No',
        'Rented Count': item.rentedCount || 0,
        'Broken Count': item.brokenCount || 0,
        'Available Count': (item.quantity - (item.rentedCount || 0)),
        'Expiration Date': item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
        'Days Until Expiry': item.expirationDate ? Math.ceil((item.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : '',
        'Is Low Stock': (item.quantity < (item.minStockLevel || 5)) ? 'Yes' : 'No',
        'Is Expired': (item.expirable && item.expirationDate && item.expirationDate <= new Date()) ? 'Yes' : 'No',
        'Created At': item.createdAt.toISOString(),
        'Updated At': item.updatedAt.toISOString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [];
      const headers = Object.keys(exportData[0] || {});
      headers.forEach((header, i) => {
        const maxLength = Math.max(
          header.length,
          ...exportData.map(row => String(row[header] || '').length)
        );
        colWidths[i] = { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const filterParts = [];
      if (category && category !== 'all') filterParts.push(`category-${category}`);
      if (status && status !== 'all') filterParts.push(`status-${status}`);
      if (rentable !== undefined) filterParts.push(`rentable-${rentable}`);
      if (expirable !== undefined) filterParts.push(`expirable-${expirable}`);
      if (lowStock === 'true') filterParts.push('low-stock');
      if (expired === 'true') filterParts.push('expired');
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      const filename = `inventory_export${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      res.status(500).json({ error: "Failed to export inventory" });
    }
  });

  app.get("/api/database/export/activity", async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      const { 
        type, 
        userId, 
        itemId, 
        dateFrom, 
        dateTo,
        days 
      } = req.query;
      
      let transactions = await storage.getAllTransactions();
      const items = await storage.getAllItems();
      const users = await storage.getAllUsers();

      const itemMap = new Map(items.map(item => [item.id, item.name]));
      const userMap = new Map(users.map(user => [user.id, user.fullName]));

      if (type && type !== 'all') {
        transactions = transactions.filter(transaction => transaction.type === type);
      }

      if (userId && userId !== 'all') {
        const userIdNum = parseInt(userId as string);
        transactions = transactions.filter(transaction => transaction.userId === userIdNum);
      }

      if (itemId && itemId !== 'all') {
        const itemIdNum = parseInt(itemId as string);
        transactions = transactions.filter(transaction => transaction.itemId === itemIdNum);
      }

      if (days) {
        const daysNum = parseInt(days as string);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysNum);
        transactions = transactions.filter(transaction => 
          new Date(transaction.createdAt) >= cutoffDate
        );
      } else {
        if (dateFrom) {
          const fromDate = new Date(dateFrom as string);
          transactions = transactions.filter(transaction => 
            new Date(transaction.createdAt) >= fromDate
          );
        }

        if (dateTo) {
          const toDate = new Date(dateTo as string);
          toDate.setHours(23, 59, 59, 999);
          transactions = transactions.filter(transaction => 
            new Date(transaction.createdAt) <= toDate
          );
        }
      }

      const exportData = transactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Date': new Date(transaction.createdAt).toLocaleDateString(),
        'Time': new Date(transaction.createdAt).toLocaleTimeString(),
        'Type': transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        'Item Name': transaction.itemId ? itemMap.get(transaction.itemId) : 'System/Unknown',
        'Item ID': transaction.itemId || '',
        'Quantity': transaction.quantity,
        'Unit Price': transaction.unitPrice || '0.00',
        'Total Value': ((transaction.quantity || 0) * parseFloat(transaction.unitPrice || '0')).toFixed(2),
        'User': transaction.userId ? userMap.get(transaction.userId) : 'System',
        'User ID': transaction.userId || '',
        'Notes': transaction.notes || '',
        'Created At': transaction.createdAt.toISOString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [];
      const headers = Object.keys(exportData[0] || {});
      headers.forEach((header, i) => {
        const maxLength = Math.max(
          header.length,
          ...exportData.map(row => String(row[header] || '').length)
        );
        colWidths[i] = { wch: Math.min(maxLength + 2, 30) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activity');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const filterParts = [];
      if (type && type !== 'all') filterParts.push(`type-${type}`);
      if (userId && userId !== 'all') filterParts.push(`user-${userId}`);
      if (itemId && itemId !== 'all') filterParts.push(`item-${itemId}`);
      if (days) filterParts.push(`${days}days`);
      if (dateFrom) filterParts.push(`from-${dateFrom}`);
      if (dateTo) filterParts.push(`to-${dateTo}`);
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      const filename = `activity_export${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

  app.get("/api/settings/expires-threshold", async (req, res) => {
    try {
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
