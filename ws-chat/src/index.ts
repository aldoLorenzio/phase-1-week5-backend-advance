import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { ChatService } from './services/chat.services';
import { UserService } from './services/user.services';
import { staticPlugin } from '@elysiajs/static';

//initialize services
const chatService = new ChatService();
const userService = new UserService();

//track connected users
const connectedUsers = new Map<string, any>();

const app = new Elysia()
    .use(cors())
    //configure Swagger with detailed documentation
    .use(swagger({
        documentation:{
            info: {
                title: 'Real-time Chat API',
                version: '1.0.0',
                description: 'API for real-time chat with both WebSocket and REST endpoints'
            },
            tags: [
                {name: 'Messages', description: 'Message operations'},
                {name: 'Users', description: 'User management'},
                {name: 'WebSocket', description: 'WebSocket connection info'}
            ]
        }
    }))

    //REST endpoints to get WebSocket connection details
    .get('/ws-info',
        () => ({
            websocketUrl: 'ws://localhost:3000/ws',
            messageFormats: {
                join: { type: 'join', username: 'string'},
                message: { type: 'message', username: 'string', content:'string'},
                leave: { type: 'leave', username: 'string'},
            }
        }),
        {
            detail: {
                tags:['WebSocket'],
                summary: 'Get WebSocket connection information',
                description: 'Returns WebSocket URL and message format examples'
            }
        }
    )

    // REST endpoints to get recent messages
    .get('/messages',
        async({ query }) =>{
            const limit = Number(query?.limit || 50);
            return await chatService.getRecentMessages(limit);
        },
        {
            query: t.Object({
                limit: t.Optional(t.Number({
                    default: 50,
                    minimum: 1,
                    maximum: 100
                }))
            }),
            detail:{
                tags: ['Messages'],
                summary: 'Get recent messages',
                description: 'Retrieve recent chat messages from the database'
            }
        }
    )

    //REST endpoint to send a message
    .post('/messages',
        async({ body }) => {
            const message = await chatService.saveMessage(body.username, body.content);
            if(message) {
                broadcastMessage({
                    type: 'message',
                    username: body.username,
                    content: body.content,
                    timsetamp: new Date()
                });
                return message;
            }
            throw new Error('Failed to save message');
        },
        {
            body: t.Object({
                username: t.String({
                    minLength: 1,
                    description: 'Username of the sender'
                }),
                content: t.String({
                    minLength: 1,
                    description: 'Message content'
                })
            }),
            detail:{
                tags: ['Messages'],
                summary: 'Send a message',
                description: 'Send a message  through REST API (will be broadcast to Websocket clients)'
            }
        }
    )

    //REST endpoints to get active users
    .post('/users',
        async({ body }) => {
            return await userService.createUser(body.username);
        },
        {
            body: t.Object({
                username: t.String({
                    minLength: 1,
                    description: 'Username to register'
                })
            }),
            detail: {
                tags: ['Users'],
                summary: 'Register a new user',
                description: 'Create a new user in the system'
            }
        }
    )

    //Websocket endpoint
    .ws('/ws',{
        message: async(ws, messages: any) =>{
            try{
                switch(messages.type){
                    case 'join':
                        const user = await userService.createUser(messages.username);
                        if(user){
                            connectedUsers.set(messages.username, ws);

                            //Send welcome message
                            ws.send({
                                type:'system',
                                content: `Welcome ${messages.username}`,
                                timestamp: new Date()
                            });

                            // Load and send recent messages
                            const recentMessages = await chatService.getRecentMessages(10);
                            for(const msg of recentMessages){
                                ws.send({
                                    type: 'message',
                                    username: msg.username,
                                    content: msg.content,
                                    timestamp: msg.createdAt
                                });
                            }

                            broadcastMessage({
                                type:'system',
                                content: `${messages.username} joined the chat`,
                                timestamp: new Date()
                            }, ws);
                        }
                        break;

                        case 'message':
                            if(messages.content && messages.username){
                                const savedMessage = await chatService.saveMessage(
                                    messages.username,
                                    messages.content
                                );
                                if(savedMessage){
                                    broadcastMessage({
                                        type: 'message',
                                        username:messages.username,
                                        content: messages.content,
                                        timestamp: new Date()
                                    });
                                }
                            }
                            break;

                        case 'leave':
                            if(messages.username){
                                await handleUserLeave(messages.username);
                            }
                            break;
                }
            } catch(error){
                console.error('Websocket error: ', error);
                ws.send({
                    type: 'error',
                    content: 'An error occured processing your message'
                });
            }
        }
    })
    .listen(3000)

    // Add this to your Elysia app configuration
    app.use(staticPlugin())
    .get('/test', () => Bun.file('./public/ws-tester.html'));

    //Utility function
    function broadcastMessage(message: any, excludeWs?: any){
        for (const [_, ws] of connectedUsers.entries()){
            if(ws !== excludeWs){
                ws.send(message)
            }
        }
    }

    async function handleUserLeave(username: string){
        await userService.updateLastSeen(username);
        connectedUsers.delete(username);
        broadcastMessage({
            type: 'system',
            content: `${username} left the chat`,
            timestamp: new Date()
        });
    }

    console.log(`🚀 Server running at http://localhost:3000`);
    console.log(`📚 Swagger documentation at http://localhost:3000/swagger`);
    console.log(`🔌 WebSocket endpoint at ws://localhost:3000/ws`);

    export type App = typeof app;