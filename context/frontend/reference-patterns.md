# Frontend Reference Patterns

Canonical code shapes for the Twinzy frontend OS. When you write a new file, start from the matching
shape here — do not invent a new one. Every snippet uses the owner-wrapper facades (never raw
vendors), `as const` enum-like objects (never the `enum` keyword), explicit return types, and no
`any`. The illustrative module below is `match` (a Twinzy round-result view); substitute your own
feature. Adapted from the reference frontend OS.

## 1. JSX-only component

`modules/match/components/match-card.component.tsx`. No hooks, no logic, no raw copy, no raw
classes — everything arrives pre-computed on the view model.

```tsx
import type { ReactElement } from 'react';
import { Card, CardTitle, CardDescription } from '@/packages/ui-primitives';
import type { MatchCardProps } from '../types/match.types';
import { matchCardClasses } from '../constants/match-style.constants';

export function MatchCard(props: MatchCardProps): ReactElement {
  return (
    <Card data-testid={props.viewModel.testId}>
      <span className={props.viewModel.vibeBadgeClassName}>{props.viewModel.vibeLabel}</span>
      <CardTitle>{props.viewModel.title}</CardTitle>
      <CardDescription>{props.viewModel.summary}</CardDescription>
      <p className={matchCardClasses.meta}>
        <span>{props.viewModel.matchStrengthLabel}</span>
      </p>
    </Card>
  );
}
```

## 2. Container: hook → components, state switch, the `.map()`

`modules/match/containers/match-list.container.tsx`. Note the mandatory client-boundary reason
comment and the exhaustive `assertNever` default.

```tsx
'use client';
// client-boundary-reason: connects the interactive match query hook to presentational components.

import type { ReactElement } from 'react';
import { LoadingState } from '@/shared/components/feedback/loading-state.component';
import { assertNever } from '@/shared/utils/assert-never.util';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { useMatchList } from '../hooks/use-match-list.hook';
import { MatchCard } from '../components/match-card.component';
import { MatchList } from '../components/match-list.component';

export function MatchListContainer(): ReactElement {
  const viewModel = useMatchList();

  switch (viewModel.state) {
    case 'loading': {
      return <LoadingState label={viewModel.loadingLabel} testId={TEST_IDS.matchLoading} />;
    }
    // … 'error' and 'empty' branches elided …
    case 'ready': {
      return (
        <MatchList testId={TEST_IDS.matchList}>
          {viewModel.items.map((item) => (
            <MatchCard key={item.id} viewModel={item} />
          ))}
        </MatchList>
      );
    }
    default: {
      return assertNever(viewModel.state);
    }
  }
}
```

## 3. Query-key builder

`modules/match/queries/match-query-keys.ts` — the only source of match cache addresses
(`no-inline-query-keys` enforces this).

```ts
import type { MatchListParams } from '../types/match.types';

export const matchQueryKeys = {
  root: ['match'] as const,
  lists: () => [...matchQueryKeys.root, 'list'] as const,
  list: (params: MatchListParams) => [...matchQueryKeys.lists(), params] as const,
  details: () => [...matchQueryKeys.root, 'detail'] as const,
  detail: (id: string) => [...matchQueryKeys.details(), id] as const,
};
```

## 4. Gateway → mapper → service chain

Gateway (`modules/match/gateway/match.gateway.ts`) speaks HTTP to the BFF and validates the wire
shape; it returns API types only:

```ts
import { httpClient } from '@/packages/axios';
import { parseSchema } from '@/packages/zod';
import { buildGatewayPath } from '@/shared/api/api-routes.constants';
import { MATCH_ENDPOINTS } from '../constants/match-endpoints.constants';
import { matchApiListResponseSchema } from '../schemas/match.schema';
import type { MatchApiListResponse, MatchListParams } from '../api/match.api.types';

export async function fetchMatchListFromGateway(
  params: MatchListParams,
): Promise<MatchApiListResponse> {
  const response = await httpClient.get<unknown>(buildGatewayPath(MATCH_ENDPOINTS.list), {
    params: { page: params.page, page_size: params.pageSize },
  });

  return parseSchema(matchApiListResponseSchema, response.data, 'match list response');
}
```

Mapper (`modules/match/mappers/match.mapper.ts`) converts wire snake_case to domain camelCase —
nothing above the service layer ever sees snake_case:

```ts
import type { MatchApiItem } from '../api/match.api.types';
import type { Match } from '../types/match.types';

export function mapMatchApiItem(apiItem: MatchApiItem): Match {
  return {
    id: apiItem.id,
    title: apiItem.title,
    summary: apiItem.summary,
    vibe: apiItem.vibe,
    matchStrength: apiItem.match_strength,
  };
}
```

Service (`modules/match/services/match.service.ts`) is the React-free use case that composes both:

