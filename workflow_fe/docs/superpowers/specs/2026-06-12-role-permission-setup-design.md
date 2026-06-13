# Role Permission Setup Design

## Problem

Role permissions are currently seeded directly into the database during development startup. The seeded roles and permissions are the right defaults, but an admin has no frontend workflow to change permissions after the database has been seeded.

The application already uses `user.roles` and `user.permissions` for frontend route access, sidebar filtering, and action visibility. The backend guards also authorize requests from the current database-backed user permissions, so changing role permissions in the database should affect backend authorization immediately.

Generated frontend API code under `src/lib/api/gen` must not be edited manually. Any generated client changes must come from the backend Swagger endpoint and Kubb regeneration.

## Scope

Build role-permission setup across backend and frontend:

- Add backend admin-only RBAC management APIs.
- Regenerate the frontend Kubb client from backend Swagger after the APIs exist.
- Add an admin-only `/permissions` frontend route.
- Add a sidebar **Administration** group before **Modules** with a **Permissions** item.
- Let admins edit permissions for one existing non-admin role at a time.
- Keep seeded roles and seeded permissions as the only editable universe for this feature.
- Keep the `admin` role locked as always-full-access.

Out of scope:

- Creating, editing, or deleting roles.
- Creating, editing, or deleting permissions.
- Assigning roles to users.
- Editing the `admin` role permissions.
- Introducing a new global state store for permission setup.

## Backend API

Add a controller in the existing RBAC module at `src/modules/rbac/rbac.controller.ts`, backed by RBAC service methods in `src/modules/rbac/rbac.service.ts`.

All RBAC management endpoints are protected with `@Roles('admin')`. This is intentionally role-based, not permission-based, so admins cannot remove their own access to the permission setup screen through editable permission assignments.

### `GET /rbac/roles`

Returns all roles sorted by name with their current permission slugs.

Each role includes:

- `id`
- `name`
- `slug`
- `description`
- `isSystem`
- `isLocked`
- `permissionSlugs`
- `createdAt`
- `updatedAt`

`isLocked` is true for `admin`.

### `GET /rbac/permissions`

Returns all permissions sorted by resource and action.

Each permission includes:

- `id`
- `name`
- `slug`
- `description`
- `resource`
- `action`
- `createdAt`
- `updatedAt`

### `PUT /rbac/roles/:roleSlug/permissions`

Replaces one non-admin role's permission assignments.

Request body:

```json
{
  "permissionSlugs": ["expenses.read", "expenses.write"]
}
```

Behavior:

- Return `404 Not Found` when the role does not exist.
- Return `400 Bad Request` when `roleSlug` is `admin`.
- Deduplicate duplicate permission slugs.
- Return `400 Bad Request` when any permission slug does not exist.
- Allow an empty list for non-admin roles.
- Apply the replacement in a transaction.
- Return the updated role response with `permissionSlugs`.

## Frontend Behavior

Add a new route:

- `src/routes/_private/permissions.tsx`

The generated route tree is generated output and should not be manually edited.

Access rules:

- `/permissions` is admin-role-only in `src/features/auth/auth-routing.ts`.
- The sidebar item is shown only to users with the `admin` role.
- Non-admin users who navigate directly to `/permissions` are redirected to `/`.

Navigation:

- Add **Administration** before **Modules** in the private sidebar.
- Add **Permissions** under **Administration** with the Lucide `ShieldCheck` icon.

Page behavior:

- Load roles and permissions through generated Kubb hooks.
- Show a loading state while either request is loading.
- Show the existing error notice pattern when either request fails.
- Show a role list with role name, slug, permission count, and locked state.
- Select the first editable non-admin role by default.
- Admin appears locked/full-access and cannot be edited.
- The selected non-admin role displays grouped permission checkboxes by `resource`.
- Checkbox changes update local page state only.
- Save sends the complete checked permission slug list for the selected role.
- Save is disabled when no editable role is selected, while saving, or when the checked set has not changed.
- On save success, refetch roles, keep the selected role if it still exists, and reset dirty state to the server response.

## Permission Refresh Flow

Backend authorization changes take effect immediately because authenticated requests load current roles and permissions from the database.

Frontend navigation state may be stale for a signed-in user until `/auth/me` refetches. Add a small centralized `403` response handler in the private Axios client:

- On the first `403` for a protected API request, call `/api/auth/me`.
- Update `useAuthStore` with the returned user.
- Reject the original request normally so the current page can show its existing error state.
- Avoid refresh loops by not retrying the original failed request and not recursively handling `/auth/me` failures.

This lets the sidebar and client-side route permissions update before the user retries their navigation or action.

## Component Shape

Keep the implementation simple:

- Add the permission setup page in `src/pages/index.tsx` to match the current project structure.
- Use screen-local `useState` for selected role and checked permission slugs.
- Use small local helper functions only when they directly simplify sorting, grouping, or dirty-state comparison.
- Do not introduce a shared permissions store, provider, or generic RBAC abstraction.
- Use generated DTO types after Kubb regeneration.
- Do not use `any`, non-null assertions, or TypeScript suppression comments.

## Testing

Backend tests should cover:

- Listing roles includes permission slugs and locked admin state.
- Listing permissions returns seeded permissions.
- Updating a non-admin role replaces permissions.
- Updating `admin` is blocked.
- Updating an unknown role returns not found.
- Updating with an unknown permission slug returns a bad request.
- Duplicate permission slugs are deduplicated.

Frontend tests should cover:

- Admin users can see the **Permissions** sidebar item.
- Non-admin users cannot see the **Permissions** sidebar item.
- `/permissions` is admin-only in routing helpers.
- The page renders roles and grouped permissions.
- Admin role is shown locked and cannot be edited.
- Toggling permissions enables Save.
- Save calls the generated update hook with the selected role slug and complete permission slug list.
- Unchanged selections keep Save disabled.

## Verification

Backend:

- Run targeted RBAC tests.
- Run backend typecheck/lint/test commands used by the project.
- Start the backend and verify the Swagger JSON exposes the RBAC endpoints.

Frontend:

- Hit the backend Swagger endpoint directly before generating the Kubb client.
- Run `npm run generate:api`.
- Run targeted Vitest tests for auth routing, private layout, and permissions page.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run test` if targeted tests pass.

## Acceptance Criteria

- Admin can open `/permissions` from the sidebar.
- Admin can select a non-admin seeded role and change its permissions.
- Saving one role replaces only that role's permission assignments.
- Admin role remains locked/full-access and cannot be edited.
- Non-admin users cannot access the permission setup page.
- Backend authorization reflects changed permissions on subsequent requests.
- Frontend sidebar permissions update after `/auth/me` refetch following a `403`.
- No generated Kubb client code is manually edited.
