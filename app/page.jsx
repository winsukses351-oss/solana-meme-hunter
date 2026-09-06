'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Solana AI Meme Coin Hunter — app/page.jsx
 * Scanner (DexScreener) + optional wallet trading via Phantom (no private keys in code).
 * NEVER paste a private key into this file or into any input on this page.
 */

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote'
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap'

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b0e11',
    color: '#eaecef',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '0 0 40px',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 18px',
    background: '#12161c',
    borderBottom: '1px solid #1e2329',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  title: { fontSize: '1.05rem', fontWeight: 650, margin: 0 },
  badge: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 6,
    background: '#2b2f36',
    color: '#848e9c',
  },
  badgeWarn: { background: 'rgba(240,185,11,0.15)', color: '#f0b90b' },
  badgeOk: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  nav: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  navBtn: {
    background: 'transparent',
    border: '1px solid #1e2329',
    color: '#848e9c',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  navActive: { borderColor: '#f0b90b', color: '#eaecef' },
  main: { padding: 16, maxWidth: 1200, margin: '0 auto' },
  msg: { color: '#f0b90b', fontSize: 13, marginBottom: 10, minHeight: 18 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 14,
  },
  label: { fontSize: 12, color: '#848e9c', marginBottom: 4 },
  value: { fontSize: '1.15rem', fontWeight: 650 },
  panel: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  panelH: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    padding: '12px 16px',
    borderBottom: '1px solid #1e2329',
    fontWeight: 600,
    fontSize: 14,
  },
  panelB: { padding: 12, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    color: '#848e9c',
    fontWeight: 500,
    padding: '8px 6px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 6px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
  },
  btn: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6,
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnSecondary: {
    background: '#2b2f36',
    color: '#eaecef',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6,
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnDanger: {
    background: '#f6465d',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6,
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  tag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 650,
  },
  tagElite: { background: 'rgba(240,185,11,0.2)', color: '#f0b90b' },
  tagHigh: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  tagMod: { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  tagAvoid: { background: 'rgba(132,142,156,0.2)', color: '#848e9c' },
  muted: { color: '#848e9c' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  input: {
    width: '100%',
    background: '#0b0e11',
    border: '1px solid #1e2329',
    color: '#eaecef',
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    color: '#848e9c',
    fontSize: 12,
    padding: 16,
  },
  rowActions: { display: 'flex', gap: 6 },
}

function money(n, d = 0) {
  if (n == null || Number.isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: d })
}

function num(n, d = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toFixed(d)
}

function shortAddr(a) {
  if (!a) return '—'
  return a.slice(0, 4) + '…' + a.slice(-4)
}

function CategoryTag({ category }) {
  const c = (category || 'AVOID').toUpperCase()
  let s = styles.tagAvoid
  if (c.includes('ELITE')) s = styles.tagElite
  else if (c.includes('HIGH')) s = styles.tagHigh
  else if (c.includes('MODERATE')) s = styles.tagMod
  return <span style={{ ...styles.tag, ...s }}>{c}</span>
}

function safetyScore(t) {
  let score = 100
  const reasons = []
  let blocked = false
  const liq = t.liquidity_usd
  if (liq == null) {
    score -= 15
    reasons.push('Liquidity data unavailable')
  } else if (liq < 10000) {
    score -= 40
    reasons.push(`Low liquidity: $${liq.toFixed(0)}`)
    if (liq < 3000) {
      blocked = true
      reasons.push('BLOCK: Liquidity critically low')
    }
  }
  if (t.price_change_5m != null && Math.abs(t.price_change_5m) > 80) {
    score -= 15
    reasons.push('Extreme short-term move')
  }
  score = Math.max(0, Math.min(100, score))
  if (score < 40) blocked = true
  return { score, blocked, reasons }
}

function momentumScore(t) {
  let score = 50
  const reasons = []
  const pc5 = t.price_change_5m
  const pc1 = t.price_change_1h
  if (pc5 != null) {
    if (pc5 >= 5 && pc5 <= 40) {
      score += 12
      reasons.push(`Healthy 5m +${pc5.toFixed(1)}%`)
    } else if (pc5 > 40) {
      score += 5
      reasons.push('Strong 5m — possible overextension')
    } else if (pc5 < -15) {
      score -= 15
      reasons.push(`Weak 5m ${pc5.toFixed(1)}%`)
    }
  }
  if (pc1 != null) {
    if (pc1 >= 10 && pc1 <= 80) {
      score += 15
      reasons.push(`Solid 1h +${pc1.toFixed(1)}%`)
    } else if (pc1 < -20) {
      score -= 12
      reasons.push(`Weak 1h ${pc1.toFixed(1)}%`)
    }
  }
  const vol = t.volume_24h
  const liq = t.liquidity_usd
  if (vol && liq && liq > 0) {
    const ratio = vol / liq
    if (ratio >= 0.5 && ratio <= 8) {
      score += 10
      reasons.push('Healthy volume/liquidity')
    }
  }
  if (t.buy_sell_ratio != null) {
    if (t.buy_sell_ratio >= 1.5) {
      score += 12
      reasons.push('Buy pressure dominant')
    } else if (t.buy_sell_ratio < 0.7) {
      score -= 12
      reasons.push('Sell pressure dominant')
    }
  }
  return { score: Math.max(0, Math.min(100, score)), reasons }
}

function scoreToken(t) {
  const safety = safetyScore(t)
  const mom = momentumScore(t)
  const sm = 50
  const whale = 50
  let opp = safety.score * 0.3 + mom.score * 0.25 + sm * 0.25 + whale * 0.2
  if (safety.blocked) opp = Math.min(opp, 55)
  opp = Math.max(0, Math.min(100, opp))
  let category = 'AVOID'
  if (opp >= 90) category = 'ELITE'
  else if (opp >= 80) category = 'HIGH POTENTIAL'
  else if (opp >= 70) category = 'MODERATE'
  return {
    ...t,
    safety_score: Math.round(safety.score * 10) / 10,
    safety_blocked: safety.blocked,
    momentum_score: Math.round(mom.score * 10) / 10,
    smart_money_score: sm,
    whale_score: whale,
    opportunity_score: Math.round(opp * 10) / 10,
    category,
    main_reasons: [...safety.reasons.slice(0, 2), ...mom.reasons.slice(0, 2)],
  }
}

function normalizePair(pair) {
  const base = pair.baseToken || {}
  const vol = pair.volume || {}
  const liq = pair.liquidity || {}
  const pc = pair.priceChange || {}
  const tx = (pair.txns && pair.txns.h24) || {}
  const buys = tx.buys || 0
  const sells = tx.sells || 0
  const bsr = sells ? buys / sells : buys ? 2 : 1
  const f = (v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  return {
    mint: base.address,
    symbol: base.symbol,
    name: base.name,
    price_usd: f(pair.priceUsd),
    volume_24h: f(vol.h24),
    liquidity_usd: f(liq.usd),
    price_change_5m: f(pc.m5),
    price_change_1h: f(pc.h1),
    price_change_24h: f(pc.h24),
    buy_sell_ratio: bsr,
    url: pair.url,
    dex: pair.dexId,
    source: 'dexscreener',
  }
}

async function fetchPairs(query) {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.pairs) ? data.pairs : []
}

/** Jupiter quote: amountLamports of SOL -> token mint */
async function jupiterQuote(outputMint, amountLamports, slippageBps = 100) {
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint,
    amount: String(amountLamports),
    slippageBps: String(slippageBps),
  })
  const res = await fetch(`\( {JUPITER_QUOTE}? \){params}`)
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`)
  return res.json()
}

async function jupiterSwapTransaction(quoteResponse, userPublicKey) {
  const res = await fetch(JUPITER_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  })
  if (!res.ok) throw new Error(`Jupiter swap build failed (${res.status})`)
  return res.json()
}

export default function Page() {
  const [tab, setTab] = useState('dashboard')
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [lastScan, setLastScan] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [tradingEnabled, setTradingEnabled] = useState(false)
  const [buyAmountSol, setBuyAmountSol] = useState(0.01)
  const [slippageBps, setSlippageBps] = useState(100)
  const [minOppToBuy, setMinOppToBuy] = useState(70)
  const [busyMint, setBusyMint] = useState(null)
  const [settings, setSettings] = useState({
    minLiquidity: 5000,
    minVolume: 500,
    minOpportunity: 70,
    riskPerTrade: 1,
    maxPosition: 5,
    maxOpen: 3,
    dailyLoss: 5,
    stopLoss: 20,
    takeProfit: 50,
  })

  const connectWallet = async () => {
    try {
      const provider = typeof window !== 'undefined' ? window.solana : null
      if (!provider?.isPhantom) {
        setMsg('Phantom wallet not found. Install Phantom extension / app.')
        return
      }
      const res = await provider.connect()
      const pubkey = res.publicKey?.toString?.() || provider.publicKey?.toString?.()
      setWallet(pubkey)
      setMsg(`Wallet connected: ${shortAddr(pubkey)}`)
    } catch (e) {
      setMsg(String(e.message || e))
    }
  }

  const disconnectWallet = async () => {
    try {
      const provider = window.solana
      if (provider?.disconnect) await provider.disconnect()
    } catch (_) {}
    setWallet(null)
    setTradingEnabled(false)
    setMsg('Wallet disconnected')
  }

  const executeBuy = async (token) => {
    if (!wallet) {
      setMsg('Connect Phantom wallet first')
      return
    }
    if (!tradingEnabled) {
      setMsg('Enable trading toggle in Settings first (you still sign in Phantom)')
      return
    }
    if (token.safety_blocked) {
      setMsg('BUY blocked by safety engine')
      return
    }
    if ((token.opportunity_score || 0) < minOppToBuy) {
      setMsg(`Opportunity ${token.opportunity_score} < min ${minOppToBuy}`)
      return
    }
    const lamports = Math.floor(Number(buyAmountSol) * 1e9)
    if (!lamports || lamports < 1000) {
      setMsg('Buy amount too small')
      return
    }
    setBusyMint(token.mint)
    setMsg(`Quoting ${token.symbol}…`)
    try {
      const quote = await jupiterQuote(token.mint, lamports, slippageBps)
      setMsg(`Building swap for ${token.symbol}…`)
      const swap = await jupiterSwapTransaction(quote, wallet)
      const swapTx = swap.swapTransaction
      if (!swapTx) throw new Error('No swapTransaction from Jupiter')

      // Deserialize + sign via Phantom (private key never leaves wallet)
      const binary = atob(swapTx)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      // Prefer @solana/web3.js if present; otherwise Phantom signAndSendTransaction with raw
      const provider = window.solana
      if (!provider) throw new Error('Wallet provider missing')

      // Phantom can sign VersionedTransaction if web3 is available on window
      let signature
      if (window.solanaWeb3?.VersionedTransaction) {
        const tx = window.solanaWeb3.VersionedTransaction.deserialize(bytes)
        const signed = await provider.signAndSendTransaction(tx)
        signature = signed.signature || signed
      } else {
        // Fallback: ask user to use a setup with @solana/web3.js
        // Attempt Phantom's request method
        const signed = await provider.request({
          method: 'signAndSendTransaction',
          params: {
            message: swapTx,
          },
        }).catch(() => null)
        if (!signed) {
          throw new Error(
            'Install @solana/web3.js in your Next app for reliable swap signing, or open the token on DexScreener/Jupiter manually.'
          )
        }
        signature = signed.signature || signed
      }
      setMsg(`Swap submitted: ${String(signature).slice(0, 20)}…`)
    } catch (e) {
      setMsg(String(e.message || e))
    } finally {
      setBusyMint(null)
    }
  }

  const scan = useCallback(async () => {
    setLoading(true)
    setMsg('Scanning Solana meme pairs…')
    try {
      const queries = ['SOL', 'meme', 'pepe', 'bonk', 'pump']
      const all = []
      for (const q of queries) {
        try {
          const pairs = await fetchPairs(q)
          all.push(...pairs)
        } catch (_) {}
      }
      const seen = new Set()
      const scored = []
      for (const pair of all) {
        if (!pair || typeof pair !== 'object') continue
        const chain = (pair.chainId || '').toLowerCase()
        if (chain && chain !== 'solana') continue
        const n = normalizePair(pair)
        if (!n.mint || seen.has(n.mint)) continue
        seen.add(n.mint)
        const liq = n.liquidity_usd || 0
        const vol = n.volume_24h || 0
        if (liq < settings.minLiquidity && vol < settings.minVolume) continue
        scored.push(scoreToken(n))
      }
      scored.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
      setTokens(scored.slice(0, 40))
      setLastScan(new Date().toISOString())
      setMsg(
        `Scan complete: ${scored.length} candidates (showing top ${Math.min(40, scored.length)})`
      )
    } catch (e) {
      setMsg(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }, [settings.minLiquidity, settings.minVolume])

  useEffect(() => {
    scan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const provider = typeof window !== 'undefined' ? window.solana : null
    if (provider?.isPhantom && provider.publicKey) {
      setWallet(provider.publicKey.toString())
    }
  }, [])

  const top = useMemo(() => tokens.slice(0, 12), [tokens])
  const avgOpp = useMemo(() => {
    if (!tokens.length) return 0
    return tokens.reduce((s, t) => s + (t.opportunity_score || 0), 0) / tokens.length
  }, [tokens])

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['opportunities', 'Opportunities'],
    ['trading', 'Trading'],
    ['settings', 'Settings'],
    ['about', 'About'],
  ]

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={styles.title}>Solana AI Meme Coin Hunter</h1>
          <span
            style={{
              ...styles.badge,
              ...(tradingEnabled && wallet ? styles.badgeOk : styles.badgeWarn),
            }}
          >
            {tradingEnabled && wallet ? 'TRADING ARMED' : 'TRADING DISABLED'}
          </span>
          {wallet && (
            <span style={styles.badge}>{shortAddr(wallet)}</span>
          )}
        </div>
        <nav style={styles.nav}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              style={{ ...styles.navBtn, ...(tab === id ? styles.navActive : {}) }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
          {!wallet ? (
            <button type="button" style={styles.btn} onClick={connectWallet}>
              Connect Phantom
            </button>
          ) : (
            <button type="button" style={styles.btnSecondary} onClick={disconnectWallet}>
              Disconnect
            </button>
          )}
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.msg}>{msg}</div>

        {tab === 'dashboard' && (
          <>
            <div style={styles.grid}>
              <div style={styles.stat}>
                <div style={styles.label}>Tracked Tokens</div>
                <div style={styles.value}>{tokens.length}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Avg Opportunity</div>
                <div style={styles.value}>{num(avgOpp, 1)}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Buy Size (SOL)</div>
                <div style={styles.value}>{buyAmountSol}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Wallet</div>
                <div style={{ ...styles.value, fontSize: '0.9rem' }}>
                  {wallet ? shortAddr(wallet) : 'Not connected'}
                </div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Data Source</div>
                <div style={{ ...styles.value, fontSize: '0.95rem' }}>DexScreener</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Last Scan</div>
                <div style={{ ...styles.value, fontSize: '0.8rem' }}>
                  {lastScan ? new Date(lastScan).toLocaleTimeString() : '—'}
                </div>
              </div>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelH}>
                <span>Top Opportunities</span>
                <button
                  type="button"
                  style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                  disabled={loading}
                  onClick={scan}
                >
                  {loading ? 'Scanning…' : 'Scan Now'}
                </button>
              </div>
              <div style={styles.panelB}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Symbol', 'Score', 'Category', 'Safety', 'Liquidity', 'Volume', 'Price', 'Action'].map(
                        (h) => (
                          <th key={h} style={styles.th}>
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((t) => (
                      <tr key={t.mint}>
                        <td style={styles.td} title={t.mint}>
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noreferrer" style={{ color: '#eaecef' }}>
                              {t.symbol || '—'}
                            </a>
                          ) : (
                            t.symbol || '—'
                          )}
                        </td>
                        <td style={styles.td}>{num(t.opportunity_score, 1)}</td>
                        <td style={styles.td}>
                          <CategoryTag category={t.category} />
                        </td>
                        <td style={styles.td}>{num(t.safety_score, 0)}</td>
                        <td style={styles.td}>{money(t.liquidity_usd)}</td>
                        <td style={styles.td}>{money(t.volume_24h)}</td>
                        <td style={styles.td}>
                          {t.price_usd != null ? Number(t.price_usd).toPrecision(4) : '—'}
                        </td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            style={{
                              ...styles.btn,
                              fontSize: 11,
                              padding: '4px 8px',
                              ...((!wallet || !tradingEnabled || t.safety_blocked || busyMint === t.mint)
                                ? styles.btnDisabled
                                : {}),
                            }}
                            disabled={
                              !wallet ||
                              !tradingEnabled ||
                              t.safety_blocked ||
                              busyMint === t.mint
                            }
                            onClick={() => executeBuy(t)}
                          >
                            {busyMint === t.mint ? '…' : 'Buy'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!top.length && (
                      <tr>
                        <td style={{ ...styles.td, ...styles.muted }} colSpan={8}>
                          No data yet. Click Scan Now.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'opportunities' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>
              <span>Live Token Scanner</span>
              <button
                type="button"
                style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                disabled={loading}
                onClick={scan}
              >
                {loading ? 'Scanning…' : 'Refresh Scan'}
              </button>
            </div>
            <div style={styles.panelB}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Symbol', 'Name', 'Opp', 'Cat', 'Safety', 'Mom', 'Liq', 'Blocked', 'Buy'].map(
                      (h) => (
                        <th key={h} style={styles.th}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.mint}>
                      <td style={styles.td}>{t.symbol || '—'}</td>
                      <td
                        style={{
                          ...styles.td,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.name || '—'}
                      </td>
                      <td style={styles.td}>{num(t.opportunity_score, 1)}</td>
                      <td style={styles.td}>
                        <CategoryTag category={t.category} />
                      </td>
                      <td style={styles.td}>{num(t.safety_score, 0)}</td>
                      <td style={styles.td}>{num(t.momentum_score, 0)}</td>
                      <td style={styles.td}>{money(t.liquidity_usd)}</td>
                      <td style={styles.td}>{t.safety_blocked ? 'YES' : 'No'}</td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={{
                            ...styles.btn,
                            fontSize: 11,
                            padding: '4px 8px',
                            ...((!wallet || !tradingEnabled || t.safety_blocked)
                              ? styles.btnDisabled
                              : {}),
                          }}
                          disabled={!wallet || !tradingEnabled || t.safety_blocked}
                          onClick={() => executeBuy(t)}
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'trading' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>Live Trading (Wallet-signed only)</div>
            <div style={styles.panelB}>
              <p style={{ ...styles.muted, marginBottom: 12, lineHeight: 1.5 }}>
                Private keys are <strong>never</strong> stored in this page. Trades are signed
                by Phantom. You must confirm each transaction in the wallet.
              </p>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Buy amount (SOL)</div>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.001"
                    min="0"
                    value={buyAmountSol}
                    onChange={(e) => setBuyAmountSol(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={styles.label}>Slippage (bps)</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={slippageBps}
                    onChange={(e) => setSlippageBps(parseInt(e.target.value, 10) || 100)}
                  />
                </div>
                <div>
                  <div style={styles.label}>Min opportunity score to buy</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={minOppToBuy}
                    onChange={(e) => setMinOppToBuy(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={styles.label}>Enable trading arm</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input
                      type="checkbox"
                      checked={tradingEnabled}
                      onChange={(e) => setTradingEnabled(e.target.checked)}
                    />
                    <span style={{ fontSize: 13 }}>
                      I understand trading is high risk
                    </span>
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!wallet ? (
                  <button type="button" style={styles.btn} onClick={connectWallet}>
                    Connect Phantom
                  </button>
                ) : (
                  <button type="button" style={styles.btnSecondary} onClick={disconnectWallet}>
                    Disconnect {shortAddr(wallet)}
                  </button>
                )}
              </div>
              <p style={{ ...styles.muted, marginTop: 14, fontSize: 12 }}>
                For reliable signing, add <code>@solana/web3.js</code> to your Next.js project
                and expose VersionedTransaction if needed. Auto-trading with a server private
                key must run on a backend only — never in Vercel client code.
              </p>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>Scanner filters (UI only)</div>
            <div style={styles.panelB}>
              <div style={styles.formGrid}>
                {[
                  ['minLiquidity', 'Min Liquidity USD'],
                  ['minVolume', 'Min Volume USD'],
                  ['minOpportunity', 'Min Opportunity Score'],
                  ['riskPerTrade', 'Risk Per Trade %'],
                  ['maxPosition', 'Max Position Size USD'],
                  ['maxOpen', 'Max Open Positions'],
                  ['dailyLoss', 'Daily Loss Limit %'],
                  ['stopLoss', 'Stop Loss %'],
                  ['takeProfit', 'Take Profit %'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <div style={styles.label}>{label}</div>
                    <input
                      style={styles.input}
                      type="number"
                      value={settings[key]}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          [key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>About & security</div>
            <div style={styles.panelB}>
              <ul style={{ ...styles.muted, lineHeight: 1.8, paddingLeft: 18 }}>
                <li>Scanner uses public DexScreener data</li>
                <li>Scores are informational only</li>
                <li>No private keys in this frontend</li>
                <li>Buys require Phantom signature</li>
                <li>No promise of profit — high risk</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        Solana AI Meme Coin Hunter · Not financial advice · Never paste private keys here
      </footer>
    </div>
  )
}
