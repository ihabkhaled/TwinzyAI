# 19 — Services (Application Layer)

- One focused capability per service; small composable methods.
- Complex domain logic goes to helpers/policies/mappers in the module utils/ folder.
- No raw SDK imports (use adapters), no process.env (use AppConfigService), no unbounded
  concurrency.
- Map every external failure into DomainException with a safe message and stable error code.
