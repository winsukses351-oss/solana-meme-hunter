'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Solana AI Meme Coin Hunter v3
 * - Left sidebar navigation
 * - Fixed 1h% display bug
 * - Meme filters, scoring, Phantom buy (no private keys)
 */

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const BLOCKED_MINTS = new Set([SOL_MINT, USDC_MINT, USDT_MINT])
const BLOCKED_SYMBOLS = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'BTC', 'ETH', 'WBTC', 'WETH'])

const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote'
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap'

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

function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return sign + Number(v).toFixed(1) + '%'
}

function pctColor(v) {
  if (v == null) return '#848e9c'
  return v >= 0 ? '#0ecb81' : '#f6465d'
}

function CategoryTag({ category }) {
  const c = (category || 'AVOID').toUpperCase()
  let bg = 'rgba(132,142,156,0.2)'
  let color = '#848e9c'
  if (c.includes('ELITE')) {
    bg = 'rgba(240,185,11,0.2)'
    color = '#f0b90b'
  } else if (c.includes('HIGH')) {
    bg = 'rgba(14,203,129,0.15)'
    color = '#0ecb81'
  } else if (c.includes('MODERATE')) {
    bg = 'rgba(59,130,246,0.15)'
    color = '#3b82f6'
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: bg,
        color,
      }}
    >
      {c}
    </span>
  )
}

function isMemeCandidate(n) {
  if (!n.mint || BLOCKED_MINTS.has(n.mint)) return false
  const sym = (n.symbol || '').toUpperCase()
  if (BLOCKED_SYMBOLS.has(sym)) return false
  const name = (n.name || '').toLowerCase()
  if (name === 'solana' || name === 'wrapped sol') return false
  const liq = n.liquidity_usd || 0
  if (liq > 5_000_000) return false
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
    reasons.push('Low liquidity')
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
      reasons.push('Healthy 5m')
    } else if (pc5 > 35 && pc5 <= 80) {
      score += 8
      reasons.push('Hot 5m')
    } else if (pc5 > 80) {
      score -= 5
      reasons.push('Parabolic risk')
    } else if (pc5 < -20) {
      score -= 18
      reasons.push('Weak 5m')
    }
  }
  if (pc1 != null) {
    if (pc1 >= 8 && pc1 <= 60) {
      score += 18
      reasons.push('Solid 1h')
    } else if (pc1 > 60) {
      score += 6
      reasons.push('Strong 1h')
    } else if (pc1 < -25) {
      score -= 15
    }
  }
  if (pc24 != null && pc24 > 20 && pc24 < 200) {
    score += 8
    reasons.push('Positive 24h')
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
  if ((t.mint || '').toLowerCase().endsWith('pump')) {
    score += 4
    reasons.push('pump.fun mint')
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
    url: pair.url,
    dex: pair.dexId,
    source: 'dexscreener',
  }
}

async function fetchPairs(query) {
  const url = 'https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(query)
  const res = await fetch(url)
  if (!res.ok) throw new Error('DexScreener HTTP ' + res.status)
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
    const res = await fetch('https://api.dexscreener.com/token-pairs/v1/solana/' + mint)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function jupiterQuote(outputMint, amountLamports, slippageBps) {
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: outputMint,
    amount: String(amountLamports),
    slippageBps: String(slippageBps),
  })
  const res = await fetch(JUPITER_QUOTE + '?' + params)
  if (!res.ok) throw new Error('Jupiter quote failed (' + res.status + ')')
  return res.json()
}

async function jupiterSwapTransaction(quoteResponse, userPublicKey) {
  const res = await fetch(JUPITER_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quoteResponse,
      userPublicKey: userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  })
  if (!res.ok) throw new Error('Jupiter swap build failed (' + res.status + ')')
  return res.json()
}

