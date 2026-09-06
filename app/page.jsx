'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Solana Meme Hunter v6.2
 * - Mobile Phantom connect
 * - Manual Buy = wallet + Arm only
 * - Auto TP/SL sell prompt
 * - Compounding
 * - NO private keys
 */

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const BLOCKED_MINTS = new Set([
  SOL_MINT,
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
])
const BLOCKED_SYMBOLS = new Set(['SOL', 'WSOL', 'USDC', 'USDT', 'BTC', 'ETH'])
const JUPITER_QUOTE = 'https://quote-api.jup.ag/v6/quote'
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6/swap'
const STATE_KEY = 'meme_hunter_v62'

function money(n) {
  if (n == null || Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
  return '$' + Number(n).toFixed(2)
}
function num(n, d) {
  if (d == null) d = 1
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toFixed(d)
}
function shortAddr(a) {
  if (!a) return '—'
  return a.slice(0, 4) + '…' + a.slice(-4)
}
function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return (v > 0 ? '+' : '') + Number(v).toFixed(1) + '%'
}
function pctColor(v) {
  if (v == null) return '#848e9c'
  return v >= 0 ? '#0ecb81' : '#f6465d'
}
function loadJSON(key, fb) {
  try {
    const r = localStorage.getItem(key)
    return r ? JSON.parse(r) : fb
  } catch {
    return fb
  }
}
function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (_) {}
}

function getProvider() {
  if (typeof window === 'undefined') return null
  const w = window
  if (w.solana && w.solana.isPhantom) return w.solana
  if (w.phantom && w.phantom.solana && w.phantom.solana.isPhantom) return w.phantom.solana
  if (w.solana) return w.solana
  return null
}

function openInPhantom() {
  if (typeof window === 'undefined') return
  const url = window.location.href
  const deep =
    'https://phantom.app/ul/browse/' +
    encodeURIComponent(url) +
    '?ref=' +
    encodeURIComponent(url)
  window.location.href = deep
}

function CategoryTag({ category }) {
  const c = (category || 'AVOID').toUpperCase()
  let bg = 'rgba(132,142,156,0.2)'
  let color = '#848e9c'
  if (c.indexOf('ELITE') >= 0) {
    bg = 'rgba(240,185,11,0.2)'
    color = '#f0b90b'
  } else if (c.indexOf('HIGH') >= 0) {
    bg = 'rgba(14,203,129,0.15)'
    color = '#0ecb81'
  } else if (c.indexOf('MODERATE') >= 0) {
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
        color: color,
      }}
    >
      {c}
    </span>
  )
}

function safetyScore(t) {
  let score = 100
  let blocked = false
  const liq = t.liquidity_usd
  if (liq == null) score -= 20
  else if (liq < 5000) {
    score -= 35
    if (liq < 1500) blocked = true
  }
  if (t.price_change_5m != null && Math.abs(t.price_change_5m) > 90) score -= 20
  score = Math.max(0, Math.min(100, score))
  if (score < 35) blocked = true
  return { score: score, blocked: blocked }
}

function momentumScore(t) {
  let score = 45
  const pc5 = t.price_change_5m
  const pc1 = t.price_change_1h
  if (pc5 != null) {
    if (pc5 >= 3 && pc5 <= 35) score += 15
    else if (pc5 > 35 && pc5 <= 80) score += 8
    else if (pc5 < -20) score -= 18
  }
  if (pc1 != null) {
    if (pc1 >= 8 && pc1 <= 60) score += 18
    else if (pc1 > 60) score += 6
    else if (pc1 < -25) score -= 15
  }
  const vol = t.volume_24h || 0
  const liq = t.liquidity_usd || 0
  if (vol > 0 && liq > 0) {
    const ratio = vol / liq
    if (ratio >= 0.3 && ratio <= 12) score += 12
  }
  if (t.buy_sell_ratio != null && t.buy_sell_ratio >= 1.4) score += 14
  if ((t.mint || '').toLowerCase().endsWith('pump')) score += 4
  return Math.max(0, Math.min(100, score))
}

