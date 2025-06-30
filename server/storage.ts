import { 
  users, categories, items, transactions,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Item, type InsertItem,
  type Transaction, type InsertTransaction
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'email'>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<Omit<InsertUser, 'email'>>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  getItem(id: number): Promise<Item | undefined>;
  getAllItems(): Promise<Item[]>;
  getItemsByCategoryId(categoryId: number): Promise<Item[]>;
  getLowStockItems(): Promise<Item[]>;
  searchItems(query: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  rentItem(itemId: number, quantity: number, userId?: number): Promise<Item | null>;
  returnItem(itemId: number, quantity: number, userId?: number): Promise<Item | null>;

  getTotalItemsCount(): Promise<number>;
  getTotalInventoryValue(): Promise<number>;
  getLowStockCount(): Promise<number>;
  getTodayTransactionsCount(): Promise<number>;
  getBrokenItemsCount(): Promise<number>;
  getRentedItemsCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private items: Map<number, Item>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentItemId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.items = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentItemId = 1;
    this.currentTransactionId = 1;
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      fullName: "Admin User",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    const defaultUser: User = {
      id: this.currentUserId++,
      username: "default",
      fullName: "Default User",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    const overseerUser: User = {
      id: this.currentUserId++,
      username: "overseer",
      fullName: "Overseer User",
      role: "overseer",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(overseerUser.id, overseerUser);

    const categoryData = [
      { name: "BSA", description: "BSA related items" },
      { name: "BR", description: "BR related items" },
      { name: "Electronics", description: "Electronic devices and components" },
      { name: "Tools", description: "Hand tools and equipment" },
      { name: "Food", description: "Food items and supplies" },
      { name: "Drinks", description: "Beverages and drink supplies" },
    ];

    categoryData.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        description: cat.description,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    });

    this.createDefaultItems();
  }

  private createDefaultItems() {
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
        expirable: false,
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
        expirable: false,
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
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
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
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      }
    ];

    defaultItems.forEach(itemData => {
      const item: Item = {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.items.set(item.id, item);
    });
  }

  async clearAllData(): Promise<void> {
    this.items.clear();
    this.categories.clear();
    this.users.clear();
    this.transactions.clear();
    this.currentItemId = 1;
    this.currentCategoryId = 1;
    this.currentUserId = 1;
    this.currentTransactionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: Omit<InsertUser, 'email'>): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);

    await this.logTransaction({
      itemId: null,
      userId: 1,
      type: 'user_created',
      quantity: 1,
      unitPrice: '0.00',
      notes: `User created: ${user.fullName} (${user.username})`
    });

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'email'>>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = { ...existing, ...userData, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    if (user.username === 'admin' || id === 1) {
      throw new Error("Cannot delete the primary admin user");
    }

    const adminUsers = Array.from(this.users.values()).filter(u => u.role === 'admin');
    if (user.role === 'admin' && adminUsers.length <= 1) {
      throw new Error("Cannot delete the last admin user");
    }

    return this.users.delete(id);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: this.currentCategoryId++,
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated: Category = { ...existing, ...categoryUpdate };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    for (const item of this.items.values()) {
      if (item.categoryId === id) {
        throw new Error("Cannot delete category that contains items");
      }
    }
    return this.categories.delete(id);
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values()).sort((a, b) => b.id - a.id);
  }

  async getItemsByCategoryId(categoryId: number): Promise<Item[]> {
    return Array.from(this.items.values())
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => b.id - a.id);
  }

  async getLowStockItems(): Promise<Item[]> {
    const lowStockItems = Array.from(this.items.values()).filter(item => {
      const minStock = item.minStockLevel || 5;
      return item.quantity < minStock;
    });

    const categories = await this.getAllCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    return lowStockItems.map(item => ({
      ...item,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) : null,
    }));
  }

  async searchItems(query: string): Promise<Item[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.items.values())
      .filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.sku.toLowerCase().includes(lowercaseQuery) ||
        (item.description && item.description.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => b.id - a.id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const newItem: Item = {
      id: this.currentItemId++,
      name: insertItem.name,
      sku: insertItem.sku,
      description: insertItem.description || null,
      categoryId: insertItem.categoryId || null,
      quantity: insertItem.quantity || 0,
      unitPrice: insertItem.unitPrice,
      location: insertItem.location || null,
      minStockLevel: insertItem.minStockLevel || 5,
      status: insertItem.status || 'active',
      rentedCount: 0,
      brokenCount: 0,
      rentable: insertItem.rentable !== undefined ? insertItem.rentable : true,
      expirable: insertItem.expirable !== undefined ? insertItem.expirable : false,
      expirationDate: insertItem.expirationDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.set(newItem.id, newItem);

    try {
      await this.logTransaction({
        itemId: newItem.id,
        userId: null,
        type: 'in',
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        notes: `Item created: ${newItem.name}`
      });
    } catch (error) {
      console.warn("Failed to log item creation transaction:", error);
    }

    return newItem;
  }

  async updateItem(id: number, itemUpdate: Partial<InsertItem>): Promise<Item | undefined> {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    const updated: Item = { 
      ...existing, 
      ...itemUpdate, 
      updatedAt: new Date() 
    };
    this.items.set(id, updated);

    if (itemUpdate.quantity !== undefined && itemUpdate.quantity !== existing.quantity) {
      const quantityDiff = itemUpdate.quantity - existing.quantity;
      try {
        await this.logTransaction({
          itemId: id,
          userId: null,
          type: quantityDiff > 0 ? 'in' : quantityDiff < 0 ? 'out' : 'adjustment',
          quantity: Math.abs(quantityDiff),
          unitPrice: updated.unitPrice,
          notes: `Quantity ${quantityDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(quantityDiff)}`
        });
      } catch (error) {
        console.warn("Failed to log quantity update transaction:", error);
      }
    }

    if (itemUpdate.brokenCount !== undefined && itemUpdate.brokenCount !== (existing.brokenCount || 0)) {
      const brokenDiff = itemUpdate.brokenCount - (existing.brokenCount || 0);
      if (brokenDiff > 0) {
        try {
          await this.logTransaction({
            itemId: id,
            userId: null,
            type: 'adjustment',
            quantity: brokenDiff,
            unitPrice: updated.unitPrice,
            notes: `Broken count increased by ${brokenDiff}`
          });
        } catch (error) {
          console.warn("Failed to log broken count transaction:", error);
        }
      }
    }

    return updated;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async rentItem(itemId: number, quantity: number, userId: number = 26): Promise<Item | null> {
    const item = await this.getItem(itemId);
    if (!item) return null;

    if (item.quantity < quantity) {
      throw new Error("Insufficient stock available");
    }

    const updatedItem: Item = {
      ...item,
      quantity: item.quantity - quantity,
      rentedCount: (item.rentedCount || 0) + quantity,
      updatedAt: new Date(),
    };

    this.items.set(itemId, updatedItem);

    try {
      await this.logTransaction({
        itemId: itemId,
        userId: userId,
        type: 'out',
        quantity: quantity,
        unitPrice: item.unitPrice,
        notes: `Item rented - ${quantity} units`
      });
    } catch (error) {
      console.warn("Failed to log rent transaction:", error);
    }

    return updatedItem;
  }

  async returnItem(itemId: number, quantity: number, userId: number = 26): Promise<Item | null> {
    const item = await this.getItem(itemId);
    if (!item) return null;

    if ((item.rentedCount || 0) < quantity) {
      throw new Error("Cannot return more items than are currently rented");
    }

    const updatedItem: Item = {
      ...item,
      quantity: item.quantity + quantity,
      rentedCount: (item.rentedCount || 0) - quantity,
      updatedAt: new Date(),
    };

    this.items.set(itemId, updatedItem);

    try {
      await this.logTransaction({
        itemId: itemId,
        userId: userId,
        type: 'in',
        quantity: quantity,
        unitPrice: item.unitPrice,
        notes: `Item returned - ${quantity} units`
      });
    } catch (error) {
      console.warn("Failed to log return transaction:", error);
    }

    return updatedItem;
  }

  async getTotalItemsCount(): Promise<number> {
    let total = 0;
    this.items.forEach(item => {
      total += item.quantity || 0;
    });
    return total;
  }

  async getTotalInventoryValue(): Promise<number> {
    let total = 0;
    this.items.forEach(item => {
      const quantity = item.quantity || 0;
      const price = parseFloat(item.unitPrice) || 0;
      total += quantity * price;
    });
    return Math.round(total * 100) / 100;
  }

  async getLowStockCount(): Promise<number> {
    return Array.from(this.items.values()).filter(item => {
      const minStock = item.minStockLevel || 5;
      return item.quantity < minStock;
    }).length;
  }

  async getTodayTransactionsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.transactions.values()).filter(transaction =>
      transaction.createdAt >= today
    ).length;
  }

  async getBrokenItemsCount(): Promise<number> {
    return Array.from(this.items.values()).reduce((total, item) => {
      return total + (item.brokenCount || 0);
    }, 0);
  }

  async getRentedItemsCount(): Promise<number> {
    return Array.from(this.items.values()).reduce((total, item) => {
      return total + (item.rentedCount || 0);
    }, 0);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      id: this.currentTransactionId++,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getRecentTransactions(limit?: number): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values());
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (limit) {
      return sortedTransactions.slice(0, limit);
    }

    return sortedTransactions;
  }

  async getAllTransactions(limit?: number): Promise<any[]> {
    let transactionList = Array.from(this.transactions.values());
    if (limit) {
      transactionList = transactionList.slice(0, limit);
    }
    return transactionList;
  }

  async logTransaction(transactionData: any): Promise<Transaction> {
    const transaction: Transaction = {
      ...transactionData,
      id: this.currentTransactionId++,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async flushActivityLogs(): Promise<void> {
    this.transactions.clear();
    this.currentTransactionId = 1;
    console.log("Activity logs flushed");
  }

  async getExpiringSoonItems(daysThreshold: number = 7): Promise<Item[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    return Array.from(this.items.values()).filter(item => 
      item.expirable &&
      item.expirationDate && 
      item.expirationDate <= threshold &&
      item.status === "active"
    );
  }

  async createDefaultUser(): Promise<void> {
    console.log("Default users already initialized");
  }
}

import { db } from "./db";
import { eq, desc, and, gte, sql, asc } from "drizzle-orm";

import pkg from "pg";
const { Client } = pkg;

class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Omit<InsertUser, 'email'>): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      const user = result[0];

      try {
        await this.logTransaction({
          itemId: null,
          userId: user.id,
          type: 'user_created',
          quantity: 1,
          unitPrice: '0.00',
          notes: `User created: ${user.fullName} (${user.username})`
        });
      } catch (logError) {
        console.warn("Failed to log user creation transaction:", logError);
      }

      return user;
    } catch (error: any) {
      console.error("Database error in createUser:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'email'>>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;

    if (user.username === 'admin' || id === 1) {
      throw new Error("Cannot delete the primary admin user");
    }

    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    if (user.role === 'admin' && adminUsers.length <= 1) {
      throw new Error("Cannot delete the last admin user");
    }

    const firstAdmin = adminUsers.find(u => u.id !== id) || adminUsers[0];
    if (!firstAdmin) {
      throw new Error("Cannot delete user: no admin user available to reassign transactions");
    }

    await db.update(transactions)
      .set({ userId: firstAdmin.id })
      .where(eq(transactions.userId, id));

    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(categoryUpdate).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const itemsInCategory = await db.select().from(items).where(eq(items.categoryId, id)).limit(1);
    if (itemsInCategory.length > 0) {
      throw new Error("Cannot delete category that contains items");
    }
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return result[0];
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(desc(items.id));
  }

  async getItemsByCategoryId(categoryId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.categoryId, categoryId)).orderBy(desc(items.id));
  }

  async getLowStockItems(): Promise<Item[]> {
    const result = await db.select({
      id: items.id,
      name: items.name,
      sku: items.sku,
      description: items.description,
      categoryId: items.categoryId,
      quantity: items.quantity,
      unitPrice: items.unitPrice,
      location: items.location,
      minStockLevel: items.minStockLevel,
      status: items.status,
      rentedCount: items.rentedCount,
      brokenCount: items.brokenCount,
      rentable: items.rentable,
      expirable: items.expirable,
      expirationDate: items.expirationDate,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      categoryName: categories.name
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(sql`${items.quantity} < COALESCE(${items.minStockLevel}, 5)`);

    return result;
  }

  async searchItems(query: string): Promise<Item[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(items)
      .where(
        sql`LOWER(${items.name}) LIKE ${lowercaseQuery} OR 
            LOWER(${items.sku}) LIKE ${lowercaseQuery} OR 
            LOWER(${items.description}) LIKE ${lowercaseQuery}`
      )
      .orderBy(desc(items.id));
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const result = await db.insert(items).values(insertItem).returning();
    const newItem = result[0];

    try {
      await this.logTransaction({
        itemId: newItem.id,
        userId: null,
        type: 'in',
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        notes: `Item created: ${newItem.name}`
      });
    } catch (error) {
      console.warn("Failed to log item creation transaction:", error);
    }

    return newItem;
  }

  async updateItem(id: number, itemUpdate: Partial<InsertItem>): Promise<Item | undefined> {
    const existing = await this.getItem(id);
    if (!existing) return undefined;

    const result = await db.update(items).set(itemUpdate).where(eq(items.id, id)).returning();
    const updated = result[0];

    if (itemUpdate.quantity !== undefined && itemUpdate.quantity !== existing.quantity) {
      const quantityDiff = itemUpdate.quantity - existing.quantity;
      try {
        await this.logTransaction({
          itemId: id,
          userId: null,
          type: quantityDiff > 0 ? 'in' : quantityDiff < 0 ? 'out' : 'adjustment',
          quantity: Math.abs(quantityDiff),
          unitPrice: updated.unitPrice,
          notes: `Quantity ${quantityDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(quantityDiff)}`
        });
      } catch (error) {
        console.warn("Failed to log quantity update transaction:", error);
      }
    }

    if (itemUpdate.brokenCount !== undefined && itemUpdate.brokenCount !== (existing.brokenCount || 0)) {
      const brokenDiff = itemUpdate.brokenCount - (existing.brokenCount || 0);
      if (brokenDiff > 0) {
        try {
          await this.logTransaction({
            itemId: id,
            userId: null,
            type: 'adjustment',
            quantity: brokenDiff,
            unitPrice: updated.unitPrice,
            notes: `Broken count increased by ${brokenDiff}`
          });
        } catch (error) {
          console.warn("Failed to log broken count transaction:", error);
        }
      }
    }

    return updated;
  }

  async deleteItem(id: number): Promise<boolean> {
    await db.delete(transactions).where(eq(transactions.itemId, id));
    
    const result = await db.delete(items).where(eq(items.id, id));
    return result.rowCount > 0;
  }

  async rentItem(itemId: number, quantity: number, userId: number = 26): Promise<Item | null> {
    const item = await this.getItem(itemId);
    if (!item) return null;

    if (item.quantity < quantity) {
      throw new Error("Insufficient stock available");
    }

    const result = await db.update(items)
      .set({
        quantity: item.quantity - quantity,
        rentedCount: (item.rentedCount || 0) + quantity,
        updatedAt: new Date()
      })
      .where(eq(items.id, itemId))
      .returning();

    try {
      await this.logTransaction({
        itemId: itemId,
        userId: userId,
        type: 'out',
        quantity: quantity,
        unitPrice: item.unitPrice,
        notes: `Item rented - ${quantity} units`
      });
    } catch (error) {
      console.warn("Failed to log rent transaction:", error);
    }

    return result[0];
  }

  async returnItem(itemId: number, quantity: number, userId: number = 26): Promise<Item | null> {
    const item = await this.getItem(itemId);
    if (!item) return null;

    if ((item.rentedCount || 0) < quantity) {
      throw new Error("Cannot return more items than are currently rented");
    }

    const result = await db.update(items)
      .set({
        quantity: item.quantity + quantity,
        rentedCount: (item.rentedCount || 0) - quantity,
        updatedAt: new Date()
      })
      .where(eq(items.id, itemId))
      .returning();

    try {
      await this.logTransaction({
        itemId: itemId,
        userId: userId,
        type: 'in',
        quantity: quantity,
        unitPrice: item.unitPrice,
        notes: `Item returned - ${quantity} units`
      });
    } catch (error) {
      console.warn("Failed to log return transaction:", error);
    }

    return result[0];
  }

  async getTotalItemsCount(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${items.quantity}), 0)` }).from(items);
    return result[0].total;
  }

  async getTotalInventoryValue(): Promise<number> {
    const result = await db.select({ 
      total: sql<number>`COALESCE(SUM(${items.quantity} * ${items.unitPrice}), 0)` 
    }).from(items);
    return Math.round(result[0].total * 100) / 100;
  }

  async getLowStockCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(items)
      .where(sql`${items.quantity} < COALESCE(${items.minStockLevel}, 5)`);
    return result[0].count;
  }

  async getTodayTransactionsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(gte(transactions.createdAt, today));
    return result[0].count;
  }

  async getBrokenItemsCount(): Promise<number> {
    const result = await db.select({ 
      total: sql<number>`COALESCE(SUM(${items.brokenCount}), 0)` 
    }).from(items);
    return result[0].total;
  }

  async getRentedItemsCount(): Promise<number> {
    const result = await db.select({ 
      total: sql<number>`COALESCE(SUM(${items.rentedCount}), 0)` 
    }).from(items);
    return result[0].total;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  async getRecentTransactions(limit?: number): Promise<Transaction[]> {
    const query = db.select().from(transactions).orderBy(desc(transactions.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getAllTransactions(limit?: number): Promise<Transaction[]> {
    const query = db.select().from(transactions);
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async logTransaction(transactionData: any): Promise<Transaction> {
    let userId = transactionData.userId;
    if (!userId) {
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
      if (adminUsers.length > 0) {
        userId = adminUsers[0].id;
      } else {
        const anyUser = await db.select().from(users).limit(1);
        if (anyUser.length > 0) {
          userId = anyUser[0].id;
        } else {
          console.warn("No users found, skipping transaction log");
          return null;
        }
      }
    }

    const validTransactionData = {
      ...transactionData,
      userId: userId
    };

    try {
      const result = await db.insert(transactions).values(validTransactionData).returning();
      return result[0];
    } catch (error) {
      console.error("Failed to log transaction:", error);
      throw error;
    }
  }

  async flushActivityLogs(): Promise<void> {
    await db.delete(transactions);
    console.log("Activity logs flushed");
  }

  async getExpiringSoonItems(thresholdDays: number): Promise<Item[]> {
    const currentDate = new Date();
    const thresholdDate = new Date(currentDate.getTime() + (thresholdDays * 24 * 60 * 60 * 1000));

    const result = await db.select({
      id: items.id,
      name: items.name,
      sku: items.sku,
      description: items.description,
      categoryId: items.categoryId,
      quantity: items.quantity,
      unitPrice: items.unitPrice,
      location: items.location,
      minStockLevel: items.minStockLevel,
      status: items.status,
      rentedCount: items.rentedCount,
      brokenCount: items.brokenCount,
      rentable: items.rentable,
      expirable: items.expirable,
      expirationDate: items.expirationDate,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      categoryName: categories.name
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(
      and(
        eq(items.expirable, true),
        sql`${items.expirationDate} IS NOT NULL`,
        gte(items.expirationDate, currentDate),
        sql`${items.expirationDate} <= ${thresholdDate}`
      )
    );

    return result;
  }

  async clearAllData(): Promise<void> {
    try {
      console.log("Clearing all data...");

      await db.delete(transactions);
      console.log("Transactions cleared");

      await db.delete(items);
      console.log("Items cleared");

      await db.delete(categories);
      console.log("Categories cleared");

      await db.delete(users);
      console.log("Users cleared");

      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Error clearing data:", error);
      throw new Error("Failed to clear existing data: " + error.message);
    }
  }

  async createDefaultUser(): Promise<void> {
    try {
      const existingAdmin = await this.getUserByUsername('admin');
      if (existingAdmin) {
        console.log("Default users already exist");
        return;
      }

      console.log("Creating default users and data...");

      const defaultUsers = [
        { username: "admin", fullName: "Admin User", role: "admin" as const },
        { username: "default", fullName: "Default User", role: "user" as const },
        { username: "overseer", fullName: "Overseer User", role: "overseer" as const }
      ];

      for (const userData of defaultUsers) {
        try {
          await db.insert(users).values({
            ...userData,
            isActive: true,
          });
          console.log(`Created user: ${userData.username}`);
        } catch (error: any) {
          if (error.code === '23505') {
            console.log(`User ${userData.username} already exists, skipping...`);
          } else {
            console.error(`Failed to create user ${userData.username}:`, error);
          }
        }
      }

      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length === 0) {
        try {
          await db.insert(categories).values([
            { name: "BSA", description: "BSA related items" },
            { name: "BR", description: "BR related items" },
            { name: "Electronics", description: "Electronic devices and components" },
            { name: "Tools", description: "Hand tools and equipment" },
            { name: "Food", description: "Food items and supplies" },
            { name: "Drinks", description: "Beverages and drink supplies" },
          ]);
          console.log("Created default categories");
        } catch (error) {
          console.error("Failed to create default categories:", error);
        }
      }

      const existingItems = await db.select().from(items).limit(1);
      if (existingItems.length === 0) {
        try {
          const allCategories = await db.select().from(categories);
          const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));

          const electronicsId = categoryMap.get("Electronics");
          const bsaId = categoryMap.get("BSA");
          const foodId = categoryMap.get("Food");

          if (electronicsId && bsaId && foodId) {
            await db.insert(items).values([
              {
                name: "Laptop Dell XPS 13",
                sku: "LAP-001",
                description: "13-inch ultrabook with Intel i7 processor",
                categoryId: electronicsId,
                quantity: 2,
                unitPrice: "999.99",
                location: "Electronics Storage",
                minStockLevel: 5,
                rentable: true,
                expirable: false,
              },
              {
                name: "Office Chair",
                sku: "CHR-001",
                description: "Ergonomic office chair with lumbar support",
                categoryId: bsaId,
                quantity: 1,
                unitPrice: "299.99",
                location: "Furniture Storage",
                minStockLevel: 3,
                rentable: true,
                expirable: false,
              },
              {
                name: "Milk Cartons",
                sku: "MILK-001",
                description: "Fresh whole milk",
                categoryId: foodId,
                quantity: 8,
                unitPrice: "3.50",
                location: "Cold Storage",
                minStockLevel: 10,
                rentable: false,
                expirable: true,
                expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              },
              {
                name: "Protein Bars",
                sku: "PROT-001",
                description: "High protein energy bars",
                categoryId: foodId,
                quantity: 15,
                unitPrice: "2.99",
                location: "Pantry",
                minStockLevel: 5,
                rentable: false,
                expirable: true,
                expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              }
            ]);
            console.log("Created default items");
          } else {
            console.log("Required categories not found, skipping default items creation");
          }
        } catch (error) {
          console.error("Failed to create default items:", error);
        }
      }

      console.log("Default data initialization completed");
    } catch (error) {
      console.error("Error in createDefaultUser:", error);
    }
  }
}

export const storage = new DatabaseStorage();