```ts
import { fetchMatchListFromGateway } from '../gateway/match.gateway';
import { mapMatchListResponse } from '../mappers/match.mapper';
import type { MatchListParams, MatchListResult } from '../types/match.types';

export async function listMatches(params: MatchListParams): Promise<MatchListResult> {
  const response = await fetchMatchListFromGateway(params);

  return mapMatchListResponse(response);
}
```

The query file (`modules/match/queries/match.queries.ts`) binds the service to the cache through the
facade:

```ts
import { useAppQuery } from '@/packages/query';
import { matchQueryKeys } from './match-query-keys';
import { listMatches } from '../services/match.service';
import type { MatchListParams, MatchListResult } from '../types/match.types';

export function useMatchListQuery(params: MatchListParams) {
  return useAppQuery<MatchListResult>({
    queryKey: matchQueryKeys.list(params),
    queryFn: () => listMatches(params),
  });
}
```

## 5. Zustand store

`modules/ui-preferences/store/ui-preferences.store.ts`. The store stays pure; persistence and DOM
sync live in an effects hook via the storage and browser facades.

```ts
import { createAppStore } from '@/packages/zustand';
import { UI_PREFERENCES_DEFAULTS } from '../constants/ui-preferences.constants';
import type { UiPreferencesSnapshot, UiPreferencesState } from '../types/ui-preferences.types';

export const useUiPreferencesStore = createAppStore<UiPreferencesState>()((set) => ({
  ...UI_PREFERENCES_DEFAULTS,
  hasHydrated: false,
  setTheme: (theme) => {
    set({ theme });
  },
  setDirection: (direction) => {
    set({ direction });
  },
  toggleSidebar: () => {
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded }));
  },
  hydrate: (snapshot: UiPreferencesSnapshot) => {
    set({ ...snapshot, hasHydrated: true });
  },
}));
```

## 6. Form: schema with i18n-key messages + orchestration hook + toast

Schema (`modules/upload/schemas/upload.schema.ts`) — error messages are i18n keys, never raw copy.
Twinzy's upload requires an explicit consent flag (a product non-negotiable):

```ts
import { z } from '@/packages/zod';
import { UPLOAD_VALIDATION_MESSAGE_KEYS } from '../constants/upload-message-keys.constants';

export const uploadFormSchema = z.object({
  consent: z.literal(true, { message: UPLOAD_VALIDATION_MESSAGE_KEYS.consentRequired }),
  displayName: z
    .string()
    .min(1, UPLOAD_VALIDATION_MESSAGE_KEYS.nameRequired)
    .max(DISPLAY_NAME_MAX_LENGTH, UPLOAD_VALIDATION_MESSAGE_KEYS.nameTooLong),
});
```

Hook (`modules/upload/hooks/use-upload-form.hook.ts`) — `useAppZodForm` + mutation + toast + typed
navigation in one submit path:

```ts
const form = useAppZodForm<UploadFormValues>({
  schema: uploadFormSchema,
  defaultValues: { consent: false, displayName: '' },
});

const handleValidSubmit = useCallback(
  async (values: UploadFormValues) => {
    const result = await mutateAsync(values);

    showToast({ type: ToastType.Success, message: t(UPLOAD_MESSAGE_KEYS.success) });
    navigation.push(ROUTE_PATHS.matches);
    return result;
  },
  [mutateAsync, navigation, t],
);
```

Field errors come back as keys and are translated at the edge:
`error: nameErrorKey ? t(nameErrorKey) : undefined`.

## 7. Error mapping chain

`shared/errors/http-error-to-message-key.mapper.ts` — the only path from transport failures to
user-visible copy. `HttpError` in, translatable key out:

```ts
import { isHttpError } from '@/packages/axios';
import { ERROR_MESSAGE_KEYS } from './error-keys.constants';
import type { ErrorMessageKey } from './error-keys.constants';

export function mapErrorToMessageKey(error: unknown): ErrorMessageKey {
  if (!isHttpError(error)) {
    return ERROR_MESSAGE_KEYS.generic;
  }

  if (error.kind === 'network') {
    return ERROR_MESSAGE_KEYS.network;
  }
  // … timeout / 401 / 403 / 404 / >=500 branches elided …
  return ERROR_MESSAGE_KEYS.generic;
}
```

The full chain: the axios interceptor normalizes to `HttpError` (`@/packages/axios`), hooks map it
with `mapErrorToMessageKey`, and `useAppTranslation` renders the key. Raw error text never reaches
users — see [`rules/frontend/18-error-handling.md`](../../rules/frontend/18-error-handling.md).

## 8. `as const` enum-like object (never the `enum` keyword)

The `enum` keyword is banned repo-wide. Domain enumerations are frozen objects plus a derived union:

```ts
export const MatchVibe = {
  Playful: 'playful',
  Classic: 'classic',
  Bold: 'bold',
} as const;

export type MatchVibe = (typeof MatchVibe)[keyof typeof MatchVibe];
```

Compare against the constant, never a raw string literal. Exhaustive `switch` over the union ends in
`default: return assertNever(value);` so a new member is a compile error until it is handled.