function scoreToken(t) {
  const safety = safetyScore(t)
  const mom = momentumScore(t)
  let opp = safety.score * 0.28 + mom * 0.42 + 22.5
  if (safety.blocked) opp = Math.min(opp, 52)
  opp = Math.max(0, Math.min(100, opp))
  let category = 'AVOID'
  if (opp >= 88) category = 'ELITE'
  else if (opp >= 78) category = 'HIGH POTENTIAL'
  else if (opp >= 68) category = 'MODERATE'
  return Object.assign({}, t, {
    safety_score: Math.round(safety.score * 10) / 10,
    safety_blocked: safety.blocked,
    momentum_score: Math.round(mom * 10) / 10,
    opportunity_score: Math.round(opp * 10) / 10,
    category: category,
  })
}

function isMemeCandidate(n) {
  if (!n.mint || BLOCKED_MINTS.has(n.mint)) return false
  if (BLOCKED_SYMBOLS.has((n.symbol || '').toUpperCase())) return false
  const name = (n.name || '').toLowerCase()
  if (name === 'solana' || name === 'wrapped sol') return false
  const liq = n.liquidity_usd || 0
  if (liq > 5e6) return false
  if (liq < 2000 && (n.volume_24h || 0) < 300) return false
  return true
}

function normalizePair(pair) {
  const base = pair.baseToken || {}
  const vol = pair.volume || {}
  const liq = pair.liquidity || {}
  const pc = pair.priceChange || {}
  const tx = (pair.txns && pair.txns.h24) || {}
  const buys = tx.buys || 0
  const sells = tx.sells || 0
  const f = function (v) {
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
    buy_sell_ratio: sells ? buys / sells : buys ? 2 : 1,
    url: pair.url,
  }
}

async function fetchPairs(q) {
  const res = await fetch(
    'https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(q)
  )
  if (!res.ok) throw new Error('DexScreener ' + res.status)
  const data = await res.json()
  return Array.isArray(data.pairs) ? data.pairs : []
}

async function jupiterQuote(inputMint, outputMint, amount, slippageBps) {
  const params = new URLSearchParams({
    inputMint: inputMint,
    outputMint: outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  })
  const res = await fetch(JUPITER_QUOTE + '?' + params)
  if (!res.ok) throw new Error('Jupiter quote failed')
  return res.json()
}

async function jupiterSwap(quoteResponse, userPublicKey) {
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
  if (!res.ok) throw new Error('Jupiter swap build failed')
  return res.json()
}

