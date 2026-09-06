'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Solana AI Meme Coin Hunter v6
 * - Manual buy approve (Phantom)
 * - Auto TP/SL → auto prepare SELL → you only approve in Phantom
 * - Compounding profit on buy size
 * - Real quotes via Jupiter + real prices via DexScreener
 * - NO private keys in this file
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
const STATE_KEY = 'meme_hunter_v6'
const API_KEY = 'meme_hunter_v6_apis'

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

function CategoryTag({ category }) {
  const c = (category || 'AVOID').toUpperCase()
  let bg = 'rgba(132,142,156,0.2)',
    color = '#848e9c'
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
  } else if (liq >= 20000 && liq <= 500000) score += 5
  if (t.price_change_5m != null && Math.abs(t.price_change_5m) > 90) score -= 20
  if (t.buy_sell_ratio != null && t.buy_sell_ratio < 0.5) score -= 15
  score = Math.max(0, Math.min(100, score))
  if (score < 35) blocked = true
  return { score: score, blocked: blocked }
}

function momentumScore(t) {
  let score = 45
  const pc5 = t.price_change_5m
  const pc1 = t.price_change_1h
  const pc24 = t.price_change_24h
  if (pc5 != null) {
    if (pc5 >= 3 && pc5 <= 35) score += 15
    else if (pc5 > 35 && pc5 <= 80) score += 8
    else if (pc5 > 80) score -= 5
    else if (pc5 < -20) score -= 18
  }
  if (pc1 != null) {
    if (pc1 >= 8 && pc1 <= 60) score += 18
    else if (pc1 > 60) score += 6
    else if (pc1 < -25) score -= 15
  }
  if (pc24 != null && pc24 > 20 && pc24 < 200) score += 8
  const vol = t.volume_24h || 0
  const liq = t.liquidity_usd || 0
  if (vol > 0 && liq > 0) {
    const ratio = vol / liq
    if (ratio >= 0.3 && ratio <= 12) score += 12
    else if (ratio > 12) score += 4
  }
  if (t.buy_sell_ratio != null) {
    if (t.buy_sell_ratio >= 1.4) score += 14
    else if (t.buy_sell_ratio >= 1.1) score += 6
    else if (t.buy_sell_ratio < 0.75) score -= 14
  }
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

async function fetchBoosts() {
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

async function signAndSend(swapTxB64) {
  if (!(window.solanaWeb3 && window.solanaWeb3.VersionedTransaction)) {
    throw new Error(
      'Tambahkan @solana/web3.js di project Next agar sign swap stabil (lihat catatan di bawah).'
    )
  }
  const binary = atob(swapTxB64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const tx = window.solanaWeb3.VersionedTransaction.deserialize(bytes)
  const signed = await window.solana.signAndSendTransaction(tx)
  return String(signed.signature || signed)
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
    width: 210,
    flexShrink: 0,
    background: '#12161c',
    borderRight: '1px solid #1e2329',
    display: 'flex',
    flexDirection: 'column',
    padding: '14px 10px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxSizing: 'border-box',
  },
  brand: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  brandSub: { fontSize: 10, color: '#848e9c', marginBottom: 14 },
  sideBtn: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid transparent',
    color: '#848e9c',
    padding: '9px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    marginBottom: 3,
  },
  sideActive: {
    background: 'rgba(240,185,11,0.1)',
    border: '1px solid rgba(240,185,11,0.35)',
    color: '#eaecef',
    fontWeight: 650,
  },
  sideFoot: { marginTop: 'auto', paddingTop: 10 },
  main: { flex: 1, minWidth: 0, padding: '12px 12px 36px' },
  topbar: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    fontSize: 10,
    padding: '3px 7px',
    borderRadius: 6,
    fontWeight: 650,
    background: 'rgba(240,185,11,0.15)',
    color: '#f0b90b',
  },
  badgeOk: { background: 'rgba(14,203,129,0.15)', color: '#0ecb81' },
  badgeAuto: { background: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
  msg: { color: '#f0b90b', fontSize: 12, marginBottom: 8, minHeight: 16 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8,
    marginBottom: 10,
  },
  stat: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 10,
  },
  label: { fontSize: 10, color: '#848e9c', marginBottom: 3 },
  value: { fontSize: '1rem', fontWeight: 700 },
  panel: {
    background: '#12161c',
    border: '1px solid #1e2329',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  panelH: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    padding: '9px 11px',
    borderBottom: '1px solid #1e2329',
    fontWeight: 650,
    fontSize: 12,
  },
  panelB: { padding: 8, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: {
    textAlign: 'left',
    color: '#848e9c',
    fontWeight: 500,
    padding: '7px 5px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '8px 5px',
    borderBottom: '1px solid #1e2329',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  btn: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '7px 11px',
    borderRadius: 6,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12,
  },
  btnSm: {
    background: '#f0b90b',
    color: '#000',
    border: 'none',
    padding: '4px 7px',
    borderRadius: 5,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 10,
  },
  btnSell: {
    background: '#f6465d',
    color: '#fff',
    border: 'none',
    padding: '4px 7px',
    borderRadius: 5,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 10,
  },
  btnSecondary: {
    background: '#2b2f36',
    color: '#eaecef',
    border: 'none',
    padding: '7px 11px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 9,
  },
  input: {
    width: '100%',
    background: '#0b0e11',
    border: '1px solid #1e2329',
    color: '#eaecef',
    padding: '7px 9px',
    borderRadius: 6,
    fontSize: 12,
    boxSizing: 'border-box',
  },
  footer: { textAlign: 'center', color: '#848e9c', fontSize: 10, padding: 12 },
  logBox: {
    maxHeight: 160,
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#848e9c',
  },
  card: {
    background: '#0b0e11',
    border: '1px solid #1e2329',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
}

export default function Page() {
  const saved = typeof window !== 'undefined' ? loadJSON(STATE_KEY, {}) : {}
  const savedApi = typeof window !== 'undefined' ? loadJSON(API_KEY, {}) : {}

  const [tab, setTab] = useState('dashboard')
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [lastScan, setLastScan] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [busy, setBusy] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logs, setLogs] = useState([])
  const [positions, setPositions] = useState(saved.positions || [])
  const [closedTrades, setClosedTrades] = useState(saved.closedTrades || [])

  // sizing + compound
  const [baseBuySol, setBaseBuySol] = useState(saved.baseBuySol || 0.01)
  const [currentBuySol, setCurrentBuySol] = useState(saved.currentBuySol || 0.01)
  const [compoundPct, setCompoundPct] = useState(saved.compoundPct != null ? saved.compoundPct : 50)
  const [compoundOn, setCompoundOn] = useState(saved.compoundOn != null ? saved.compoundOn : true)
  const [realizedPnlSol, setRealizedPnlSol] = useState(saved.realizedPnlSol || 0)

  // risk
  const [tradingArmed, setTradingArmed] = useState(false)
  const [autoSell, setAutoSell] = useState(true)
  const [autoBuySignal, setAutoBuySignal] = useState(false)
  const [slippageBps, setSlippageBps] = useState(150)
  const [minOpp, setMinOpp] = useState(78)
  const [maxOpen, setMaxOpen] = useState(2)
  const [tpPct, setTpPct] = useState(40)
  const [slPct, setSlPct] = useState(20)
  const [scanSec, setScanSec] = useState(40)
  const [onlyPump, setOnlyPump] = useState(false)
  const [minLiq, setMinLiq] = useState(5000)
  const [minVol, setMinVol] = useState(1000)
  const [maxLiq, setMaxLiq] = useState(1500000)

  // token amount for sell: we store estimated token raw amount from buy quote when possible
  const sellLock = useRef({})
  const positionsRef = useRef(positions)
  const busyRef = useRef(false)

  useEffect(
    function () {
      positionsRef.current = positions
    },
    [positions]
  )

  useEffect(
    function () {
      saveJSON(STATE_KEY, {
        positions: positions,
        closedTrades: closedTrades,
        baseBuySol: baseBuySol,
        currentBuySol: currentBuySol,
        compoundPct: compoundPct,
        compoundOn: compoundOn,
        realizedPnlSol: realizedPnlSol,
      })
    },
    [positions, closedTrades, baseBuySol, currentBuySol, compoundPct, compoundOn, realizedPnlSol]
  )

  function pushLog(t) {
    const line = new Date().toLocaleTimeString() + ' · ' + t
    setLogs(function (p) {
      return [line].concat(p).slice(0, 100)
    })
  }

  const connectWallet = async function () {
    try {
      const p = window.solana
      if (!p || !p.isPhantom) {
        setMsg('Install / buka Phantom di HP')
        return
      }
      const res = await p.connect()
      const pk =
        (res.publicKey && res.publicKey.toString()) ||
        (p.publicKey && p.publicKey.toString())
      setWallet(pk)
      setMsg('Connected ' + shortAddr(pk))
      pushLog('Wallet connected')
    } catch (e) {
      setMsg(String(e.message || e))
    }
  }

  const disconnectWallet = async function () {
    try {
      if (window.solana && window.solana.disconnect) await window.solana.disconnect()
    } catch (_) {}
    setWallet(null)
    setTradingArmed(false)
    setAutoBuySignal(false)
  }

  /** Apply compounding after a closed profitable trade (pnlSol estimated) */
  function applyCompound(pnlSol) {
    setRealizedPnlSol(function (r) {
      return r + pnlSol
    })
    if (!compoundOn || pnlSol <= 0) return
    const add = pnlSol * (compoundPct / 100)
    setCurrentBuySol(function (c) {
      const next = Math.max(baseBuySol, c + add)
      pushLog(
        'Compound +' +
          num(add, 4) +
          ' SOL → next buy ' +
          num(next, 4) +
          ' SOL'
      )
      return Math.round(next * 1e6) / 1e6
    })
  }

  const executeBuy = async function (token, source) {
    if (!wallet || !tradingArmed) {
      setMsg('Connect + Arm trading dulu')
      return false
    }
    if (token.safety_blocked || (token.opportunity_score || 0) < minOpp) return false
    if (positionsRef.current.filter(function (p) {
      return p.status === 'open'
    }).length >= maxOpen) {
      pushLog('Max open positions')
      return false
    }
    if (
      positionsRef.current.some(function (p) {
        return p.mint === token.mint && p.status === 'open'
      })
    )
      return false

    const lamports = Math.floor(Number(currentBuySol) * 1e9)
    if (lamports < 1000) return false

    setBusy('buy:' + token.mint)
    setMsg('BUY quote ' + token.symbol + ' — approve di Phantom')
    pushLog((source || 'BUY') + ' ' + token.symbol + ' ' + currentBuySol + ' SOL')
    try {
      const quote = await jupiterQuote(SOL_MINT, token.mint, lamports, slippageBps)
      const outAmt = quote.outAmount ? String(quote.outAmount) : null
      const swap = await jupiterSwap(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swap tx')
      const sig = await signAndSend(swap.swapTransaction)
      const entry = token.price_usd || 0
      const pos = {
        id: sig.slice(0, 18),
        mint: token.mint,
        symbol: token.symbol,
        entry_price: entry,
        amount_sol: currentBuySol,
        token_amount_raw: outAmt,
        status: 'open',
        opened_at: new Date().toISOString(),
        take_profit: entry * (1 + tpPct / 100),
        stop_loss: entry * (1 - slPct / 100),
        tx_buy: sig,
        url: token.url,
      }
      setPositions(function (prev) {
        return [pos].concat(prev)
      })
      setMsg('BUY OK ' + token.symbol)
      pushLog('BUY OK ' + sig.slice(0, 16))
      return true
    } catch (e) {
      setMsg(String(e.message || e))
      pushLog('BUY fail ' + String(e.message || e))
      return false
    } finally {
      setBusy(null)
    }
  }

  const executeSell = async function (pos, reason) {
    if (!wallet) {
      setMsg('Connect Phantom')
      return false
    }
    if (sellLock.current[pos.id]) return false
    sellLock.current[pos.id] = true
    setBusy('sell:' + pos.id)
    setMsg('SELL ' + pos.symbol + ' (' + reason + ') — approve di Phantom')
    pushLog('SELL ' + pos.symbol + ' ' + reason)
    try {
      // Need token amount: use stored raw from buy, or fetch balance via RPC is complex;
      // Prefer stored outAmount from buy quote.
      let amount = pos.token_amount_raw
      if (!amount) {
        throw new Error(
          'Token amount unknown — buka DexScreener/Jupiter manual untuk sell, atau buy ulang agar amount tersimpan'
        )
      }
      // Sell 100% of recorded amount (raw integer string)
      const quote = await jupiterQuote(pos.mint, SOL_MINT, amount, slippageBps)
      const swap = await jupiterSwap(quote, wallet)
      if (!swap.swapTransaction) throw new Error('No swap tx')
      const sig = await signAndSend(swap.swapTransaction)

      const exitPx = pos.current_price != null ? pos.current_price : pos.entry_price
      const pnlPct =
        pos.entry_price > 0 ? ((exitPx - pos.entry_price) / pos.entry_price) * 100 : 0
      // Estimate pnl in SOL from % * amount_sol (approximation)
      const pnlSol = (pnlPct / 100) * (pos.amount_sol || 0)

      setPositions(function (prev) {
        return prev.map(function (p) {
          if (p.id !== pos.id) return p
          return Object.assign({}, p, {
            status: 'closed',
            closed_at: new Date().toISOString(),
            exit_price: exitPx,
            pnl_pct: pnlPct,
            pnl_sol: pnlSol,
            tx_sell: sig,
            close_reason: reason,
          })
        })
      })
      setClosedTrades(function (prev) {
        return [
          {
            symbol: pos.symbol,
            pnl_pct: pnlPct,
            pnl_sol: pnlSol,
            reason: reason,
            at: new Date().toISOString(),
          },
        ].concat(prev).slice(0, 50)
      })
      applyCompound(pnlSol)
      setMsg('SELL OK ' + pos.symbol + ' ' + formatPct(pnlPct))
      pushLog('SELL OK ' + pos.symbol + ' ' + formatPct(pnlPct))
      return true
    } catch (e) {
      setMsg(String(e.message || e))
      pushLog('SELL fail ' + String(e.message || e))
      return false
    } finally {
      setBusy(null)
      delete sellLock.current[pos.id]
    }
  }

  const scan = useCallback(
    async function () {
      setLoading(true)
      try {
        const queries = ['pump', 'meme', 'bonk', 'pepe', 'ai', 'dog']
        const all = []
        for (let i = 0; i < queries.length; i++) {
          try {
            const pairs = await fetchPairs(queries[i])
            for (let j = 0; j < pairs.length; j++) all.push(pairs[j])
          } catch (_) {}
        }
        const boosts = await fetchBoosts()
        for (let i = 0; i < Math.min(10, boosts.length); i++) {
          const b = boosts[i]
          if ((b.chainId || '').toLowerCase() !== 'solana' || !b.tokenAddress) continue
          try {
            const pairs = await fetchPairsByToken(b.tokenAddress)
            for (let j = 0; j < pairs.length; j++) all.push(pairs[j])
          } catch (_) {}
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
          if (liq < minLiq && vol < minVol) continue
          if (liq > maxLiq) continue
          seen[n.mint] = true
          scored.push(scoreToken(n))
        }
        scored.sort(function (a, b) {
          return (b.opportunity_score || 0) - (a.opportunity_score || 0)
        })
        setTokens(scored.slice(0, 50))
        setLastScan(new Date().toISOString())
        setMsg('Scan OK · ' + scored.length + ' candidates')

        // Update position marks + TP/SL auto sell prompts
        const priceMap = {}
        for (let i = 0; i < scored.length; i++) {
          if (scored[i].mint) priceMap[scored[i].mint] = scored[i].price_usd
        }

        const open = positionsRef.current.filter(function (p) {
          return p.status === 'open'
        })
        const updated = positionsRef.current.map(function (p) {
          if (p.status !== 'open') return p
          const px = priceMap[p.mint]
          if (px == null) return p
          const pnlPct =
            p.entry_price > 0 ? ((px - p.entry_price) / p.entry_price) * 100 : 0
          return Object.assign({}, p, {
            current_price: px,
            unrealized_pnl_pct: pnlPct,
          })
        })
        setPositions(updated)

        if (autoSell && wallet) {
          for (let i = 0; i < updated.length; i++) {
            const p = updated[i]
            if (p.status !== 'open' || p.current_price == null) continue
            if (p.current_price >= p.take_profit) {
              pushLog('TP hit ' + p.symbol)
              await executeSell(p, 'TP')
              break
            }
            if (p.current_price <= p.stop_loss) {
              pushLog('SL hit ' + p.symbol)
              await executeSell(p, 'SL')
              break
            }
          }
        }

        return scored
      } catch (e) {
        setMsg(String(e.message || e))
        return []
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlyPump, minLiq, minVol, maxLiq, autoSell, wallet, slippageBps]
  )

  // periodic scan
  useEffect(
    function () {
      scan()
      const id = setInterval(function () {
        scan()
      }, Math.max(20, scanSec) * 1000)
      return function () {
        clearInterval(id)
      }
    },
    [scan, scanSec]
  )

  // optional auto buy signal → still needs Phantom approve
  useEffect(
    function () {
      if (!autoBuySignal || !tradingArmed || !wallet) return undefined
      const id = setInterval(async function () {
        if (busyRef.current) return
        const openN = positionsRef.current.filter(function (p) {
          return p.status === 'open'
        }).length
        if (openN >= maxOpen) return
        const cand = tokens.find(function (t) {
          return !t.safety_blocked && (t.opportunity_score || 0) >= minOpp
        })
        if (!cand) return
        busyRef.current = true
        try {
          await executeBuy(cand, 'AUTO-SIGNAL')
        } finally {
          busyRef.current = false
        }
      }, Math.max(25, scanSec) * 1000)
      return function () {
        clearInterval(id)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoBuySignal, tradingArmed, wallet, tokens, minOpp, maxOpen, scanSec]
  )

  useEffect(function () {
    const p = window.solana
    if (p && p.isPhantom && p.publicKey) setWallet(p.publicKey.toString())
  }, [])

  const openPos = positions.filter(function (p) {
    return p.status === 'open'
  })
  const top = tokens.slice(0, 12)
  const hot = tokens.filter(function (t) {
    return (t.opportunity_score || 0) >= 68
  }).length
  const unrealized = openPos.reduce(function (s, p) {
    if (p.unrealized_pnl_pct == null || !p.amount_sol) return s
    return s + (p.unrealized_pnl_pct / 100) * p.amount_sol
  }, 0)

  const menu = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'positions', label: 'Positions' },
    { id: 'compound', label: 'Compound' },
    { id: 'autopilot', label: 'Auto-Pilot' },
    { id: 'settings', label: 'Settings' },
  ]

  function renderRows(list) {
    return list.map(function (t) {
      const can =
        wallet && tradingArmed && !t.safety_blocked && busy !== 'buy:' + t.mint
      return (
        <tr key={t.mint}>
          <td style={css.td}>
            {t.url ? (
              <a href={t.url} target="_blank" rel="noreferrer" style={{ color: '#eaecef', fontWeight: 600 }}>
                {t.symbol || '—'}
              </a>
            ) : (
              t.symbol || '—'
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
          <td style={css.td}>{money(t.volume_24h)}</td>
          <td style={css.td}>
            <button
              type="button"
              style={{ ...css.btnSm, ...(can ? {} : css.btnDisabled) }}
              disabled={!can}
              onClick={function () {
                executeBuy(t, 'MANUAL')
              }}
            >
              Buy
            </button>
          </td>
        </tr>
      )
    })
  }

  return (
    <div style={css.shell}>
      <aside style={{ ...css.sidebar, display: sidebarOpen ? 'flex' : 'none' }}>
        <div style={css.brand}>Meme Hunter</div>
        <div style={css.brandSub}>v6 · TP/SL · Compound</div>
        {menu.map(function (m) {
          return (
            <button
              key={m.id}
              type="button"
              style={{ ...css.sideBtn, ...(tab === m.id ? css.sideActive : {}) }}
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
        </div>
      </aside>

      <div style={css.main}>
        <div style={css.topbar}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              style={{ ...css.btnSecondary, width: 'auto' }}
              onClick={function () {
                setSidebarOpen(!sidebarOpen)
              }}
            >
              Menu
            </button>
            <span style={{ ...css.badge, ...(tradingArmed && wallet ? css.badgeOk : {}) }}>
              {tradingArmed && wallet ? 'ARMED' : 'DISARMED'}
            </span>
            {autoSell && <span style={{ ...css.badge, ...css.badgeAuto }}>AUTO TP/SL</span>}
            {compoundOn && <span style={css.badge}>COMPOUND</span>}
          </div>
          <button
            type="button"
            style={{ ...css.btn, ...(loading ? css.btnDisabled : {}) }}
            disabled={loading}
            onClick={scan}
          >
            {loading ? '…' : 'Scan'}
          </button>
        </div>

        <div style={css.msg}>{msg}</div>

        {tab === 'dashboard' && (
          <>
            <div style={css.grid}>
              <div style={css.stat}>
                <div style={css.label}>Candidates</div>
                <div style={css.value}>{tokens.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Hot</div>
                <div style={{ ...css.value, color: '#0ecb81' }}>{hot}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Open</div>
                <div style={css.value}>{openPos.length}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Buy size</div>
                <div style={css.value}>{num(currentBuySol, 4)}</div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Realized PnL</div>
                <div style={{ ...css.value, color: pctColor(realizedPnlSol) }}>
                  {num(realizedPnlSol, 4)} SOL
                </div>
              </div>
              <div style={css.stat}>
                <div style={css.label}>Unrealized</div>
                <div style={{ ...css.value, color: pctColor(unrealized) }}>
                  {num(unrealized, 4)} SOL
                </div>
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelH}>Top opportunities</div>
              <div style={css.panelB}>
                <table style={css.table}>
                  <thead>
                    <tr>
                      {['Symbol', 'Score', 'Cat', '1h', 'Liq', 'Vol', ''].map(function (h) {
                        return (
                          <th key={h} style={css.th}>
                            {h}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>{renderRows(top)}</tbody>
                </table>
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelH}>Open positions · auto TP/SL</div>
              <div style={css.panelB}>
                {openPos.length === 0 && (
                  <div style={css.muted}>No open positions</div>
                )}
                {openPos.map(function (p) {
                  return (
                    <div key={p.id} style={css.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{p.symbol}</strong>
                        <span style={{ color: pctColor(p.unrealized_pnl_pct) }}>
                          {formatPct(p.unrealized_pnl_pct)}
                        </span>
                      </div>
                      <div style={{ ...css.muted, fontSize: 10, marginTop: 4 }}>
                        Entry {p.entry_price ? Number(p.entry_price).toPrecision(4) : '—'} · TP{' '}
                        {p.take_profit ? Number(p.take_profit).toPrecision(4) : '—'} · SL{' '}
                        {p.stop_loss ? Number(p.stop_loss).toPrecision(4) : '—'}
                      </div>
                      <button
                        type="button"
                        style={{ ...css.btnSell, marginTop: 6 }}
                        disabled={busy === 'sell:' + p.id}
                        onClick={function () {
                          executeSell(p, 'MANUAL')
                        }}
                      >
                        Sell now
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelH}>Log</div>
              <div style={{ ...css.panelB, ...css.logBox }}>
                {logs.length
                  ? logs.map(function (l, i) {
                      return <div key={i}>{l}</div>
                    })
                  : '—'}
              </div>
            </div>
          </>
        )}

        {tab === 'opportunities' && (
          <div style={css.panel}>
            <div style={css.panelH}>All ({tokens.length})</div>
            <div style={css.panelB}>
              <table style={css.table}>
                <thead>
                  <tr>
                    {['Symbol', 'Score', 'Cat', '1h', 'Liq', 'Vol', ''].map(function (h) {
                      return (
                        <th key={h} style={css.th}>
                          {h}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>{renderRows(tokens)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'positions' && (
          <div style={css.panel}>
            <div style={css.panelH}>History</div>
            <div style={css.panelB}>
              <table style={css.table}>
                <thead>
                  <tr>
                    {['Symbol', 'Status', 'PnL %', 'Reason'].map(function (h) {
                      return (
                        <th key={h} style={css.th}>
                          {h}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(function (p) {
                    return (
                      <tr key={p.id}>
                        <td style={css.td}>{p.symbol}</td>
                        <td style={css.td}>{p.status}</td>
                        <td
                          style={{
                            ...css.td,
                            color: pctColor(p.pnl_pct != null ? p.pnl_pct : p.unrealized_pnl_pct),
                          }}
                        >
                          {formatPct(p.pnl_pct != null ? p.pnl_pct : p.unrealized_pnl_pct)}
                        </td>
                        <td style={css.td}>{p.close_reason || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'compound' && (
          <div style={css.panel}>
            <div style={css.panelH}>Compounding profit</div>
            <div style={{ ...css.panelB, padding: 12 }}>
              <p style={{ ...css.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
                Setelah sell profit, sebagian PnL (SOL) otomatis ditambahkan ke size buy
                berikutnya. Kerugian tidak menambah size.
              </p>
              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Base buy (SOL)</div>
                  <input
                    style={css.input}
                    type="number"
                    step="0.001"
                    value={baseBuySol}
                    onChange={function (e) {
                      const v = parseFloat(e.target.value) || 0
                      setBaseBuySol(v)
                      setCurrentBuySol(v)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Current buy size (SOL)</div>
                  <input
                    style={css.input}
                    type="number"
                    step="0.001"
                    value={currentBuySol}
                    onChange={function (e) {
                      setCurrentBuySol(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
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
                <div>
                  <div style={css.label}>Realized PnL (SOL)</div>
                  <div style={{ ...css.value, color: pctColor(realizedPnlSol) }}>
                    {num(realizedPnlSol, 4)}
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={compoundOn}
                  onChange={function (e) {
                    setCompoundOn(e.target.checked)
                  }}
                />
                Enable compounding
              </label>
              <button
                type="button"
                style={{ ...css.btnSecondary, width: 'auto', marginTop: 10 }}
                onClick={function () {
                  setCurrentBuySol(baseBuySol)
                  pushLog('Buy size reset to base')
                }}
              >
                Reset size to base
              </button>
            </div>
          </div>
        )}

        {tab === 'autopilot' && (
          <div style={css.panel}>
            <div style={css.panelH}>Auto-Pilot (approve only)</div>
            <div style={{ ...css.panelB, padding: 12 }}>
              <p style={{ ...css.muted, fontSize: 12, lineHeight: 1.5 }}>
                Buy/Sell tetap perlu approve di Phantom HP. Sistem yang menyiapkan transaksi
                otomatis saat sinyal / TP / SL.
              </p>
              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Min score</div>
                  <input
                    style={css.input}
                    type="number"
                    value={minOpp}
                    onChange={function (e) {
                      setMinOpp(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Max open</div>
                  <input
                    style={css.input}
                    type="number"
                    value={maxOpen}
                    onChange={function (e) {
                      setMaxOpen(parseInt(e.target.value, 10) || 1)
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
                    value={slippageBps}
                    onChange={function (e) {
                      setSlippageBps(parseInt(e.target.value, 10) || 100)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Scan interval sec</div>
                  <input
                    style={css.input}
                    type="number"
                    value={scanSec}
                    onChange={function (e) {
                      setScanSec(parseInt(e.target.value, 10) || 40)
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={tradingArmed}
                    onChange={function (e) {
                      setTradingArmed(e.target.checked)
                      if (!e.target.checked) setAutoBuySignal(false)
                    }}
                  />
                  Arm trading
                </label>
                <label style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={autoSell}
                    onChange={function (e) {
                      setAutoSell(e.target.checked)
                    }}
                  />
                  Auto TP/SL sell prompt
                </label>
                <label style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={autoBuySignal}
                    onChange={function (e) {
                      if (e.target.checked && (!tradingArmed || !wallet)) {
                        setMsg('Connect + Arm dulu')
                        return
                      }
                      setAutoBuySignal(e.target.checked)
                    }}
                  />
                  Auto buy signal (masih approve Phantom)
                </label>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={css.panel}>
            <div style={css.panelH}>Filters</div>
            <div style={{ ...css.panelB, padding: 12 }}>
              <div style={css.formGrid}>
                <div>
                  <div style={css.label}>Min liq</div>
                  <input
                    style={css.input}
                    type="number"
                    value={minLiq}
                    onChange={function (e) {
                      setMinLiq(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Min vol</div>
                  <input
                    style={css.input}
                    type="number"
                    value={minVol}
                    onChange={function (e) {
                      setMinVol(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
                <div>
                  <div style={css.label}>Max liq</div>
                  <input
                    style={css.input}
                    type="number"
                    value={maxLiq}
                    onChange={function (e) {
                      setMaxLiq(parseFloat(e.target.value) || 0)
                    }}
                  />
                </div>
              </div>
              <label style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={onlyPump}
                  onChange={function (e) {
                    setOnlyPump(e.target.checked)
                  }}
                />
                Only pump.fun mints
              </label>
            </div>
          </div>
        )}

        <div style={css.footer}>
          v6 · Approve-only · Auto TP/SL prompt · Compound · Not financial advice
        </div>
      </div>
    </div>
  )
}
