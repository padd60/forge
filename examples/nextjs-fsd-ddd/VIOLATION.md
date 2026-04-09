# Intentional violation: `demo/clean-arch-react-in-domain`

**Changed file:** `src/entities/order/model/order.ts`

**What was changed:** Added `import { useState } from 'react'` at the
top of the domain entity file.

**Expected `forge check` output:**

```
src/entities/order/model/order.ts
  2:26  error  Domain file "…/entities/order/model/order.ts" imports
               framework package "react". Domain code must stay
               framework-agnostic — move this to a feature, widget,
               or adapter  @forge/forge/clean-arch-domain-isolation

✖ 1 problem (1 error, 0 warnings)
```

**Rule:** `@forge/forge/clean-arch-domain-isolation`

**How to fix:** Remove the framework import. State management
belongs in features/ or widgets/, not in the domain layer.
