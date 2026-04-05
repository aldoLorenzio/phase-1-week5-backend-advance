import { db } from '../db';
import { messages, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ChatService {
    async getRecentMessages(limit: number = 50){
        return await db.select({
            id: messages.id,
            content: messages.content,
            username: users.username,
            createdAt: messages.createdAt
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId , users.id))
        .limit(limit)
        .execute();
    }

    async saveMessage(username: string, content:string){
        // First find the user
        const user = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1)
        .execute();
        
        const foundUser = user[0];
        if(!foundUser) return null

        // Then save the message
        const result = await db.insert(messages)
        .values({
            content,
            userId: foundUser.id
        })
        .returning()
        .execute();

        return {
            ...result[0],
            username
        };
    }
}