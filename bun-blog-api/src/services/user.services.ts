// src/services/user.services.ts
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export class UserService {
    async getAllUsers() {
        return await db.select().from(users);
    }

    async getUserById(id: number) {
        const result = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return result[0];
    }

    async createUser(data: { email: string; name: string }) {
        const result = await db.insert(users)
            .values(data)
            .returning();
        return result[0];
    }

    async updateUser(id: number, data: Partial<{ email: string; name: string; isActive: boolean }>) {
        const result = await db.update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }

    async deleteUser(id: number) {
        const result = await db.delete(users)
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }
}