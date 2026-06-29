# Dopamine India — Backend

FastAPI service implementing the simulated-commerce APIs described in
`../docs/05-backend-apis.md`, against the schema in
`../docs/04-database-schema.md`.

Structure mirrors `AI-Grocery-Advisor/backend` conventions (independent
deployment, own database, no shared code):

```
backend/
  app/
    api/        # FastAPI routers, one module per resource group
    core/       # config, db session, security/auth deps, redis client
    models/     # SQLAlchemy models
    schemas/    # Pydantic request/response models
    services/   # business logic (checkout simulation, savings calc, etc.)
    workers/    # arq background jobs (AI moodboard gen, leaderboards)
```

Not yet implemented — this is a structural placeholder pending MVP build
(see `../docs/12-mvp-scope.md`).
