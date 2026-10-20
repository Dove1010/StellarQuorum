# Paired feature test plans

These plans are intentionally agreed before the paired feature implementations
land. The tests should be added in the same PR as each feature, not as a later
follow-up.

## Conviction voting (#316)

Blocked until the conviction-voting module issue defines the public API and
fixed-point representation. The contract test file should use the module's
real client and advance the Soroban ledger explicitly for every observation.

Required cases:

1. **Accumulation across ledgers.** Start with zero conviction, support a
   proposal at ledger `L`, and read at `L+1`, `L+2`, and `L+N`. Assert the
   recurrence from the approved design at every ledger, not only the final
   value. Include a support change so the test catches a stale cached value.
2. **Withdrawal decay.** Accumulate support for several ledgers, withdraw it,
   then read on each subsequent ledger. Assert that conviction decreases toward
   zero, never becomes negative, and is not decayed twice when read twice at the
   same ledger. Re-supporting after withdrawal must resume from the stored
   value, according to the approved rounding rule.
3. **Execution threshold.** Test values one unit below, exactly at, and one
   unit above the threshold. Below must remain non-executable; at the threshold
   must become executable exactly once; after execution, a replay must fail.
4. **Boundary decisions to record in the feature PR.** The PR must state
   whether support is applied before or after decay at a ledger boundary, the
   fixed-point scale, rounding direction, overflow behavior, and whether the
   threshold is checked against the value at the current ledger or the previous
   ledger. The tests must encode those choices.

## Proposal template picker (#318)

Blocked until the template-picker feature exists. Add a Jest snapshot test
alongside the component using the existing `describeVisual` helper from
`frontend/test/visual.ts`. Capture these states:

- no template selected (the initial state);
- each available template selected, with its title, description, and selected
  styling visible.

The test should select templates by accessible name and snapshot only the
picker root. This keeps the baseline stable while still catching changes to
selection affordances, labels, and layout. Update snapshots only when the
feature PR intentionally changes the design.

## Notification center (#319)

Blocked until the notification-center feature exists. Add a component-level
accessibility test using the existing `checkA11y`/`expectNoA11yViolations`
helpers and Testing Library. Cover:

- opening and closing with Enter/Space and Escape;
- focus moving into the panel on open and returning to the trigger on close;
- keyboard focus remaining inside the modal panel while it is open;
- unread count exposed through an appropriate live/status region so assistive
  technology receives the count;
- no new entry in `frontend/test/a11y-exceptions.ts`.

The test should assert the accessible name and role of the panel, not an
implementation-specific class name.

