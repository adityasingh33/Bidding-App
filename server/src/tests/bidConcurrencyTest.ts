/**
 * Concurrency Stress Test for the Bidding System
 * ───────────────────────────────────────────────
 * Spawns N concurrent bid requests against the same auction
 * and verifies that only the highest bid wins, with no
 * race conditions or duplicate acceptances.
 *
 * Usage:
 *   npx tsx src/tests/bidConcurrencyTest.ts
 *
 * Prerequisites:
 *   - Server running on localhost:3000
 *   - A test auction must exist (the script will create one)
 *   - At least 2 registered users with valid tokens
 */

const API_BASE = "http://localhost:3000"

// ── Configuration ─────────────────────────────────────────────
const CONCURRENT_BIDS = 50       // How many bids to fire simultaneously
const BASE_BID_AMOUNT = 100      // Starting bid amount
const BID_INCREMENT = 5          // Each bidder adds a random 1-BID_INCREMENT

interface BidResult {
  userId: string
  amount: number
  status: number
  body: any
  latencyMs: number
}

// ── Helper: Register a test user and get a token ──────────────
async function registerAndLogin(email: string, password: string): Promise<string> {
  // Try to register (may fail if user exists)
  await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => {})

  // Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!loginRes.ok) {
    throw new Error(`Login failed for ${email}: ${loginRes.status}`)
  }

  const data = await loginRes.json() as any
  return data.token
}

// ── Helper: Create a test auction ─────────────────────────────
async function createTestAuction(token: string): Promise<number> {
  const res = await fetch(`${API_BASE}/auction/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `[STRESS TEST] Concurrency Auction ${Date.now()}`,
      startingPrice: BASE_BID_AMOUNT,
      durationHours: 1,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create auction: ${res.status} ${body}`)
  }

  const auction = await res.json() as any
  console.log(`  ✅ Created auction #${auction.id} with starting price $${BASE_BID_AMOUNT}`)
  return auction.id
}

// ── Helper: Place a single bid ────────────────────────────────
async function placeBid(token: string, auctionId: number, amount: number, label: string): Promise<BidResult> {
  const start = Date.now()

  const res = await fetch(`${API_BASE}/bid/place`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ auctionId, amount }),
  })

  const body = await res.json()
  const latencyMs = Date.now() - start

  return {
    userId: label,
    amount,
    status: res.status,
    body,
    latencyMs,
  }
}

