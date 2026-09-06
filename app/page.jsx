'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Solana AI Meme Coin Hunter v2 — app/page.jsx
 * Better meme filters, scoring, UI, wallet buy via Phantom (no private keys).
 */

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const BLOCKED_MINTS = new Set([SOL_MINT, USDC_MINT, USDT_MINT])
const BLOCKED_SYMBOLS = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'BTC', 'ETH', 'WBTC', 'WETH'])

const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote'
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap'

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b0e11',
    color: '#eaecef',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '0 0 48px',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '12px 14px',
    background: '#12161c',
    borderBottom: '1px solid #1e2329',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  title: { fontSize: '1rem', fontWeight: 700, margin: 0 },
  badge: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 6,
    background: '#2b2f36',
    color: '#848e9c',
    fontWeight: 600,
  },
  badgeWarn: { background: 'rgba(240,185,11,0.15)', color: '#f0b90b' },
  badgeOk: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  nav: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  navBtn: {
    background: 'transparent',
    border: '1px solid #1e2329',
    color: '#848e9c',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  navActive: { borderColor: '#f0b90b', color: '#eaecef', background: 'rgba(240,185,11,0.08)' },
  main: { padding: 12, maxWidth: 1100, margin: '0 auto' },
  msg: { color: '#f0b90b', fontSize: 12, marginBottom: 10, minHeight: 16 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  stat: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 12,
  },
  label: { fontSize: 11, color: '#848e9c', marginBottom: 4 },
  value: { fontSize: '1.05rem', fontWeight: 700 },
  panel: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  panelH: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    padding: '10px 12px',
    borderBottom: '1px solid #1e2329',
    fontWeight: 650,
    fontSize: 13,
  },
  panelB: { padding: 8, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    textAlign: 'left',
    color: '#848e9c',
    fontWeight: 500,
    padding: '8px 6px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '9px 6px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  btn: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '7px 12px',
    borderRadius: 6,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12,
  },
  btnSm: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '4px 8px',
    borderRadius: 5,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 11,
  },
  btnSecondary: {
    background: '#2b2f36',
    color: '#eaecef',
    border: 'none',
    padding: '7px 12px',
    borderRadius: 6,
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 12,
  },
  btnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
  tag: {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  tagElite: { background: 'rgba(240,185,11,0.2)', color: '#f0b90b' },
  tagHigh: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  tagMod: { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  tagAvoid: { background: 'rgba(132,142,156,0.2)', color: '#848e9c' },
  muted: { color: '#848e9c' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
  },
  input: {
    width: '100%',
    background: '#0b0e11',
    border: '1px solid #1e2329',
    color: '#eaecef',
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 13,
  },
  footer: { textAlign: 'center', color: '#848e9c', fontSize: 11, padding: 16 },
  pos: { color: '#0ecb81' },
  neg: { color: '#f6465d' },
  cardList: { display: 'grid', gap: 8 },
  card: {
    background: '#0b0e11',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 12,
  },
}

function money(n, d = 0) {
  if (n == null || Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
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

function pctColor(v) {
  if (v == null) return styles.muted
  return v >= 0 ? styles.pos : styles.neg
}

function CategoryTag({ category }) {
  const c = (category || 'AVOID').toUpperCase()
  let s = styles.tagAvoid
  if (c.includes('ELITE')) s = styles.tagElite
  else if (c.includes('HIGH')) s = styles.tagHigh
  else if (c.includes('MODERATE')) s = styles.tagMod
  return <span style={{ ...styles.tag, ...s }}>{c}</span>
}

function isMemeCandidate(n) {
  if (!n.mint || BLOCKED_MINTS.has(n.mint)) return false
  const sym = (n.symbol || '').toUpperCase()
  if (BLOCKED_SYMBOLS.has(sym)) return false
  const name = (n.name || '').toLowerCase()
  if (name === 'solana' || name === 'wrapped sol') return false
  // Prefer smaller caps / meme range liquidity
  const liq = n.liquidity_usd || 0
  if (liq > 5_000_000) return false // too large, likely major
  if (liq < 2000 && (n.volume_24h || 0) < 300) return false
  return true
}

function safetyScore(t) {
  let score = 100
  const reasons = []
  let blocked = false
  const liq = t.liquidity_usd
  if (liq == null) {
    score -= 20
    reasons.push('Liquidity unknown')
  } else if (liq < 5000) {
    score -= 35
    reasons.push(`Low liquidity ${money(liq)}`)
    if (liq < 1500) {
      blocked = true
      reasons.push('BLOCK: critical liquidity')
    }
  } else if (liq >= 20000 && liq <= 500000) {
    score += 5
  }
  if (t.price_change_5m != null && Math.abs(t.price_change_5m) > 90) {
    score -= 20
    reasons.push('Extreme 5m volatility')
  }
  if (t.buy_sell_ratio != null && t.buy_sell_ratio < 0.5) {
    score -= 15
    reasons.push('Heavy sell pressure')
  }
  score = Math.max(0, Math.min(100, score))
  if (score < 35) blocked = true
  return { score, blocked, reasons }
}

function momentumScore(t) {
  let score = 45
  const reasons = []
  const pc5 = t.price_change_5m
  const pc1 = t.price_change_1h
  const pc24 = t.price_change_24h
  if (pc5 != null) {
    if (pc5 >= 3 && pc5 <= 35) {
      score += 15
      reasons.push(`5m +${pc5.toFixed(1)}%`)
    } else if (pc5 > 35 && pc5 <= 80) {
      score += 8
      reasons.push('Hot 5m move')
    } else if (pc5 > 80) {
      score -= 5
      reasons.push('Parabolic risk')
    } else if (pc5 < -20) {
      score -= 18
      reasons.push(`5m ${pc5.toFixed(1)}%`)
    }
  }
  if (pc1 != null) {
    if (pc1 >= 8 && pc1 <= 60) {
      score += 18
      reasons.push(`1h +${pc1.toFixed(1)}%`)
    } else if (pc1 > 60) {
      score += 6
      reasons.push('Strong 1h')
    } else if (pc1 < -25) {
      score -= 15
    }
  }
  if (pc24 != null && pc24 > 20 && pc24 < 200) {
    score += 8
    reasons.push(`24h +${pc24.toFixed(0)}%`)
  }
  const vol = t.volume_24h || 0
  const liq = t.liquidity_usd || 0
  if (vol > 0 && liq > 0) {
    const ratio = vol / liq
    if (ratio >= 0.3 && ratio <= 12) {
      score += 12
      reasons.push('Healthy vol/liq')
    } else if (ratio > 12) {
      score += 4
      reasons.push('High turnover')
    }
  }
  if (t.buy_sell_ratio != null) {
    if (t.buy_sell_ratio >= 1.4) {
      score += 14
      reasons.push('Buy pressure')
    } else if (t.buy_sell_ratio >= 1.1) {
      score += 6
    } else if (t.buy_sell_ratio < 0.75) {
      score -= 14
      reasons.push('Sell pressure')
    }
  }
  // pump.fun style mint bonus (ends with pump often)
  if ((t.mint || '').toLowerCase().endsWith('pump')) {
    score += 4
    reasons.push('pump.fun style mint')
  }
  return { score: Math.max(0, Math.min(100, score)), reasons }
}

function scoreToken(t) {
  const safety = safetyScore(t)
  const mom = momentumScore(t)
  const sm = 50
  const whale = 50
  let opp = safety.score * 0.28 + mom.score * 0.42 + sm * 0.15 + whale * 0.15
  if (safety.blocked) opp = Math.min(opp, 52)
  opp = Math.max(0, Math.min(100, opp))
  let category = 'AVOID'
  if (opp >= 88) category = 'ELITE'
  else if (opp >= 78) category = 'HIGH POTENTIAL'
  else if (opp >= 68) category = 'MODERATE'
  return {
    ...t,
    safety_score: Math.round(safety.score * 10) / 10,
    safety_blocked: safety.blocked,
    momentum_score: Math.round(mom.score * 10) / 10,
    smart_money_score: sm,
    whale_score: whale,
    opportunity_score: Math.round(opp * 10) / 10,
    category,
    main_reasons: [...mom.reasons.slice(0, 2), ...safety.reasons.slice(0, 1)],
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
    txns_buys: buys,
    txns_sells: sells,
    url: pair.url,
    dex: pair.dexId,
    pairAddress: pair.pairAddress,
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

async function fetchTokenBoosts() {
  try {
    const res = await fetch('https://api.dexscreener.com/token-boosts/latest/v1')
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function fetchPairsByToken(mint) {
  try {
    const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${mint}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

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
  const [slippageBps, setSlippageBps] = useState(150)
  const [minOppToBuy, setMinOppToBuy] = useState(68)
  const [busyMint, setBusyMint] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [onlyPump, setOnlyPump] = useState(false)
  const [settings, setSettings] = useState({
    minLiquidity: 3000,
    minVolume: 500,
    maxLiquidity: 2000000,
  })

  const connectWallet = async () => {
    try {
      const provider = typeof window !== 'undefined' ? window.solana : null
      if (!provider?.isPhantom) {
        setMsg('Phantom not found. Open this page in a browser with Phantom installed.')
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
      if (window.solana?.disconnect) await window.solana.disconnect()
    } catch (_) {}
    setWallet(null)
    setTradingEnabled(false)
    setMsg('Wallet disconnected')
  }

  const executeBuy = async (token) => {
    if (!wallet) return setMsg('Connect Phantom first')
    if (!tradingEnabled) return setMsg('Enable trading arm in Trading tab first')
    if (token.safety_blocked) return setMsg('BUY blocked by safety checks')
    if ((token.opportunity_score || 0) < minOppToBuy) {
      return setMsg(`Score ${token.opportunity_score} < min ${minOppToBuy}`)
    }
    const lamports = Math.floor(Number(buyAmountSol) * 1e9)
    if (!lamports || lamports < 1000) return setMsg('Buy amount too small')

    setBusyMint(token.mint)
    setMsg(`Quoting ${token.symbol}…`)
    try {
      const quote = await jupiterQuote(token.mint, lamports, slippageBps)
      setMsg(`Building swap ${token.symbol}…`)
      const swap = await jupiterSwapTransaction(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swapTransaction')

      const binary = atob(swap.swapTransaction)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      const provider = window.solana
      if (!provider) throw new Error('Wallet missing')

      if (window.solanaWeb3?.VersionedTransaction) {
        const tx = window.solanaWeb3.VersionedTransaction.deserialize(bytes)
        const signed = await provider.signAndSendTransaction(tx)
        setMsg(`Submitted: ${String(signed.signature || signed).slice(0, 24)}…`)
      } else {
        throw new Error(
          'Add @solana/web3.js for swap signing, or buy manually on Jupiter/DexScreener.'
        )
      }
    } catch (e) {
      setMsg(String(e.message || e))
    } finally {
      setBusyMint(null)
    }
  }

  const scan = useCallback(async () => {
    setLoading(true)
    setMsg('Scanning meme candidates…')
    try {
      const queries = ['pump', 'meme', 'bonk', 'pepe', 'ai', 'dog', 'cat', 'frog']
      const all = []
      for (const q of queries) {
        try {
          all.push(...(await fetchPairs(q)))
        } catch (_) {}
      }

      // Boosted tokens enrichment
      const boosts = await fetchTokenBoosts()
      const solBoosts = boosts.filter((b) => (b.chainId || '').toLowerCase() === 'solana')
      for (const b of solBoosts.slice(0, 15)) {
        if (b.tokenAddress) {
          try {
            all.push(...(await fetchPairsByToken(b.tokenAddress)))
          } catch (_) {}
        }
      }

      const seen = new Set()
      const scored = []
      for (const pair of all) {
        if (!pair || typeof pair !== 'object') continue
        const chain = (pair.chainId || '').toLowerCase()
        if (chain && chain !== 'solana') continue
        const n = normalizePair(pair)
        if (!n.mint || seen.has(n.mint)) continue
        if (!isMemeCandidate(n)) continue
        if (onlyPump && !(n.mint || '').toLowerCase().endsWith('pump')) continue
        const liq = n.liquidity_usd || 0
        const vol = n.volume_24h || 0
        if (liq < settings.minLiquidity && vol < settings.minVolume) continue
        if (liq > settings.maxLiquidity) continue
        seen.add(n.mint)
        scored.push(scoreToken(n))
      }

      scored.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
      setTokens(scored.slice(0, 50))
      setLastScan(new Date().toISOString())
      setMsg(`Found ${scored.length} meme candidates (showing top ${Math.min(50, scored.length)})`)
    } catch (e) {
      setMsg(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }, [settings, onlyPump])

  useEffect(() => {
    scan()
  }, [scan])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(() => scan(), 45000)
    return () => clearInterval(id)
  }, [autoRefresh, scan])

  useEffect(() => {
    const p = typeof window !== 'undefined' ? window.solana : null
    if (p?.isPhantom && p.publicKey) setWallet(p.publicKey.toString())
  }, [])

  const top = useMemo(() => tokens.slice(0, 15), [tokens])
  const hot = useMemo(
    () => tokens.filter((t) => (t.opportunity_score || 0) >= 68).slice(0, 10),
    [tokens]
  )
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

  const TokenRow = ({ t, showBuy }) => (
    <tr key={t.mint}>
      <td style={styles.td} title={t.mint}>
        {t.url ? (
          <a href={t.url} target="_blank" rel="noreferrer" style={{ color: '#eaecef', fontWeight: 600 }}>
            {t.symbol || '—'}
          </a>
        ) : (
          <strong>{t.symbol || '—'}</strong>
        )}
      </td>
      <td style={styles.td}>{num(t.opportunity_score, 1)}</td>
      <td style={styles.td}>
        <CategoryTag category={t.category} />
      </td>
      <td style={styles.td}>{num(t.safety_score, 0)}</td>
      <td style={{ ...styles.td, ...pctColor(t.price_change_1h) }}>
        {t.price_change_1h != null ? `\( {t.price_change_1h > 0 ? '+' : ''} \){num(t.price_change_1h, 1)}%` : '—'}
      </td>
      <td style={styles.td}>{money(t.liquidity_usd)}</td>
      <td style={styles.td}>{money(t.volume_24h)}</td>
      <td style={styles.td}>
        {t.price_usd != null
          ? t.price_usd < 0.01
            ? t.price_usd.toExponential(2)
            : Number(t.price_usd).toPrecision(4)
          : '—'}
      </td>
      {showBuy && (
        <td style={styles.td}>
          <button
            type="button"
            style={{
              ...styles.btnSm,
              ...((!wallet || !tradingEnabled || t.safety_blocked || busyMint === t.mint)
                ? styles.btnDisabled
                : {}),
            }}
            disabled={!wallet || !tradingEnabled || t.safety_blocked || busyMint === t.mint}
            onClick={() => executeBuy(t)}
          >
            {busyMint === t.mint ? '…' : 'Buy'}
          </button>
        </td>
      )}
    </tr>
  )

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={styles.title}>Solana AI Meme Coin Hunter</h1>
          <span
            style={{
              ...styles.badge,
              ...(tradingEnabled && wallet ? styles.badgeOk : styles.badgeWarn),
            }}
          >
            {tradingEnabled && wallet ? 'TRADING ARMED' : 'TRADING DISABLED'}
          </span>
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
              {shortAddr(wallet)}
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
                <div style={styles.label}>Meme Candidates</div>
                <div style={styles.value}>{tokens.length}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Hot (≥68)</div>
                <div style={{ ...styles.value, color: '#0ecb81' }}>{hot.length}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Avg Score</div>
                <div style={styles.value}>{num(avgOpp, 1)}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Buy Size</div>
                <div style={styles.value}>{buyAmountSol} SOL</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.label}>Wallet</div>
                <div style={{ ...styles.value, fontSize: '0.85rem' }}>
                  {wallet ? shortAddr(wallet) : 'Not connected'}
                </div>
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
                <span>Top Meme Opportunities</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 11, color: '#848e9c', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Auto 45s
                  </label>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                    disabled={loading}
                    onClick={scan}
                  >
                    {loading ? 'Scanning…' : 'Scan Now'}
                  </button>
                </div>
              </div>
              <div style={styles.panelB}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Symbol', 'Score', 'Cat', 'Safety', '1h %', 'Liq', 'Vol', 'Price', 'Buy'].map((h) => (
                        <th key={h} style={styles.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((t) => (
                      <TokenRow key={t.mint} t={t} showBuy />
                    ))}
                    {!top.length && (
                      <tr>
                        <td style={{ ...styles.td, ...styles.muted }} colSpan={9}>
                          No meme candidates. Click Scan Now.
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
              <span>Full Scanner ({tokens.length})</span>
              <button type="button" style={styles.btn} disabled={loading} onClick={scan}>
                {loading ? 'Scanning…' : 'Refresh'}
              </button>
            </div>
            <div style={styles.panelB}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Symbol', 'Score', 'Cat', 'Safety', '1h %', 'Liq', 'Vol', 'Price', 'Buy'].map((h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <TokenRow key={t.mint} t={t} showBuy />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'trading' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>Trading Controls</div>
            <div style={{ ...styles.panelB, padding: 14 }}>
              <p style={{ ...styles.muted, marginBottom: 12, fontSize: 12, lineHeight: 1.5 }}>
                No private keys on this page. Each buy is signed in Phantom. High risk — size small.
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
                  <div style={styles.label}>Min score to allow Buy</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={minOppToBuy}
                    onChange={(e) => setMinOppToBuy(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={styles.label}>Arm trading</div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                    <input
                      type="checkbox"
                      checked={tradingEnabled}
                      onChange={(e) => setTradingEnabled(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>I accept trading risk</span>
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                {!wallet ? (
                  <button type="button" style={styles.btn} onClick={connectWallet}>
                    Connect Phantom
                  </button>
                ) : (
                  <button type="button" style={styles.btnSecondary} onClick={disconnectWallet}>
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>Scanner filters</div>
            <div style={{ ...styles.panelB, padding: 14 }}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Min liquidity USD</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={settings.minLiquidity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, minLiquidity: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Min volume USD</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={settings.minVolume}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, minVolume: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Max liquidity USD</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={settings.maxLiquidity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, maxLiquidity: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Only pump.fun mints</div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                    <input
                      type="checkbox"
                      checked={onlyPump}
                      onChange={(e) => setOnlyPump(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Filter *pump mints</span>
                  </label>
                </div>
              </div>
              <button type="button" style={{ ...styles.btn, marginTop: 14 }} onClick={scan}>
                Apply & Rescan
              </button>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div style={styles.panel}>
            <div style={styles.panelH}>About v2</div>
            <div style={{ ...styles.panelB, padding: 14 }}>
              <ul style={{ ...styles.muted, lineHeight: 1.8, paddingLeft: 18, fontSize: 13 }}>
                <li>Filters out SOL/USDC/major pairs (fixes fake SOL rows)</li>
                <li>Boosts + meme keyword scan + pump.fun style detection</li>
                <li>Stronger momentum weighting in opportunity score</li>
                <li>Auto-refresh every 45s (toggleable)</li>
                <li>Wallet buys via Jupiter + Phantom — no private keys in code</li>
                <li>No profit guarantee — trade small</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        Solana AI Meme Coin Hunter v2 · Not financial advice · Never paste private keys
      </footer>
    </div>
  )
}
