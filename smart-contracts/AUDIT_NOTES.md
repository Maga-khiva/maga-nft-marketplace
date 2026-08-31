# MagaMarketplace — Security Audit Notes

Internal review performed while adding a Hardhat test suite (32 tests) to
`MagaMarketplace.sol`. Two findings below; the high-severity one has been
fixed in the contract, the other two are documented as low-severity /
accepted-behavior for future consideration.

---

## Finding 1 — Refund DoS in `placeOffer()` (High) — **FIXED**

**Where:** `placeOffer(uint256 tokenId)`

**Before:**
```solidity
if (current.bidder != address(0)) {
    (bool refunded, ) = payable(current.bidder).call{value: current.amount}("");
    require(refunded, "Refund failed");
}
```

**Issue:** the previous highest bidder's refund was a hard requirement.
Any contract address that reverts on receiving ETH (e.g. no `receive()`/
`fallback()`, or one that intentionally reverts) could become the highest
bidder and then permanently block **every other user** from ever placing a
higher offer on that token — a denial-of-service on price discovery for
the whole token, not just for the attacker.

**Proof of concept:** `contracts/mocks/MaliciousBidder.sol` — a contract
whose `receive()` reverts. See
`test/marketplace.test.js → "FIX: placeOffer() refund uses pull-payment..."`
for the reproduction (before the fix, this same setup caused
`placeOffer()` to revert with `"Refund failed"` for every other bidder).

**Fix:** switched from push-payment to a pull-payment pattern. If the
direct refund fails, the amount is credited to a `pendingReturns` mapping
instead of blocking the transaction, and the bidder can claim it anytime
via a new `withdraw()` function.

```solidity
mapping(address => uint256) public pendingReturns;

if (current.bidder != address(0)) {
    (bool refunded, ) = payable(current.bidder).call{value: current.amount}("");
    if (!refunded) {
        pendingReturns[current.bidder] += current.amount;
        emit RefundQueued(tokenId, current.bidder, current.amount);
    }
}
```

```solidity
function withdraw() external nonReentrant {
    uint256 amount = pendingReturns[msg.sender];
    require(amount > 0, "Nothing to withdraw");
    pendingReturns[msg.sender] = 0;
    (bool sent, ) = payable(msg.sender).call{value: amount}("");
    require(sent, "Withdraw failed");
    emit Withdrawn(msg.sender, amount);
}
```

**Verified by:** 4 new tests covering the queued-refund path, the normal
direct-refund path (unaffected), successful withdrawal, and the
"nothing to withdraw" guard.

---

## Finding 2 — Same push-payment pattern in `buy()` and `acceptOffer()` (Low) — accepted, not fixed

**Where:** `buy()` pays the seller directly; `acceptOffer()` pays the
seller (`msg.sender`) directly. Both use `require(sent, ...)`.

**Why lower severity than Finding 1:** in both cases, the payment goes to
the account that itself initiated the transaction (the seller calling
`buy()` on their own listing indirectly, or the seller calling
`acceptOffer()` themselves). If that account can't receive ETH, only
*their own* action fails — it cannot be used to block other users' actions
on other tokens the way Finding 1 could.

**Recommendation:** if the project wants full consistency, the same
`pendingReturns` pool could absorb these failures too. Left as-is for now
since it's self-inflicted risk rather than a cross-user DoS vector — worth
revisiting if the marketplace expects many contract-wallet sellers.

---

## Finding 3 — `highestOffers` is not cleared when a token is sold via `buy()` (Informational)

**Where:** `buy()` never touches `highestOffers[tokenId]`.

**Behavior:** if a bidder has an active offer on a token, and the seller
sells it via a direct `buy()` instead of `acceptOffer()`, the bid stays
recorded. The **new** owner can then call `acceptOffer()` and receive that
old bid's ETH, transferring the NFT to the original bidder — even though
the bidder placed that offer expecting to buy from the *previous* owner
at a *different* moment.

**Status:** not necessarily a bug — could be an intentional design choice
("offers persist across ownership changes"). Flagged here as a product
decision rather than a security fix, since no funds are ever at risk: the
original bidder can always `cancelOffer()` to get their ETH back at any
time before someone accepts it.

**Verified by:** `test/marketplace.test.js → "Edge case: stale offer
survives a direct buy()"`.

---

## Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | `placeOffer()` refund DoS blocks all future bids | High | **Fixed** (pull-payment) |
| 2 | `buy()` / `acceptOffer()` push-payment to seller | Low | Accepted, documented |
| 3 | Stale offer survives direct `buy()` | Informational | Documented, needs product decision |

Reentrancy protection (`nonReentrant` on `buy`, `placeOffer`,
`cancelOffer`, `acceptOffer`, `withdraw`) was also independently verified
via a PoC attacker contract (`contracts/mocks/ReentrantSeller.sol`) that
attempts to re-enter `buy()` from its payment callback — confirmed
blocked.
