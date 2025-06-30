// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  categories;
  items;
  transactions;
  currentUserId;
  currentCategoryId;
  currentItemId;
  currentTransactionId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
    this.items = /* @__PURE__ */ new Map();
    this.transactions = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentItemId = 1;
    this.currentTransactionId = 1;
    this.initializeDefaultData();
  }
  initializeDefaultData() {
    const adminUser = {
      id: this.currentUserId++,
      username: "admin",
      fullName: "Admin User",
      role: "admin",
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(adminUser.id, adminUser);
    const defaultUser = {
      id: this.currentUserId++,
      username: "default",
      fullName: "Default User",
      role: "user",
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(defaultUser.id, defaultUser);
    const overseerUser = {
      id: this.currentUserId++,
      username: "overseer",
      fullName: "Overseer User",
      role: "overseer",
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(overseerUser.id, overseerUser);
    const categoryData = [
      { name: "BSA", description: "BSA related items" },
      { name: "BR", description: "BR related items" },
      { name: "Electronics", description: "Electronic devices and components" },
      { name: "Tools", description: "Hand tools and equipment" },
      { name: "Food", description: "Food items and supplies" },
      { name: "Drinks", description: "Beverages and drink supplies" }
    ];
    categoryData.forEach((cat) => {
      const category = {
        id: this.currentCategoryId++,
        name: cat.name,
        description: cat.description,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.categories.set(category.id, category);
    });
    this.createDefaultItems();
  }
  createDefaultItems() {
    const defaultItems = [
      {
        name: "Laptop Dell XPS 13",
        sku: "LAP-001",
        description: "13-inch ultrabook with Intel i7 processor",
        categoryId: 3,
        quantity: 2,
        unitPrice: "999.99",
        location: "Electronics Storage",
        minStockLevel: 5,
        rentable: true,
        expirable: false
      },
      {
        name: "Office Chair",
        sku: "CHR-001",
        description: "Ergonomic office chair with lumbar support",
        categoryId: 1,
        quantity: 1,
        unitPrice: "299.99",
        location: "Furniture Storage",
        minStockLevel: 3,
        rentable: true,
        expirable: false
      },
      {
        name: "Milk Cartons",
        sku: "MILK-001",
        description: "Fresh whole milk",
        categoryId: 5,
        quantity: 8,
        unitPrice: "3.50",
        location: "Cold Storage",
        minStockLevel: 10,
        rentable: false,
        expirable: true,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1e3)
      },
      {
        name: "Protein Bars",
        sku: "PROT-001",
        description: "High protein energy bars",
        categoryId: 5,
        quantity: 15,
        unitPrice: "2.99",
        location: "Pantry",
        minStockLevel: 5,
        rentable: false,
        expirable: true,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3)
      }
    ];
    defaultItems.forEach((itemData) => {
      const item = {
        id: this.currentItemId++,
        name: itemData.name,
        sku: itemData.sku,
        description: itemData.description,
        categoryId: itemData.categoryId,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        location: itemData.location,
        minStockLevel: itemData.minStockLevel,
        status: "active",
        rentedCount: 0,
        brokenCount: 0,
        rentable: itemData.rentable,
        expirable: itemData.expirable,
        expirationDate: itemData.expirationDate || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.items.set(item.id, item);
    });
  }
  async clearAllData() {
    this.items.clear();
    this.categories.clear();
    this.users.clear();
    this.transactions.clear();
    this.currentItemId = 1;
    this.currentCategoryId = 1;
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.initializeDefaultData();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const user = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(user.id, user);
    await this.logTransaction({
      itemId: null,
      userId: 1,
      type: "user_created",
      quantity: 1,
      unitPrice: "0.00",
      notes: `User created: ${user.fullName} (${user.username})`
    });
    return user;
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async updateUser(id, userData) {
    const existing = this.users.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...userData, updatedAt: /* @__PURE__ */ new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id) {
    return this.users.delete(id);
  }
  async getCategory(id) {
    return this.categories.get(id);
  }
  async getAllCategories() {
    return Array.from(this.categories.values());
  }
  async createCategory(insertCategory) {
    const category = {
      ...insertCategory,
      id: this.currentCategoryId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.categories.set(category.id, category);
    return category;
  }
  async updateCategory(id, categoryUpdate) {
    const existing = this.categories.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...categoryUpdate };
    this.categories.set(id, updated);
    return updated;
  }
  async deleteCategory(id) {
    for (const item of this.items.values()) {
      if (item.categoryId === id) {
        throw new Error("Cannot delete category that contains items");
      }
    }
    return this.categories.delete(id);
  }
  async getItem(id) {
    return this.items.get(id);
  }
  async getAllItems() {
    return Array.from(this.items.values()).sort((a, b) => b.id - a.id);
  }
  async getItemsByCategoryId(categoryId) {
    return Array.from(this.items.values()).filter((item) => item.categoryId === categoryId).sort((a, b) => b.id - a.id);
  }
  async getLowStockItems() {
    const lowStockItems = Array.from(this.items.values()).filter((item) => {
      const minStock = item.minStockLevel || 5;
      return item.quantity < minStock;
    });
    const categories2 = await this.getAllCategories();
    const categoryMap = new Map(categories2.map((cat) => [cat.id, cat.name]));
    return lowStockItems.map((item) => ({
      ...item,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) : null
    }));
  }
  async searchItems(query) {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(
      (item) => item.name.toLowerCase().includes(lowercaseQuery) || item.sku.toLowerCase().includes(lowercaseQuery) || item.description && item.description.toLowerCase().includes(lowercaseQuery)
    ).sort((a, b) => b.id - a.id);
  }
  async createItem(insertItem) {
    const newItem = {
      id: this.currentItemId++,
      name: insertItem.name,
      sku: insertItem.sku,
      description: insertItem.description || null,
      categoryId: insertItem.categoryId || null,
      quantity: insertItem.quantity || 0,
      unitPrice: insertItem.unitPrice,
      location: insertItem.location || null,
      minStockLevel: insertItem.minStockLevel || 5,
      status: insertItem.status || "active",
      rentedCount: insertItem.rentedCount || 0,
      brokenCount: insertItem.brokenCount || 0,
      rentable: insertItem.rentable !== void 0 ? insertItem.rentable : true,
      expirable: insertItem.expirable !== void 0 ? insertItem.expirable : false,
      expirationDate: insertItem.expirationDate || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.items.set(newItem.id, newItem);
    await this.logTransaction({
      itemId: newItem.id,
      userId: 1,
      type: "in",
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      notes: `Item created: ${newItem.name}`
    });
    return newItem;
  }
  async updateItem(id, itemUpdate) {
    const existing = this.items.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...itemUpdate,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.items.set(id, updated);
    if (itemUpdate.quantity !== void 0 && itemUpdate.quantity !== existing.quantity) {
      const quantityDiff = itemUpdate.quantity - existing.quantity;
      await this.logTransaction({
        itemId: id,
        userId: 1,
        type: quantityDiff > 0 ? "in" : quantityDiff < 0 ? "out" : "adjustment",
        quantity: Math.abs(quantityDiff),
        unitPrice: updated.unitPrice,
        notes: `Quantity ${quantityDiff > 0 ? "increased" : "decreased"} by ${Math.abs(quantityDiff)}`
      });
    }
    if (itemUpdate.brokenCount !== void 0 && itemUpdate.brokenCount !== (existing.brokenCount || 0)) {
      const brokenDiff = itemUpdate.brokenCount - (existing.brokenCount || 0);
      if (brokenDiff > 0) {
        await this.logTransaction({
          itemId: id,
          userId: 1,
          type: "adjustment",
          quantity: brokenDiff,
          unitPrice: updated.unitPrice,
          notes: `Broken count increased by ${brokenDiff}`
        });
      }
    }
    return updated;
  }
  async deleteItem(id) {
    return this.items.delete(id);
  }
  async rentItem(itemId, quantity, userId = 1) {
    const item = await this.getItem(itemId);
    if (!item) return null;
    if (item.quantity < quantity) {
      throw new Error("Insufficient stock available");
    }
    const updatedItem = {
      ...item,
      quantity: item.quantity - quantity,
      rentedCount: (item.rentedCount || 0) + quantity,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.items.set(itemId, updatedItem);
    await this.logTransaction({
      itemId,
      userId,
      type: "out",
      quantity,
      unitPrice: item.unitPrice,
      notes: `Item rented - ${quantity} units`
    });
    return updatedItem;
  }
  async returnItem(itemId, quantity, userId = 1) {
    const item = await this.getItem(itemId);
    if (!item) return null;
    if ((item.rentedCount || 0) < quantity) {
      throw new Error("Cannot return more items than are currently rented");
    }
    const updatedItem = {
      ...item,
      quantity: item.quantity + quantity,
      rentedCount: (item.rentedCount || 0) - quantity,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.items.set(itemId, updatedItem);
    await this.logTransaction({
      itemId,
      userId,
      type: "in",
      quantity,
      unitPrice: item.unitPrice,
      notes: `Item returned - ${quantity} units`
    });
    return updatedItem;
  }
  async getTotalItemsCount() {
    let total = 0;
    this.items.forEach((item) => {
      total += item.quantity || 0;
    });
    return total;
  }
  async getTotalInventoryValue() {
    let total = 0;
    this.items.forEach((item) => {
      const quantity = item.quantity || 0;
      const price = parseFloat(item.unitPrice) || 0;
      total += quantity * price;
    });
    return Math.round(total * 100) / 100;
  }
  async getLowStockCount() {
    return Array.from(this.items.values()).filter((item) => {
      const minStock = item.minStockLevel || 5;
      return item.quantity < minStock;
    }).length;
  }
  async getTodayTransactionsCount() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.createdAt >= today
    ).length;
  }
  async getBrokenItemsCount() {
    return Array.from(this.items.values()).reduce((total, item) => {
      return total + (item.brokenCount || 0);
    }, 0);
  }
  async getRentedItemsCount() {
    return Array.from(this.items.values()).reduce((total, item) => {
      return total + (item.rentedCount || 0);
    }, 0);
  }
  async createTransaction(insertTransaction) {
    const transaction = {
      ...insertTransaction,
      id: this.currentTransactionId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
  async getRecentTransactions(limit) {
    const allTransactions = Array.from(this.transactions.values());
    const sortedTransactions = allTransactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (limit) {
      return sortedTransactions.slice(0, limit);
    }
    return sortedTransactions;
  }
  async getAllTransactions(limit) {
    let transactionList = Array.from(this.transactions.values());
    if (limit) {
      transactionList = transactionList.slice(0, limit);
    }
    return transactionList;
  }
  async logTransaction(transactionData) {
    const transaction = {
      ...transactionData,
      id: this.currentTransactionId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
  async flushActivityLogs() {
    this.transactions.clear();
    this.currentTransactionId = 1;
    console.log("Activity logs flushed");
  }
  async getExpiringSoonItems(thresholdDays) {
    const currentDate = /* @__PURE__ */ new Date();
    const thresholdDate = new Date(currentDate.getTime() + thresholdDays * 24 * 60 * 60 * 1e3);
    const expiringSoonItems = Array.from(this.items.values()).filter((item) => {
      if (!item.expirable || !item.expirationDate) return false;
      try {
        const expirationDate = new Date(item.expirationDate);
        if (isNaN(expirationDate.getTime())) return false;
        return expirationDate >= currentDate && expirationDate <= thresholdDate;
      } catch (error) {
        console.error("Error parsing expiration date:", error);
        return false;
      }
    });
    const categories2 = await this.getAllCategories();
    const categoryMap = new Map(categories2.map((cat) => [cat.id, cat.name]));
    return expiringSoonItems.map((item) => ({
      ...item,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) : null
    }));
  }
  async createDefaultUser() {
    console.log("Default users already initialized");
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  // admin, user
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  quantity: integer("quantity").notNull().default(0),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  location: text("location"),
  minStockLevel: integer("min_stock_level").default(5),
  status: text("status").notNull().default("active"),
  // active, inactive, discontinued
  rentedCount: integer("rented_count").notNull().default(0),
  brokenCount: integer("broken_count").notNull().default(0),
  expirationDate: timestamp("expiration_date"),
  rentable: boolean("rentable").notNull().default(true),
  expirable: boolean("expirable").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  // in, out, adjustment
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userSchema = createInsertSchema(users, {
  role: z.enum(["admin", "user", "overseer"])
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});
var ItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  price: z.number(),
  category: z.string(),
  status: z.enum(["Full", "Saturated", "Low stock"]).default("Full"),
  rentedCount: z.number().default(0),
  expirationDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// server/routes.ts
import { z as z2 } from "zod";
import multer from "multer";
async function registerRoutes(app2) {
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getAllCategories();
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [totalItems, totalValue, lowStockCount, todayTransactions] = await Promise.all([
        storage.getTotalItemsCount(),
        storage.getTotalInventoryValue(),
        storage.getLowStockCount(),
        storage.getTodayTransactionsCount()
      ]);
      res.json({
        totalItems,
        totalValue,
        lowStockCount,
        todayTransactions
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
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
  app2.get("/api/items", async (req, res) => {
    try {
      const { search, category } = req.query;
      let items2;
      if (search) {
        items2 = await storage.searchItems(search);
      } else if (category && category !== "all") {
        if (category === "uncategorized") {
          items2 = (await storage.getAllItems()).filter((item) => !item.categoryId);
        } else {
          items2 = await storage.getItemsByCategoryId(parseInt(category));
        }
      } else {
        items2 = await storage.getAllItems();
      }
      const categories2 = await storage.getAllCategories();
      const categoryMap = new Map(categories2.map((cat) => [cat.id, cat.name]));
      const itemsWithCategory = items2.map((item) => ({
        ...item,
        categoryName: item.categoryId ? categoryMap.get(item.categoryId) : "Uncategorized"
      }));
      res.json(itemsWithCategory);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });
  app2.get("/api/items/low-stock", async (req, res) => {
    try {
      const items2 = await storage.getLowStockItems();
      res.json(items2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });
  app2.get("/api/items/expires-soon", async (req, res) => {
    try {
      const threshold = global.expiresSoonThreshold || 7;
      const items2 = await storage.getExpiringSoonItems(threshold);
      res.json(items2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiring items" });
    }
  });
  app2.get("/api/items/:id", async (req, res) => {
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
  app2.post("/api/items", async (req, res) => {
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
        rentable: req.body.rentable !== void 0 ? req.body.rentable : true,
        expirable: req.body.expirable !== void 0 ? req.body.expirable : false,
        expirationDate: req.body.expirationDate ? (() => {
          const dateStr = req.body.expirationDate;
          if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/");
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create item", message: error.message });
      }
    }
  });
  app2.put("/api/items/:id", async (req, res) => {
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
        rentable: req.body.rentable !== void 0 ? req.body.rentable : true,
        expirable: req.body.expirable !== void 0 ? req.body.expirable : false,
        expirationDate: req.body.expirationDate ? (() => {
          const dateStr = req.body.expirationDate;
          if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/");
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return new Date(dateStr);
        })() : null
      };
      const validatedData = insertItemSchema.partial().parse(processedData);
      const item = await storage.updateItem(id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update item" });
      }
    }
  });
  app2.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);
      if (!success) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });
  app2.post("/api/items/:id/rent", async (req, res) => {
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
      res.json(item);
    } catch (error) {
      console.error("Error renting item:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/items/:id/return", async (req, res) => {
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
      res.json(item);
    } catch (error) {
      console.error("Error returning item:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const transactions2 = await storage.getAllTransactions(limit);
      const items2 = await storage.getAllItems();
      const users2 = await storage.getAllUsers();
      const itemMap = new Map(items2.map((item) => [item.id, { id: item.id, name: item.name, sku: item.sku }]));
      const userMap = new Map(users2.map((user) => [user.id, { id: user.id, fullName: user.fullName, username: user.username }]));
      const transactionsWithDetails = transactions2.map((transaction) => ({
        ...transaction,
        item: transaction.itemId ? itemMap.get(transaction.itemId) : null,
        user: userMap.get(transaction.userId) || null
      }));
      res.json(transactionsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.get("/api/database/backup/export", async (req, res) => {
    try {
      const backup = {
        items: await storage.getAllItems(),
        categories: await storage.getAllCategories(),
        users: await storage.getAllUsers(),
        transactions: await storage.getAllTransactions(),
        exportDate: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="inventoria_backup_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: "Failed to export backup" });
    }
  });
  const upload = multer({ storage: multer.memoryStorage() });
  app2.post("/api/database/backup/import", upload.single("backup"), async (req, res) => {
    try {
      let backupData;
      if (req.file) {
        backupData = JSON.parse(req.file.buffer.toString());
      } else {
        backupData = req.body;
      }
      const items2 = backupData.items || backupData.data && backupData.data.items || [];
      const categories2 = backupData.categories || backupData.data && backupData.data.categories || [];
      const users2 = backupData.users || backupData.data && backupData.data.users || [];
      if (!Array.isArray(items2) || !Array.isArray(categories2) || !Array.isArray(users2)) {
        return res.status(400).json({ error: "Invalid backup data format - expected arrays" });
      }
      await storage.clearAllData();
      for (const category of categories2) {
        await storage.createCategory(category);
      }
      for (const user of users2) {
        await storage.createUser(user);
      }
      for (const item of items2) {
        await storage.createItem(item);
      }
      res.json({ message: "Backup imported successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to import backup: " + error.message });
    }
  });
  app2.get("/api/database/export/inventory", async (req, res) => {
    try {
      const XLSX = await import("xlsx");
      const items2 = await storage.getAllItems();
      const categories2 = await storage.getAllCategories();
      const categoryMap = new Map(categories2.map((cat) => [cat.id, cat.name]));
      const exportData = items2.map((item) => ({
        "Item ID": item.id,
        "Name": item.name,
        "SKU": item.sku,
        "Description": item.description || "",
        "Category": item.categoryId ? categoryMap.get(item.categoryId) : "",
        "Quantity": item.quantity,
        "Unit Price": item.unitPrice,
        "Location": item.location || "",
        "Min Stock Level": item.minStockLevel || "",
        "Status": item.status,
        "Rented Count": item.rentedCount || 0,
        "Broken Count": item.brokenCount || 0,
        "Expiration Date": item.expirationDate ? item.expirationDate.toISOString().split("T")[0] : "",
        "Created At": item.createdAt.toISOString(),
        "Updated At": item.updatedAt.toISOString()
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="inventory_export.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting inventory:", error);
      res.status(500).json({ error: "Failed to export inventory" });
    }
  });
  app2.get("/api/database/export/activity", async (req, res) => {
    try {
      const XLSX = await import("xlsx");
      const transactions2 = await storage.getAllTransactions();
      const items2 = await storage.getAllItems();
      const users2 = await storage.getAllUsers();
      const itemMap = new Map(items2.map((item) => [item.id, item.name]));
      const userMap = new Map(users2.map((user) => [user.id, user.fullName]));
      const exportData = transactions2.map((transaction) => ({
        "Transaction ID": transaction.id,
        "Item Name": transaction.itemId ? itemMap.get(transaction.itemId) : "Unknown",
        "Type": transaction.type,
        "Quantity": transaction.quantity,
        "User": transaction.userId ? userMap.get(transaction.userId) : "Unknown",
        "Notes": transaction.notes || "",
        "Created At": transaction.createdAt.toISOString()
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activity");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="activity_export.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting activity:", error);
      res.status(500).json({ error: "Failed to export activity" });
    }
  });
  app2.post("/api/database/flush-activity", async (req, res) => {
    try {
      await storage.flushActivityLogs();
      res.json({ message: "Activity logs flushed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to flush activity logs" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [totalItems, totalValue, lowStockCount, todayTransactions] = await Promise.all([
        storage.getTotalItemsCount(),
        storage.getTotalInventoryValue(),
        storage.getLowStockCount(),
        storage.getTodayTransactionsCount()
      ]);
      res.json({
        totalItems,
        totalValue,
        lowStockCount,
        todayTransactions
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/settings/expires-threshold", async (req, res) => {
    try {
      const threshold = global.expiresSoonThreshold || 7;
      res.json({ expiresSoonThreshold: threshold });
    } catch (error) {
      console.error("Error fetching expires threshold:", error);
      res.status(500).json({ error: "Failed to fetch expires threshold" });
    }
  });
  app2.put("/api/settings/expires-threshold", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await storage.createDefaultUser();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = parseInt(process.env.PORT || "5000");
  const HOST = process.env.HOST || (process.platform === "win32" ? "localhost" : "0.0.0.0");
  server.listen({
    port: PORT,
    host: HOST,
    reusePort: true
  }, () => {
    log(`serving on port ${PORT}`);
  });
})();
