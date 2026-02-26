## Summary

<!-- One paragraph: what does this PR change and why? -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation only
- [ ] Refactor (no behavior change)
- [ ] Test coverage
- [ ] CI / tooling

## Related Issue

Closes #<!-- issue number -->

---

## Innovation Checklist

*Required for features, contract changes, and new services. Check each item honestly.*

- [ ] There is real, demonstrated demand for this change (not hypothetical)
- [ ] The demand is recurrent — not a one-time or edge-case need
- [ ] The attack surface introduced has been assessed and documented below
- [ ] This change does not violate any of the 50 axioms (see compliance statement below)
- [ ] This change does not require custody of user funds (A0-12)
- [ ] Every step of the decision is auditable retroactively
- [ ] The change fails safely if something goes wrong
- [ ] The change can be disabled without taking down the rest of the system

**Attack surface introduced or expanded:**
<!-- Describe any new attack surface. If none, write "None." -->

---

## Axiom Compliance Statement

*Required for all PRs touching contracts, agent logic, pricing, treasury, or the Risk Engine.*

I have read all 50 axioms in `files/13_AXIOMAS_REFERENCIA.md` and verified that this change does not violate any active axiom.

Axioms most relevant to this change:

| Axiom | Name | How This Change Relates |
|-------|------|------------------------|
| A0-   |      |                        |
| A0-   |      |                        |

**No axiom is violated by this change.**

<!-- If you cannot make this statement, do not open this PR. -->

---

## Changes Made

<!-- Bullet-point list of what was changed. Be specific. -->

-
-
-

## Test Evidence

<!-- Describe how you tested this. Include command output, screenshots, or logs as appropriate. -->

```
# For contract changes: paste anchor test output
# For frontend changes: describe manual test steps and browser
# For API changes: paste relevant curl/request logs
```

## For Contract Changes Only

- [ ] `anchor build` succeeds with no warnings
- [ ] `anchor test` passes — all existing tests green
- [ ] `cargo clippy -- -D warnings` produces no new warnings
- [ ] PDA seeds unchanged (no on-chain identifier modifications)
- [ ] `noumen_*` crate names unchanged
- [ ] `overflow-checks = true` remains set in `Cargo.toml`
- [ ] `log_decision()` is called before any new execution path (A0-5)

## For Frontend Changes Only

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Tested in Chromium-based browser and Firefox
- [ ] No new environment variables added without updating `.env.local.example`
- [ ] No hardcoded secrets, RPC endpoints, or API keys in source

## Breaking Changes

<!-- If this is a breaking change, describe exactly what breaks and provide a migration path. -->

## Additional Notes

<!-- Anything else reviewers should know. -->