async function signAndSend(swapTxB64, provider) {
  if (window.solanaWeb3 && window.solanaWeb3.VersionedTransaction) {
    const binary = atob(swapTxB64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const tx = window.solanaWeb3.VersionedTransaction.deserialize(bytes)
    const signed = await provider.signAndSendTransaction(tx)
    return String(signed.signature || signed)
  }
  if (provider.request) {
    try {
      const ret = await provider.request({
        method: 'signAndSendTransaction',
        params: { message: swapTxB64 },
      })
      if (ret && (ret.signature || ret)) return String(ret.signature || ret)
    } catch (_) {}
  }
  throw new Error(
    'Untuk swap stabil: npm i @solana/web3.js lalu expose VersionedTransaction. Atau trade manual di Jupiter.'
  )
}

const css = {
  page: {
    minHeight: '100vh',
    background: '#0b0e11',
    color: '#eaecef',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 48,
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    background: '#12161c',
    borderBottom: '1px solid #1e2329',
    padding: '10px 12px',
  },
  title: { fontSize: 15, fontWeight: 700, margin: 0 },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btn: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnGhost: {
    background: '#2b2f36',
    color: '#eaecef',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnSm: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 11,
  },
  btnSell: {
    background: '#f6465d',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 11,
  },
  disabled: { opacity: 0.45, cursor: 'not-allowed' },
  badge: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 6,
    fontWeight: 650,
    background: 'rgba(240,185,11,0.15)',
    color: '#f0b90b',
  },
  badgeOk: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  main: { padding: 12, maxWidth: 900, margin: '0 auto' },
  msg: { color: '#f0b90b', fontSize: 12, margin: '8px 0', minHeight: 16 },
  alert: {
    background: 'rgba(240,185,11,0.08)',
    border: '1px solid rgba(240,185,11,0.35)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 1.5,
  },
  alertOk: {
    background: 'rgba(14,203,129,0.08)',
    border: '1px solid rgba(14,203,129,0.35)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  stat: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 10,
  },
  label: { fontSize: 10, color: '#848e9c', marginBottom: 3 },
  value: { fontSize: 15, fontWeight: 700 },
  panel: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  panelH: {
    padding: '10px 12px',
    borderBottom: '1px solid #1e2329',
    fontWeight: 650,
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  panelB: { padding: 10 },
  tabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  tab: {
    background: '#2b2f36',
    color: '#848e9c',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
  },
  tabOn: {
    background: 'rgba(240,185,11,0.15)',
    color: '#eaecef',
    fontWeight: 650,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: {
    textAlign: 'left',
    color: '#848e9c',
    padding: '6px 4px',
    borderBottom: '1px solid #1e2329',
  },
  td: {
    padding: '8px 4px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
  },
  card: {
    background: '#0b0e11',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
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
  muted: { color: '#848e9c', fontSize: 12, lineHeight: 1.5 },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 8,
  },
}

export default function Page() {
  const saved = typeof window !== 'undefined' ? loadJSON(STATE_KEY, {}) : {}

  const [tab, setTab] = useState('home')
  const [wallet, setWallet] = useState(null)
  const [providerOn, setProviderOn] = useState(false)
  const [msg, setMsg] = useState('')
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState(saved.positions || [])
  const [armed, setArmed] = useState(false)
  const [autoTpsl, setAutoTpsl] = useState(true)
  const [buySol, setBuySol] = useState(saved.buySol || 0.01)
  const [baseBuy, setBaseBuy] = useState(saved.baseBuy || 0.01)
  const [compoundOn, setCompoundOn] = useState(true)
  const [compoundPct, setCompoundPct] = useState(50)
  const [realized, setRealized] = useState(saved.realized || 0)
  const [tpPct, setTpPct] = useState(40)
  const [slPct, setSlPct] = useState(20)
  const [minOpp, setMinOpp] = useState(65)
  const [slippage, setSlippage] = useState(150)
  const [busy, setBusy] = useState(null)
  const [logs, setLogs] = useState([])

  const posRef = useRef(positions)
  const sellLock = useRef({})

  useEffect(
    function () {
      posRef.current = positions
    },
    [positions]
  )

  useEffect(
    function () {
      saveJSON(STATE_KEY, {
        positions: positions,
        buySol: buySol,
        baseBuy: baseBuy,
        realized: realized,
      })
    },
    [positions, buySol, baseBuy, realized]
  )

  function pushLog(t) {
    setLogs(function (p) {
      return [new Date().toLocaleTimeString() + ' · ' + t].concat(p).slice(0, 60)
    })
  }

  function refreshProvider() {
    const p = getProvider()
    setProviderOn(!!p)
    if (p && p.publicKey) {
      try {
        setWallet(p.publicKey.toString())
      } catch (_) {}
    }
    return p
  }

  useEffect(function () {
    refreshProvider()
    const t = setInterval(refreshProvider, 2000)
    return function () {
      clearInterval(t)
    }
  }, [])

  const connectWallet = async function () {
    setMsg('Connecting…')
    const p = getProvider()
    if (!p) {
      setMsg('Phantom tidak terdeteksi — tekan Open in Phantom App')
      pushLog('No provider')
      return
    }
    try {
      const res = await p.connect({ onlyIfTrusted: false })
      const pk =
        (res && res.publicKey && res.publicKey.toString()) ||
        (p.publicKey && p.publicKey.toString())
      if (!pk) throw new Error('No public key')
      setWallet(pk)
      setProviderOn(true)
      setMsg('Connected: ' + shortAddr(pk))
      pushLog('Connected ' + shortAddr(pk))
    } catch (e) {
      setMsg(String(e.message || e))
      pushLog('Connect fail ' + String(e.message || e))
    }
  }

  const disconnectWallet = async function () {
    try {
      const p = getProvider()
      if (p && p.disconnect) await p.disconnect()
    } catch (_) {}
    setWallet(null)
    setArmed(false)
    setMsg('Disconnected')
  }

  const executeSell = async function (pos, reason) {
    const p = getProvider()
    if (!wallet || !p) {
      setMsg('Connect wallet dulu')
      return
    }
    if (sellLock.current[pos.id]) return
    sellLock.current[pos.id] = true
    setBusy('sell')
    setMsg('SELL ' + pos.symbol + ' (' + reason + ') — approve di Phantom')
    pushLog('SELL ' + pos.symbol + ' ' + reason)
    try {
      if (!pos.token_amount_raw) {
        throw new Error('Amount token tidak ada — sell manual di Jupiter')
      }
      const quote = await jupiterQuote(pos.mint, SOL_MINT, pos.token_amount_raw, slippage)
      const swap = await jupiterSwap(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swapTransaction')
      const sig = await signAndSend(swap.swapTransaction, p)
      const exitPx = pos.current_price != null ? pos.current_price : pos.entry_price
      const pnlPct =
        pos.entry_price > 0 ? ((exitPx - pos.entry_price) / pos.entry_price) * 100 : 0
      const pnlSol = (pnlPct / 100) * (pos.amount_sol || 0)
      setPositions(function (prev) {
        return prev.map(function (x) {
          if (x.id !== pos.id) return x
          return Object.assign({}, x, {
            status: 'closed',
            pnl_pct: pnlPct,
            pnl_sol: pnlSol,
            close_reason: reason,
            tx_sell: sig,
          })
        })
      })
      setRealized(function (r) {
        return r + pnlSol
      })
      if (compoundOn && pnlSol > 0) {
        const add = pnlSol * (compoundPct / 100)
        setBuySol(function (c) {
          return Math.round((c + add) * 1e6) / 1e6
        })
        pushLog('Compound +' + num(add, 4) + ' SOL')
      }
      setMsg('SELL OK ' + formatPct(pnlPct))
      pushLog('SELL OK')
    } catch (e) {
      setMsg(String(e.message || e))
      pushLog('SELL fail ' + String(e.message || e))
    } finally {
      setBusy(null)
      delete sellLock.current[pos.id]
    }
  }

  const executeBuy = async function (token) {
    const p = getProvider()
    if (!wallet || !p) {
      setMsg('Connect wallet dulu')
      return
    }
    if (!armed) {
      setMsg('Centang Arm trading di tab trade dulu')
      return
    }
    if (token.safety_blocked) {
      pushLog('Warning safety low: ' + token.symbol)
    }

    const lamports = Math.floor(Number(buySol) * 1e9)
    if (lamports < 1000) {
      setMsg('Buy size terlalu kecil')
      return
    }

    setBusy('buy')
    setMsg('BUY ' + token.symbol + ' — approve di Phantom')
    pushLog('BUY ' + token.symbol + ' ' + buySol + ' SOL')
    try {
      const quote = await jupiterQuote(SOL_MINT, token.mint, lamports, slippage)
      const outAmt = quote.outAmount ? String(quote.outAmount) : null
      const swap = await jupiterSwap(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swapTransaction')
      const sig = await signAndSend(swap.swapTransaction, p)
      const entry = token.price_usd || 0
      setPositions(function (prev) {
        return [
          {
            id: String(sig).slice(0, 18),
            mint: token.mint,
            symbol: token.symbol,
            entry_price: entry,
            amount_sol: buySol,
            token_amount_raw: outAmt,
            status: 'open',
            take_profit: entry * (1 + tpPct / 100),
            stop_loss: entry * (1 - slPct / 100),
            tx_buy: sig,
            opened_at: new Date().toISOString(),
          },
        ].concat(prev)
      })
      setMsg('BUY OK ' + token.symbol)
      pushLog('BUY OK')
    } catch (e) {
      setMsg(String(e.message || e))
      pushLog('BUY fail ' + String(e.message || e))
    } finally {
      setBusy(null)
    }
  }

  const scan = useCallback(
    async function () {
      setLoading(true)
      try {
        const queries = ['pump', 'meme', 'bonk', 'pepe', 'ai']
        const all = []
        for (let i = 0; i < queries.length; i++) {
          try {
            const pairs = await fetchPairs(queries[i])
            for (let j = 0; j < pairs.length; j++) all.push(pairs[j])
          } catch (_) {}
        }
        const seen = {}
        const scored = []
        for (let i = 0; i < all.length; i++) {
          const pair = all[i]
          if (!pair) continue
          const chain = (pair.chainId || '').toLowerCase()
          if (chain && chain !== 'solana') continue
          const n = normalizePair(pair)
          if (!n.mint || seen[n.mint] || !isMemeCandidate(n)) continue
          const liq = n.liquidity_usd || 0
          if (liq < 3000 && (n.volume_24h || 0) < 500) continue
          if (liq > 2e6) continue
          seen[n.mint] = true
          scored.push(scoreToken(n))
        }
        scored.sort(function (a, b) {
          return (b.opportunity_score || 0) - (a.opportunity_score || 0)
        })
        setTokens(scored.slice(0, 40))
        setMsg('Scan: ' + scored.length + ' tokens')

        const prices = {}
        for (let i = 0; i < scored.length; i++) {
          if (scored[i].mint) prices[scored[i].mint] = scored[i].price_usd
        }
        const updated = posRef.current.map(function (p) {
          if (p.status !== 'open') return p
          const px = prices[p.mint]
          if (px == null) return p
          const pnl =
            p.entry_price > 0 ? ((px - p.entry_price) / p.entry_price) * 100 : 0
          return Object.assign({}, p, {
            current_price: px,
            unrealized_pnl_pct: pnl,
          })
        })
        setPositions(updated)

        if (autoTpsl && wallet) {
          for (let i = 0; i < updated.length; i++) {
            const p = updated[i]
            if (p.status !== 'open' || p.current_price == null) continue
            if (p.current_price >= p.take_profit) {
              await executeSell(p, 'TP')
              break
            }
            if (p.current_price <= p.stop_loss) {
              await executeSell(p, 'SL')
              break
            }
          }
        }
      } catch (e) {
        setMsg(String(e.message || e))
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoTpsl, wallet, slippage, compoundOn, compoundPct]
  )

  useEffect(
    function () {
      scan()
      const id = setInterval(scan, 40000)
      return function () {
        clearInterval(id)
      }
    },
    [scan]
  )

  const openPos = positions.filter(function (p) {
    return p.status === 'open'
  })

  // Manual Buy: ONLY wallet + armed
  const canTrade = !!(wallet && armed && busy !== 'buy')

  return (
    <div style={css.page}>
      <header style={css.header}>
        <h1 style={css.title}>Solana Meme Hunter</h1>
        <div style={css.row}>
          <span style={{ ...css.badge, ...(wallet ? css.badgeOk : {}) }}>
            {wallet ? shortAddr(wallet) : 'Wallet OFF'}
          </span>
          <span style={{ ...css.badge, ...(armed ? css.badgeOk : {}) }}>
            {armed ? 'ARMED' : 'DISARMED'}
          </span>
          <span style={{ ...css.badge, ...(providerOn ? css.badgeOk : {}) }}>
            {providerOn ? 'Phantom OK' : 'Phantom?'}
          </span>
        </div>
        <div style={css.row}>
          {!wallet ? (
            <>
              <button type="button" style={css.btn} onClick={connectWallet}>
                Connect Phantom
              </button>
              <button type="button" style={css.btnGhost} onClick={openInPhantom}>
                Open in Phantom App
              </button>
            </>
          ) : (
            <button type="button" style={css.btnGhost} onClick={disconnectWallet}>
              Disconnect
            </button>
          )}
          <button
            type="button"
            style={{ ...css.btnGhost, ...(loading ? css.disabled : {}) }}
            disabled={loading}
            onClick={scan}
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </div>
      </header>

      <main style={css.main}>
        <div style={css.msg}>{msg}</div>

        {!wallet && (
          <div style={css.alert}>
            <strong>Connect di HP:</strong>
            <br />
            1. Install Phantom
            <br />
            2. Tekan <strong>Open in Phantom App</strong>
            <br />
            3. Tekan <strong>Connect Phantom</strong> → Approve
            <br />
            4. Tab <strong>trade</strong> → centang <strong>Arm trading</strong>
            <br />
            5. Tombol Buy jadi aktif
          </div>
        )}

        {wallet && !armed && (
          <div style={css.alert}>
            Wallet sudah connect. Buka tab <strong>trade</strong> → centang{' '}
            <strong>Arm trading</strong> supaya tombol Buy aktif.
          </div>
        )}

        {wallet && armed && (
          <div style={css.alertOk}>
            Siap trade. Tombol Buy aktif. Setiap order perlu approve di Phantom.
          </div>
        )}

        <div style={css.tabs}>
          {['home', 'trade', 'positions', 'settings'].map(function (id) {
            return (
              <button
                key={id}
                type="button"
                style={{ ...css.tab, ...(tab === id ? css.tabOn : {}) }}
                onClick={function () {
                  setTab(id)
                }}
              >
                {id}
              </button>
            )
          })}
        </div>

        {tab === 'home' && (
          <>
            <div style={css.grid}>
              <div style={css.stat}>
                <div style={css.label}>Tokens</div>
                <div style={css.value}>{tokens.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Open</div>
                <div style={css.value}>{openPos.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Buy size</div>
                <div style={css.value}>{num(buySol, 4)}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Realized</div>
                <div style={{ ...css.value, color: pctColor(realized) }}>
                  {num(realized, 4)}
                </div>
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelH}>
                <span>Top opportunities</span>
                <span style={css.muted}>
                  Buy: {canTrade ? 'ACTIVE' : 'locked'}
                </span>
              </div>
              <div style={css.panelB}>
                <table style={css.table}>
                  <thead>
                    <tr>
                      {['Symbol', 'Score', 'Cat', '1h', 'Liq', ''].map(function (h) {
                        return (
                          <th key={h} style={css.th}>
                            {h}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.slice(0, 20).map(function (t) {
                      return (
                        <tr key={t.mint}>
                          <td style={css.td}>
                            {t.url ? (
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#eaecef', fontWeight: 600 }}
                              >
                                {t.symbol}
                              </a>
                            ) : (
                              t.symbol
                            )}
                          </td>
                          <td style={css.td}>{num(t.opportunity_score, 1)}</td>
                          <td style={css.td}>
                            <CategoryTag category={t.category} />
                          </td>
                          <td style={{ ...css.td, color: pctColor(t.price_change_1h) }}>
                            {formatPct(t.price_change_1h)}
                          </td>
                          <td style={css.td}>{money(t.liquidity_usd)}</td>
                          <td style={css.td}>
                            <button
                              type="button"
                              style={{
                                ...css.btnSm,
                                ...(canTrade ? {} : css.disabled),
                              }}
                              disabled={!canTrade}
                              onClick={function () {
                                executeBuy(t)
                              }}
                            >
                              Buy
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {!tokens.length && (
                      <tr>
                        <td style={css.td} colSpan={6}>
                          No data — tekan Scan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'trade' && (
          <div style={css.panel}>
            <div style={css.panelH}>Trade controls</div>
            <div style={css.panelB}>
              {!wallet && (
                <div style={{ marginBottom: 12 }}>
                  <button type="button" style={css.btn} onClick={connectWallet}>
                    Connect Phantom
                  </button>
                  <button
                    type="button"
                    style={{ ...css.btnGhost, marginLeft: 8 }}
                    onClick={openInPhantom}
                  >
                    Open in Phantom App
                  </button>
                </div>
              )}

              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Buy size (SOL)</div>
                  <input
                    style={css.input}
                    type="number"
                    step="0.001"
                    value={buySol}
                    onChange={function (e) {
                      setBuySol(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>TP %</div>
                  <input
                    style={css.input}
                    type="number"
                    value={tpPct}
                    onChange={function (e) {
                      setTpPct(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>SL %</div>
                  <input
                    style={css.input}
                    type="number"
                    value={slPct}
                    onChange={function (e) {
                      setSlPct(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Slippage bps</div>
                  <input
                    style={css.input}
                    type="number"
                    value={slippage}
                    onChange={function (e) {
                      setSlippage(parseInt(e.target.value, 10) || 100)
                    }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 14,
                  fontSize: 14,
                  fontWeight: 650,
                }}
              >
                <input
                  type="checkbox"
                  checked={armed}
                  onChange={function (e) {
                    setArmed(e.target.checked)
                    if (e.target.checked) setMsg('ARMED — Buy aktif di tab home')
                    else setMsg('DISARMED')
                  }}
                />
                Arm trading (WAJIB biar Buy aktif)
              </label>

              <label style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={autoTpsl}
                  onChange={function (e) {
                    setAutoTpsl(e.target.checked)
                  }}
                />
                Auto TP/SL (minta approve sell)
              </label>

              <p style={{ ...css.muted, marginTop: 12 }}>
                Status Buy: <strong>{canTrade ? 'AKTIF' : 'NONAKTIF'}</strong>
                <br />
                Syarat: Connect wallet + centang Arm trading.
              </p>
            </div>
          </div>
        )}

        {tab === 'positions' && (
          <div style={css.panel}>
            <div style={css.panelH}>Positions</div>
            <div style={css.panelB}>
              {openPos.length === 0 && (
                <div style={css.muted}>Belum ada posisi open</div>
              )}
              {openPos.map(function (p) {
                return (
                  <div key={p.id} style={css.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{p.symbol}</strong>
                      <span style={{ color: pctColor(p.unrealized_pnl_pct) }}>
                        {formatPct(p.unrealized_pnl_pct)}
                      </span>
                    </div>
                    <div style={{ ...css.muted, marginTop: 4 }}>
                      Entry{' '}
                      {p.entry_price ? Number(p.entry_price).toPrecision(4) : '—'} ·{' '}
                      {p.amount_sol} SOL
                    </div>
                    <button
                      type="button"
                      style={{ ...css.btnSell, marginTop: 8 }}
                      disabled={busy === 'sell'}
                      onClick={function () {
                        executeSell(p, 'MANUAL')
                      }}
                    >
                      Sell
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={css.panel}>
            <div style={css.panelH}>Compound & log</div>
            <div style={css.panelB}>
              <label style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={compoundOn}
                  onChange={function (e) {
                    setCompoundOn(e.target.checked)
                  }}
                />
                Compound profit ke buy size
              </label>
              <div style={{ marginTop: 8 }}>
                <div style={css.label}>Compound % of profit</div>
                <input
                  style={css.input}
                  type="number"
                  value={compoundPct}
                  onChange={function (e) {
                    setCompoundPct(parseFloat(e.target.value) || 0)
                  }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={css.label}>Base buy reset value</div>
                <input
                  style={css.input}
                  type="number"
                  step="0.001"
                  value={baseBuy}
                  onChange={function (e) {
                    setBaseBuy(parseFloat(e.target.value) || 0)
                  }}
                />
              </div>
              <button
                type="button"
                style={{ ...css.btnGhost, marginTop: 10 }}
                onClick={function () {
                  setBuySol(baseBuy)
                  setMsg('Buy size reset')
                }}
              >
                Reset buy size
              </button>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: '#848e9c',
                }}
              >
                {logs.slice(0, 20).map(function (l, i) {
                  return <div key={i}>{l}</div>
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
