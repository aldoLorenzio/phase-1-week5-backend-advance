// src/index.ts
import { UserService } from './services/user.services';
import { PostService } from './services/post.services';
import { ApiResponse } from './utils/response';

// Initialize services
const userService = new UserService();
const postService = new PostService();

// Create the server
const server = Bun.serve({
    port: process.env.PORT || 3000,
    async fetch(req) {
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        try {
            // Users endpoints
            if (path.startsWith('/api/users')) {
                const id = path.split('/')[3]; // Get ID from path if present

                // GET /api/users
                if (method === 'GET' && !id) {
                    const users = await userService.getAllUsers();
                    return ApiResponse.json(users);
                }

                // GET /api/users/:id
                if (method === 'GET' && id) {
                    const user = await userService.getUserById(Number(id));
                    if (!user) {
                        return ApiResponse.json({ error: 'User not found' }, 404);
                    }
                    return ApiResponse.json(user);
                }

                // POST /api/users
                if (method === 'POST') {
                    const body = await req.json() as {email: string; name: string};
                    const user = await userService.createUser(body);
                    return ApiResponse.json(user, 201);
                }

                // PUT /api/users/:id
                if (method === 'PUT' && id) {
                    const body = await req.json() as Partial<{email: string; name: string}>;
                    const user = await userService.updateUser(Number(id), body);
                    if (!user) {
                        return ApiResponse.json({ error: 'User not found' }, 404);
                    }
                    return ApiResponse.json(user);
                }

                // DELETE /api/users/:id
                if (method === 'DELETE' && id) {
                    const user = await userService.deleteUser(Number(id));
                    if (!user) {
                        return ApiResponse.json({ error: 'User not found' }, 404);
                    }
                    return new Response(null, { status: 204 });
                }
            }

            // Posts endpoints
            if (path.startsWith('/api/posts')) {
                const id = path.split('/')[3]; // Get ID from path if present

                // GET /api/posts
                if (method === 'GET' && !id) {
                    const posts = await postService.getAllPosts();
                    return ApiResponse.json(posts);
                }

                // GET /api/posts/:id
                if (method === 'GET' && id) {
                    const post = await postService.getPostById(Number(id));
                    if (!post) {
                        return ApiResponse.json({ error: 'Post not found' }, 404);
                    }
                    return ApiResponse.json(post);
                }

                // POST /api/posts
                if (method === 'POST') {
                    const body = await req.json() as {title:string; content:string; userId: number };
                    const post = await postService.createPost(body);
                    return ApiResponse.json(post, 201);
                }

                // PUT /api/posts/:id
                if (method === 'PUT' && id) {
                    const body = await req.json() as Partial<{title:string; content:string; userId: number }>;
                    const post = await postService.updatePost(Number(id), body);
                    if (!post) {
                        return ApiResponse.json({ error: 'Post not found' }, 404);
                    }
                    return ApiResponse.json(post);
                }

                // DELETE /api/posts/:id
                if (method === 'DELETE' && id) {
                    const post = await postService.deletePost(Number(id));
                    if (!post) {
                        return ApiResponse.json({ error: 'Post not found' }, 404);
                    }
                    return new Response(null, { status: 204 });
                }
            }

            // Handle 404 for unknown routes
            return ApiResponse.json({ error: 'Not Found' }, 404);

        } catch (error) {
            console.error('Error:', error);
            return ApiResponse.json({ error: 'Internal Server Error' }, 500);
        }
    }
});

console.log(`Server running at http://localhost:${server.port}`);
