# Skill: Create a Repository

> Applies rules/20. Persistence access only — and Twinzy persists NOTHING today
> (memory/architecture-decisions.md, memory/privacy-decisions.md). This pattern binds the
> moment persistence is introduced via an ADR. Images, embeddings, and biometric data are
> permanently banned from any store.

1. File: `apps/api/src/modules/NAME/infrastructure/NAME.repository.ts` — typed persistence
   calls only; no business, AI, or file decisions (plugin-enforced:
   `architecture/repository-persistence-only`).
2. Misses return `null`/`[]` — the service decides which `AppError` that means; repositories
   never throw domain errors.
3. Every list is bounded: clamp limits against a cap constant from `model/`; document indexes
   the day a real store lands. Parameterize every future query (injection-safety-review.md).
4. Until a store exists, any in-memory holder still follows the pattern — typed, bounded, and
   never holding image/biometric data:

   ```ts
   // infrastructure/vibe-cache.repository.ts — in-memory, bounded, nothing sensitive
   import { VIBE_CACHE_MAX_ENTRIES } from '../model/game.constants';

   @Injectable()
   export class VibeCacheRepository {
     private readonly entries = new Map<string, StoredVibeSummary>();

     public save(key: string, value: StoredVibeSummary): void {
       if (this.entries.size >= VIBE_CACHE_MAX_ENTRIES) {
         const oldest = this.entries.keys().next();
         if (oldest.done === false) {
           this.entries.delete(oldest.value); // evict oldest — the map stays bounded
         }
       }
       this.entries.set(key, value);
     }

     public findByKey(key: string): StoredVibeSummary | null {
       return this.entries.get(key) ?? null;
     }
   }
   ```

5. Unit-test the bound (eviction at the cap) and miss behavior; integration-test against a
   real store once one exists.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
