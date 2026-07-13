/**
 * Vercel detects `src/server.ts` as a Node.js server entrypoint and captures
 * the existing Nest/Fastify `listen()` call as a Vercel Function. Keep the
 * canonical bootstrap in `main.ts` so local, Railway, and Vercel deployments
 * all start the API through the same code path.
 */
import './main';
