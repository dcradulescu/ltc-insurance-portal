# Superseded premium-waiver verification

The prior content of this file incorrectly supported subtracting waived premiums from insurance benefit-pool consumption. Its “100% realization” checks tested allocation arithmetic, not valid long-term care insurance logic. **Those conclusions must not be used.**

Checkpoint 10 separates premium payments from care claims. An active premium waiver reduces the premium payable for the reviewed month; it does not reduce the claim charged to the pool or extend the pool's duration. Merely having a waiver provision does not establish that it is active.

See `CALCULATOR_AUDIT_2026-10-09.md`, the production engine in `shared/careCalculator.ts`, and its direct regression tests in `shared/careCalculator.test.ts`. Tests include zero, ordinary, and unusually large premiums and prove identical reimbursement and pool exhaustion with waiver on or off.

Checkpoint 11: full waiver is now selected by default as an explicit user-directed planning assumption. A $200 monthly premium gives $200 assumed savings and $0 premium payable; turning the assumption off gives $0 savings and $200 payable. Neither selection changes claim payments or pool accounting.

Checkpoint 12 adds the monthly budget comparison explicitly requested by the user: gross monthly care cost minus insured waived premium minus spouse waived premium when dual waiver applies. This separate comparison never changes insurer claim payments or the monthly care/pool table. Example: $5,280 − $200 − $150 = $4,930. All months are available to review, with a full-calendar-month default; partial-month offsets are unavailable without actual waiver terms. Negative values are retained as budget offsets, not insurer payments. The full suite now passes 367 tests, including 116 direct engine tests.
