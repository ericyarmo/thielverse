# Lenses Eval (smoke)
- Determinism: same inputs → sha256(output) stable.
- Citations: 100% lines contain `[R#]`.
- Empty window: outputs exactly "Not enough receipts."
Runbook:
1) Seed 5 receipts for "helion".
2) GET /api/lens/engineer-realist/helion → capture sha256.
3) Re-run after 1 min → hashes equal.
4) Delete 4 receipts → response becomes "Not enough receipts."