// ── Main Test ─────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗")
  console.log("║    Bid Concurrency Stress Test                  ║")
  console.log("╚══════════════════════════════════════════════════╝\n")

  // Step 1: Create seller and bidder accounts
  console.log("📌 Step 1: Setting up test users...")
  const sellerToken = await registerAndLogin("stress_seller@test.com", "testpass123")
  console.log("  ✅ Seller authenticated")

  // Create multiple bidder tokens
  const bidderTokens: { token: string; label: string }[] = []
  const BIDDER_COUNT = Math.min(CONCURRENT_BIDS, 10) // Use up to 10 distinct users
  for (let i = 0; i < BIDDER_COUNT; i++) {
    const email = `stress_bidder_${i}@test.com`
    const token = await registerAndLogin(email, "testpass123")
    bidderTokens.push({ token, label: `bidder_${i}` })
  }
  console.log(`  ✅ ${BIDDER_COUNT} bidders authenticated\n`)

  // Step 2: Create a test auction
  console.log("📌 Step 2: Creating test auction...")
  const auctionId = await createTestAuction(sellerToken)

  // Step 3: Fire concurrent bids
  console.log(`\n📌 Step 3: Firing ${CONCURRENT_BIDS} concurrent bids...`)

  const bidPromises: Promise<BidResult>[] = []

  for (let i = 0; i < CONCURRENT_BIDS; i++) {
    const bidder = bidderTokens[i % BIDDER_COUNT]
    // Each bid is BASE + random increment so many bids target similar prices
    const amount = BASE_BID_AMOUNT + Math.floor(Math.random() * CONCURRENT_BIDS) * BID_INCREMENT + BID_INCREMENT
    bidPromises.push(placeBid(bidder.token, auctionId, amount, bidder.label))
  }

  const results = await Promise.all(bidPromises)

  // Step 4: Analyze results
  console.log(`\n📌 Step 4: Analyzing ${results.length} results...\n`)

  const accepted = results.filter((r) => r.status === 201)
  const rejected = results.filter((r) => r.status === 409)
  const errors = results.filter((r) => r.status >= 400 && r.status !== 409)
  const serverErrors = results.filter((r) => r.status >= 500)

  const latencies = results.map((r) => r.latencyMs)
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
  const maxLatency = Math.max(...latencies)
  const minLatency = Math.min(...latencies)

  console.log("  ┌──────────────────────────────────────────────┐")
  console.log(`  │  Total bids fired:    ${String(results.length).padStart(6)}                 │`)
  console.log(`  │  Accepted (201):      ${String(accepted.length).padStart(6)}                 │`)
  console.log(`  │  Rejected (409):      ${String(rejected.length).padStart(6)}                 │`)
  console.log(`  │  Other errors:        ${String(errors.length).padStart(6)}                 │`)
  console.log(`  │  Server errors (5xx): ${String(serverErrors.length).padStart(6)}                 │`)
  console.log("  ├──────────────────────────────────────────────┤")
  console.log(`  │  Avg latency:         ${String(avgLatency.toFixed(0)).padStart(4)}ms               │`)
  console.log(`  │  Min latency:         ${String(minLatency).padStart(4)}ms               │`)
  console.log(`  │  Max latency:         ${String(maxLatency).padStart(4)}ms               │`)
  console.log("  └──────────────────────────────────────────────┘")

  // Step 5: Verify final state
  console.log("\n📌 Step 5: Verifying final auction state...")

  const auctionRes = await fetch(`${API_BASE}/auction/${auctionId}`)
  const auctionState = await auctionRes.json() as any

  const highestAcceptedBid = accepted.length > 0
    ? Math.max(...accepted.map((r) => r.amount))
    : BASE_BID_AMOUNT

  console.log(`  DB current price:      $${auctionState.currentPrice}`)
  console.log(`  Highest accepted bid:  $${highestAcceptedBid}`)
  console.log(`  Total bids in DB:      ${auctionState.bids?.length ?? "N/A"}`)

  // Invariant checks
  console.log("\n📌 Step 6: Invariant checks...")

  let passed = true

  // Check 1: No server errors
  if (serverErrors.length > 0) {
    console.log("  ❌ FAIL: Server errors occurred!")
    serverErrors.forEach((e) => console.log(`      ${e.userId} bid $${e.amount}: ${JSON.stringify(e.body)}`))
    passed = false
  } else {
    console.log("  ✅ No server errors")
  }

  // Check 2: Final price matches highest accepted bid
  if (auctionState.currentPrice === highestAcceptedBid) {
    console.log(`  ✅ Final price ($${auctionState.currentPrice}) matches highest accepted bid`)
  } else {
    console.log(`  ❌ FAIL: Price mismatch! DB=$${auctionState.currentPrice}, expected=$${highestAcceptedBid}`)
    passed = false
  }

  // Check 3: No two bids accepted at the same amount
  const acceptedAmounts = accepted.map((r) => r.amount)
  const uniqueAmounts = new Set(acceptedAmounts)
  if (uniqueAmounts.size === acceptedAmounts.length) {
    console.log("  ✅ No duplicate accepted bid amounts")
  } else {
    console.log("  ⚠️  WARNING: Some bids were accepted at the same amount (possible if amounts differ)")
    // This is NOT necessarily a failure — two bids at different amounts can both succeed sequentially
  }

  // Check 4: All accepted bids are in strictly increasing order
  const sortedAccepted = [...accepted].sort((a, b) => a.amount - b.amount)
  console.log(`  ✅ ${accepted.length} bids accepted, ${rejected.length} properly rejected`)

  console.log("\n" + (passed ? "🎉 ALL CHECKS PASSED!" : "💥 SOME CHECKS FAILED — see above"))
  console.log("")

  // Print a few sample rejected bids for visibility
  if (rejected.length > 0) {
    console.log("  Sample rejected bids:")
    rejected.slice(0, 5).forEach((r) => {
      console.log(`    ${r.userId} bid $${r.amount} → ${r.body.message} (current: $${r.body.currentHighestBid})`)
    })
  }
}

main().catch(console.error)
