import pkg from "pg";
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

export const db = drizzle({ client, schema });

async function initializeAdminUser() {
  try {
    const adminUser = await db.select().from(schema.users).where(eq(schema.users.username, 'admin')).limit(1);

    if (adminUser.length === 0) {
      await db.insert(schema.users).values({
        username: 'admin',
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

initializeAdminUser();
