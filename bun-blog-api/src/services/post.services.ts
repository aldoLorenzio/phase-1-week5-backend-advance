// src/services/post.service.ts
import { db } from '../db';
import { posts } from '../db/schema/posts';
import { eq } from 'drizzle-orm';

export class PostService {
    async getAllPosts() {
        return await db.select().from(posts);
    }

    async getPostById(id: number) {
        const result = await db.select()
            .from(posts)
            .where(eq(posts.id, id))
            .limit(1);
        return result[0];
    }

    async createPost(data: { title: string; content: string; userId: number }) {
        const result = await db.insert(posts)
            .values(data)
            .returning();
        return result[0];
    }

    async updatePost(id: number, data: Partial<{ title: string; content: string; isPublished: boolean }>) {
        const result = await db.update(posts)
            .set(data)
            .where(eq(posts.id, id))
            .returning();
        return result[0];
    }

    async deletePost(id: number) {
        const result = await db.delete(posts)
            .where(eq(posts.id, id))
            .returning();
        return result[0];
    }
}