const css = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0e11',
    color: '#eaecef',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#12161c',
    borderRight: '1px solid #1e2329',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxSizing: 'border-box',
  },
  brand: { fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 },
  brandSub: { fontSize: 11, color: '#848e9c', marginBottom: 16 },
  sideBtn: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid transparent',
    color: '#848e9c',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    marginBottom: 4,
  },
  sideActive: {
    background: 'rgba(240,185,11,0.1)',
    border: '1px solid rgba(240,185,11,0.35)',
    color: '#eaecef',
    fontWeight: 650,
  },
  sideFoot: { marginTop: 'auto', paddingTop: 12 },
  main: { flex: 1, minWidth: 0, padding: '14px 14px 40px', maxWidth: 1100 },
  topbar: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6,
    fontWeight: 650,
    background: 'rgba(240,185,11,0.15)',
    color: '#f0b90b',
  },
  badgeOk: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
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
    width: '100%',
  },
  btnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
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
    boxSizing: 'border-box',
  },
  footer: { textAlign: 'center', color: '#848e9c', fontSize: 11, padding: 16 },
  mobileToggle: {
    display: 'none',
    background: '#2b2f36',
    color: '#eaecef',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    marginBottom: 10,
    cursor: 'pointer',
  },
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settings, setSettings] = useState({
    minLiquidity: 3000,
    minVolume: 500,
    maxLiquidity: 2000000,
  })

  const connectWallet = async () => {
    try {
      const provider = typeof window !== 'undefined' ? window.solana : null
      if (!provider || !provider.isPhantom) {
        setMsg('Phantom not found. Install Phantom or open in a supported browser.')
        return
      }
      const res = await provider.connect()
      const pubkey =
        (res.publicKey && res.publicKey.toString && res.publicKey.toString()) ||
        (provider.publicKey && provider.publicKey.toString && provider.publicKey.toString())
      setWallet(pubkey)
      setMsg('Wallet connected: ' + shortAddr(pubkey))
    } catch (e) {
      setMsg(String(e.message || e))
    }
  }

  const disconnectWallet = async () => {
    try {
      if (window.solana && window.solana.disconnect) await window.solana.disconnect()
    } catch (_) {}
    setWallet(null)
    setTradingEnabled(false)
    setMsg('Wallet disconnected')
  }

  const executeBuy = async (token) => {
    if (!wallet) {
      setMsg('Connect Phantom first')
      return
    }
    if (!tradingEnabled) {
      setMsg('Enable trading arm in Trading menu first')
      return
    }
    if (token.safety_blocked) {
      setMsg('BUY blocked by safety checks')
      return
    }
    if ((token.opportunity_score || 0) < minOppToBuy) {
      setMsg('Score ' + token.opportunity_score + ' < min ' + minOppToBuy)
      return
    }
    const lamports = Math.floor(Number(buyAmountSol) * 1e9)
    if (!lamports || lamports < 1000) {
      setMsg('Buy amount too small')
      return
    }

    setBusyMint(token.mint)
    setMsg('Quoting ' + (token.symbol || '') + '…')
    try {
      const quote = await jupiterQuote(token.mint, lamports, slippageBps)
      setMsg('Building swap ' + (token.symbol || '') + '…')
      const swap = await jupiterSwapTransaction(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swapTransaction')

      const binary = atob(swap.swapTransaction)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      const provider = window.solana
      if (!provider) throw new Error('Wallet missing')

      if (window.solanaWeb3 && window.solanaWeb3.VersionedTransaction) {
        const tx = window.solanaWeb3.VersionedTransaction.deserialize(bytes)
        const signed = await provider.signAndSendTransaction(tx)
        const sig = signed.signature || signed
        setMsg('Submitted: ' + String(sig).slice(0, 24) + '…')
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
      for (let i = 0; i < queries.length; i++) {
        try {
          const pairs = await fetchPairs(queries[i])
          for (let j = 0; j < pairs.length; j++) all.push(pairs[j])
        } catch (_) {}
      }

      const boosts = await fetchTokenBoosts()
      const solBoosts = boosts.filter(function (b) {
        return (b.chainId || '').toLowerCase() === 'solana'
      })
      for (let i = 0; i < Math.min(15, solBoosts.length); i++) {
        const b = solBoosts[i]
        if (b.tokenAddress) {
          try {
            const pairs = await fetchPairsByToken(b.tokenAddress)
            for (let j = 0; j < pairs.length; j++) all.push(pairs[j])
          } catch (_) {}
        }
      }

      const seen = {}
      const scored = []
      for (let i = 0; i < all.length; i++) {
        const pair = all[i]
        if (!pair || typeof pair !== 'object') continue
        const chain = (pair.chainId || '').toLowerCase()
        if (chain && chain !== 'solana') continue
        const n = normalizePair(pair)
        if (!n.mint || seen[n.mint]) continue
        if (!isMemeCandidate(n)) continue
        if (onlyPump && !(n.mint || '').toLowerCase().endsWith('pump')) continue
        const liq = n.liquidity_usd || 0
        const vol = n.volume_24h || 0
        if (liq < settings.minLiquidity && vol < settings.minVolume) continue
        if (liq > settings.maxLiquidity) continue
        seen[n.mint] = true
        scored.push(scoreToken(n))
      }

      scored.sort(function (a, b) {
        return (b.opportunity_score || 0) - (a.opportunity_score || 0)
      })
      setTokens(scored.slice(0, 50))
      setLastScan(new Date().toISOString())
      setMsg(
        'Found ' +
          scored.length +
          ' meme candidates (showing top ' +
          Math.min(50, scored.length) +
          ')'
      )
    } catch (e) {
      setMsg(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }, [settings, onlyPump])

  useEffect(
    function () {
      scan()
    },
    [scan]
  )

  useEffect(
    function () {
      if (!autoRefresh) return undefined
      const id = setInterval(function () {
        scan()
      }, 45000)
      return function () {
        clearInterval(id)
      }
    },
    [autoRefresh, scan]
  )

  useEffect(function () {
    const p = typeof window !== 'undefined' ? window.solana : null
    if (p && p.isPhantom && p.publicKey) setWallet(p.publicKey.toString())
  }, [])

  const top = useMemo(
    function () {
      return tokens.slice(0, 15)
    },
    [tokens]
  )

  const hot = useMemo(
    function () {
      return tokens.filter(function (t) {
        return (t.opportunity_score || 0) >= 68
      }).slice(0, 10)
    },
    [tokens]
  )

  const avgOpp = useMemo(
    function () {
      if (!tokens.length) return 0
      let s = 0
      for (let i = 0; i < tokens.length; i++) s += tokens[i].opportunity_score || 0
      return s / tokens.length
    },
    [tokens]
  )

  const menu = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'trading', label: 'Trading' },
    { id: 'settings', label: 'Settings' },
    { id: 'about', label: 'About' },
  ]

  function renderRows(list) {
    return list.map(function (t) {
      const canBuy =
        wallet && tradingEnabled && !t.safety_blocked && busyMint !== t.mint
      return (
        <tr key={t.mint}>
          <td style={css.td} title={t.mint}>
            {t.url ? (
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#eaecef', fontWeight: 600 }}
              >
                {t.symbol || '—'}
              </a>
            ) : (
              <strong>{t.symbol || '—'}</strong>
            )}
          </td>
          <td style={css.td}>{num(t.opportunity_score, 1)}</td>
          <td style={css.td}>
            <CategoryTag category={t.category} />
          </td>
          <td style={css.td}>{num(t.safety_score, 0)}</td>
          <td style={{ ...css.td, color: pctColor(t.price_change_1h) }}>
            {formatPct(t.price_change_1h)}
          </td>
          <td style={css.td}>{money(t.liquidity_usd)}</td>
          <td style={css.td}>{money(t.volume_24h)}</td>
          <td style={css.td}>
            {t.price_usd == null
              ? '—'
              : t.price_usd < 0.01
                ? t.price_usd.toExponential(2)
                : Number(t.price_usd).toPrecision(4)}
          </td>
          <td style={css.td}>
            <button
              type="button"
              style={{
                ...css.btnSm,
                ...(canBuy ? {} : css.btnDisabled),
              }}
              disabled={!canBuy}
              onClick={function () {
                executeBuy(t)
              }}
            >
              {busyMint === t.mint ? '…' : 'Buy'}
            </button>
          </td>
        </tr>
      )
    })
  }

  const tableHead = (
    <tr>
      {['Symbol', 'Score', 'Cat', 'Safety', '1h %', 'Liq', 'Vol', 'Price', 'Buy'].map(
        function (h) {
          return (
            <th key={h} style={css.th}>
              {h}
            </th>
          )
        }
      )}
    </tr>
  )

  return (
    <div style={css.shell}>
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          ...css.sidebar,
          display: sidebarOpen ? 'flex' : 'none',
        }}
      >
        <div style={css.brand}>Solana AI Meme Coin Hunter</div>
        <div style={css.brandSub}>v3 · Research scanner</div>

        {menu.map(function (m) {
          const active = tab === m.id
          return (
            <button
              key={m.id}
              type="button"
              style={{ ...css.sideBtn, ...(active ? css.sideActive : {}) }}
              onClick={function () {
                setTab(m.id)
              }}
            >
              {m.label}
            </button>
          )
        })}

        <div style={css.sideFoot}>
          {!wallet ? (
            <button type="button" style={css.btn} onClick={connectWallet}>
              Connect Phantom
            </button>
          ) : (
            <button type="button" style={css.btnSecondary} onClick={disconnectWallet}>
              {shortAddr(wallet)}
            </button>
          )}
          <div style={{ fontSize: 11, color: '#848e9c', marginTop: 10, lineHeight: 1.4 }}>
            Status:{' '}
            {tradingEnabled && wallet ? (
              <span style={{ color: '#0ecb81' }}>ARMED</span>
            ) : (
              <span style={{ color: '#f0b90b' }}>DISABLED</span>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={css.main}>
        <div style={css.topbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{
                ...css.btnSecondary,
                width: 'auto',
                padding: '6px 10px',
              }}
              onClick={function () {
                setSidebarOpen(!sidebarOpen)
              }}
            >
              {sidebarOpen ? 'Hide menu' : 'Menu'}
            </button>
            <span
              style={{
                ...css.badge,
                ...(tradingEnabled && wallet ? css.badgeOk : {}),
              }}
            >
              {tradingEnabled && wallet ? 'TRADING ARMED' : 'TRADING DISABLED'}
            </span>
          </div>
          <button
            type="button"
            style={{ ...css.btn, ...(loading ? css.btnDisabled : {}) }}
            disabled={loading}
            onClick={scan}
          >
            {loading ? 'Scanning…' : 'Scan Now'}
          </button>
        </div>

        <div style={css.msg}>{msg}</div>

        {tab === 'dashboard' && (
          <>
            <div style={css.grid}>
              <div style={css.stat}>
                <div style={css.label}>Meme Candidates</div>
                <div style={css.value}>{tokens.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Hot (≥68)</div>
                <div style={{ ...css.value, color: '#0ecb81' }}>{hot.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Avg Score</div>
                <div style={css.value}>{num(avgOpp, 1)}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Buy Size</div>
                <div style={css.value}>{buyAmountSol} SOL</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Wallet</div>
                <div style={{ ...css.value, fontSize: '0.85rem' }}>
                  {wallet ? shortAddr(wallet) : 'Not connected'}
                </div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Last Scan</div>
                <div style={{ ...css.value, fontSize: '0.8rem' }}>
                  {lastScan ? new Date(lastScan).toLocaleTimeString() : '—'}
                </div>
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelH}>
                <span>Top Meme Opportunities</span>
                <label
                  style={{
                    fontSize: 11,
                    color: '#848e9c',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={function (e) {
                      setAutoRefresh(e.target.checked)
                    }}
                  />
                  Auto 45s
                </label>
              </div>
              <div style={css.panelB}>
                <table style={css.table}>
                  <thead>{tableHead}</thead>
                  <tbody>
                    {top.length ? (
                      renderRows(top)
                    ) : (
                      <tr>
                        <td style={{ ...css.td, ...css.muted }} colSpan={9}>
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
          <div style={css.panel}>
            <div style={css.panelH}>
              <span>Full Scanner ({tokens.length})</span>
            </div>
            <div style={css.panelB}>
              <table style={css.table}>
                <thead>{tableHead}</thead>
                <tbody>{renderRows(tokens)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'trading' && (
          <div style={css.panel}>
            <div style={css.panelH}>Trading Controls</div>
            <div style={{ ...css.panelB, padding: 14 }}>
              <p style={{ ...css.muted, marginBottom: 12, fontSize: 12, lineHeight: 1.5 }}>
                No private keys on this page. Each buy is signed in Phantom. High risk — size
                small.
              </p>
              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Buy amount (SOL)</div>
                  <input
                    style={css.input}
                    type="number"
                    step="0.001"
                    min="0"
                    value={buyAmountSol}
                    onChange={function (e) {
                      setBuyAmountSol(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Slippage (bps)</div>
                  <input
                    style={css.input}
                    type="number"
                    value={slippageBps}
                    onChange={function (e) {
                      setSlippageBps(parseInt(e.target.value, 10) || 100)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Min score to allow Buy</div>
                  <input
                    style={css.input}
                    type="number"
                    value={minOppToBuy}
                    onChange={function (e) {
                      setMinOppToBuy(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Arm trading</div>
                  <label
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tradingEnabled}
                      onChange={function (e) {
                        setTradingEnabled(e.target.checked)
                      }}
                    />
                    <span style={{ fontSize: 12 }}>I accept trading risk</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={css.panel}>
            <div style={css.panelH}>Scanner filters</div>
            <div style={{ ...css.panelB, padding: 14 }}>
              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Min liquidity USD</div>
                  <input
                    style={css.input}
                    type="number"
                    value={settings.minLiquidity}
                    onChange={function (e) {
                      setSettings(function (s) {
                        return {
                          ...s,
                          minLiquidity: parseFloat(e.target.value) || 0,
                        }
                      })
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Min volume USD</div>
                  <input
                    style={css.input}
                    type="number"
                    value={settings.minVolume}
                    onChange={function (e) {
                      setSettings(function (s) {
                        return {
                          ...s,
                          minVolume: parseFloat(e.target.value) || 0,
                        }
                      })
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Max liquidity USD</div>
                  <input
                    style={css.input}
                    type="number"
                    value={settings.maxLiquidity}
                    onChange={function (e) {
                      setSettings(function (s) {
                        return {
                          ...s,
                          maxLiquidity: parseFloat(e.target.value) || 0,
                        }
                      })
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Only pump.fun mints</div>
                  <label
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={onlyPump}
                      onChange={function (e) {
                        setOnlyPump(e.target.checked)
                      }}
                    />
                    <span style={{ fontSize: 12 }}>Filter *pump mints</span>
                  </label>
                </div>
              </div>
              <button type="button" style={{ ...css.btn, marginTop: 14 }} onClick={scan}>
                Apply & Rescan
              </button>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div style={css.panel}>
            <div style={css.panelH}>About v3</div>
            <div style={{ ...css.panelB, padding: 14 }}>
              <ul style={{ ...css.muted, lineHeight: 1.8, paddingLeft: 18, fontSize: 13 }}>
                <li>Left sidebar: Dashboard, Opportunities, Trading, Settings</li>
                <li>Fixed 1h % column (no more raw code text)</li>
                <li>Filters out SOL/USDC major pairs</li>
                <li>Meme keyword + boosts + pump.fun detection</li>
                <li>Wallet buys via Jupiter + Phantom — no private keys</li>
                <li>No profit guarantee — trade small</li>
              </ul>
            </div>
          </div>
        )}

        <div style={css.footer}>
          Solana AI Meme Coin Hunter v3 · Not financial advice · Never paste private keys
        </div>
      </div>
    </div>
  )
}
