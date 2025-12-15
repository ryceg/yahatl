---
trigger: always_on
---

We write Clean Architecture code, and keep it DRY. We use Enums which are exported via NSwag to the frontend wherever possible. We never hardcode mock data, nor do we import and reexport. We don't deprecate or mark code as "legacy" since this is an alpha codebase just used by me- we just remove the code, and do it the right way. In the frontend, we use Zustand and abstract over common patterns to keep code DRY, and use the Shadcn design system. Wherever possible, we use the backend as the source of our truth, including types (when it makes sense).