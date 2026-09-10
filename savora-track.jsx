import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  LayoutGrid, Receipt, Globe2, Webhook, Copy, Check, Sun, Moon,
  Send, Eye, EyeOff, RefreshCcw, ChevronRight
} from 'lucide-react';

/* ---------------------------------------------------------------- */
/* Tokens                                                            */
/* ---------------------------------------------------------------- */

const THEMES = {
  light: {
    bg: '#FFFFFF',
    bgSubtle: '#FAF7F0',
    surface: '#FFFFFF',
    raised: '#F6F1E3',
    border: '#E9E1CB',
    borderStrong: '#D9CBA0',
    text: '#211A11',
    textMuted: '#8A7C63',
    gold: '#AD7F24',
    goldBright: '#C9982F',
    goldSoft: '#F1E3BE',
    danger: '#9C4A3C',
    dangerSoft: '#F3E2DD',
    shadow: '0 1px 2px rgba(33,26,17,0.05), 0 8px 24px rgba(33,26,17,0.05)',
    scheme: 'light',
  },
  dark: {
    bg: '#0B0906',
    bgSubtle: '#100D08',
    surface: '#15110A',
    raised: '#1C1710',
    border: '#2C2416',
    borderStrong: '#4A3C21',
    text: '#F3EEDF',
    textMuted: '#9C8E6E',
    gold: '#D4AF37',
    goldBright: '#EFCC66',
    goldSoft: 'rgba(212,175,55,0.14)',
    danger: '#D08677',
    dangerSoft: 'rgba(208,134,119,0.14)',
    shadow: '0 1px 2px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.35)',
    scheme: 'dark',
  },
};

const FIRST_NAMES = ['Ana', 'Mateus', 'Beatriz', 'Domingos', 'Isabel', 'Kiluanji', 'Sara', 'Nelson', 'Ruth', 'Adilson', 'Fátima', 'Edson'];
const LAST_NAMES = ['Neto', 'Cardoso', 'dos Santos', 'Vieira', 'Manuel', 'Chissano', 'Lopes', 'Pereira', 'Kiala', 'Sousa'];
const PRODUCTS = ['Plano Mensal Pro', 'Curso Avançado', 'Consultoria 1:1', 'Acesso Vitalício', 'Plano Anual', 'E-book Estratégico'];
const SOURCES = ['facebook', 'google', 'tiktok', 'instagram', 'direto', 'orgânico'];
const CAMPAIGNS = ['promo-setembro', 'lancamento-vip', 'retarget-carrinho', 'trafego-frio', 'indicacao', 'black-friday'];
const STATUS_LABEL = { aprovada: 'Aprovada', pendente: 'Pendente', reembolsada: 'Reembolsada' };

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
/* ---------------------------------------------------------------- */

function formatKz(value) {
  const num = Number(value) || 0;
  const fixed = num.toFixed(2);
  let [intPart, decPart] = fixed.split('.');
  const negative = intPart.startsWith('-');
  if (negative) intPart = intPart.slice(1);
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${intPart},${decPart} Kz`;
}

function formatDay(date) {
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' · ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function weightedStatus() {
  const r = Math.random();
  if (r < 0.68) return 'aprovada';
  if (r < 0.9) return 'pendente';
  return 'reembolsada';
}

function makeSale(daysAgoMax = 6) {
  const daysAgo = Math.floor(Math.random() * (daysAgoMax + 1));
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0);
  return {
    id: randomId('venda'),
    date: date.toISOString(),
    customer: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    product: pick(PRODUCTS),
    amount: Math.round((Math.random() * 38000 + 4500) * 100) / 100,
    status: weightedStatus(),
    source: pick(SOURCES),
    campaign: pick(CAMPAIGNS),
  };
}

function seedSales(n = 22) {
  return Array.from({ length: n }, () => makeSale(6)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------------------------------------------------------------- */
/* Small UI atoms                                                    */
/* ---------------------------------------------------------------- */

function StatusPill({ status, t }) {
  const styles = {
    aprovada: { bg: t.goldSoft, color: t.scheme === 'light' ? '#7A5A16' : t.goldBright, border: t.borderStrong },
    pendente: { bg: 'transparent', color: t.textMuted, border: t.border },
    reembolsada: { bg: t.dangerSoft, color: t.danger, border: 'transparent' },
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
      background: styles.bg, color: styles.color, border: `1px solid ${styles.border}`,
      fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function CopyField({ value, masked, t, label }) {
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(!!masked);
  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) { /* clipboard unavailable */ }
  }, [value]);
  return (
    <div>
      {label && <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, background: t.raised,
        border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 10px 10px 14px',
      }}>
        <code style={{
          flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: t.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {hidden ? '•'.repeat(Math.min(value.length, 28)) : value}
        </code>
        {masked && (
          <button onClick={() => setHidden(h => !h)} aria-label={hidden ? 'Mostrar' : 'Ocultar'}
            style={iconBtnStyle(t)}>
            {hidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        )}
        <button onClick={doCopy} aria-label="Copiar" style={iconBtnStyle(t, copied, t)}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

function iconBtnStyle(t, active) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`,
    background: active ? t.goldSoft : t.surface, color: active ? t.gold : t.textMuted,
    cursor: 'pointer', flexShrink: 0,
  };
}

function MetricCard({ label, value, sub, t }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
      padding: '18px 20px', boxShadow: t.shadow, minWidth: 0,
    }}>
      <div style={{ fontSize: 13, color: t.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 10 }}>{label}</div>
      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: t.text,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', lineHeight: 1.1,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 8, fontFamily: "'Inter', sans-serif" }}>{sub}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

export default function SavoraTrack() {
  const [themeName, setThemeName] = useState('dark');
  const t = THEMES[themeName];
  const [tab, setTab] = useState('overview');
  const [sales, setSales] = useState(null);
  const [log, setLog] = useState([]);
  const [endpoint, setEndpoint] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [sending, setSending] = useState(false);
  const initialized = useRef(false);

  // Load / seed persisted state
  useEffect(() => {
    (async () => {
      let loadedSales = null;
      let loadedLog = [];
      let loadedEndpoint = null;
      try {
        const r = await window.storage.get('savora-track:sales', false);
        if (r) loadedSales = JSON.parse(r.value);
      } catch (e) { /* not found */ }
      try {
        const r = await window.storage.get('savora-track:log', false);
        if (r) loadedLog = JSON.parse(r.value);
      } catch (e) { /* not found */ }
      try {
        const r = await window.storage.get('savora-track:endpoint', false);
        if (r) loadedEndpoint = JSON.parse(r.value);
      } catch (e) { /* not found */ }

      if (!loadedSales) loadedSales = seedSales();
      if (!loadedEndpoint) {
        loadedEndpoint = { id: randomId('wh'), secret: randomId('sk_live').replace('sk_live_', 'sk_live_') + randomId('x').slice(-6) };
      }
      setSales(loadedSales);
      setLog(loadedLog);
      setEndpoint(loadedEndpoint);
      initialized.current = true;
    })();
  }, []);

  // Persist on change (after initial load)
  useEffect(() => {
    if (!initialized.current || !sales) return;
    window.storage.set('savora-track:sales', JSON.stringify(sales), false).catch(() => {});
  }, [sales]);
  useEffect(() => {
    if (!initialized.current) return;
    window.storage.set('savora-track:log', JSON.stringify(log), false).catch(() => {});
  }, [log]);
  useEffect(() => {
    if (!initialized.current || !endpoint) return;
    window.storage.set('savora-track:endpoint', JSON.stringify(endpoint), false).catch(() => {});
  }, [endpoint]);

  const loading = !sales || !endpoint;

  /* ------------------------ derived data ------------------------ */

  const approved = useMemo(() => (sales || []).filter(s => s.status === 'aprovada'), [sales]);
  const pending = useMemo(() => (sales || []).filter(s => s.status === 'pendente'), [sales]);

  const totalRevenue = useMemo(() => approved.reduce((sum, s) => sum + s.amount, 0), [approved]);
  const avgTicket = approved.length ? totalRevenue / approved.length : 0;
  const pendingValue = useMemo(() => pending.reduce((sum, s) => sum + s.amount, 0), [pending]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days.map(day => {
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      const total = approved
        .filter(s => { const sd = new Date(s.date); return sd >= day && sd <= dayEnd; })
        .reduce((sum, s) => sum + s.amount, 0);
      return { label: formatDay(day), total };
    });
  }, [approved]);

  const bySource = useMemo(() => {
    const map = {};
    for (const s of (sales || [])) {
      if (!map[s.source]) map[s.source] = { source: s.source, revenue: 0, count: 0 };
      if (s.status === 'aprovada') map[s.source].revenue += s.amount;
      map[s.source].count += 1;
    }
    const arr = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const max = arr.reduce((m, x) => Math.max(m, x.revenue), 0) || 1;
    return arr.map(x => ({ ...x, pct: x.revenue / max }));
  }, [sales]);

  /* ------------------------ actions ------------------------ */

  const addSale = useCallback((sale, rawPayload) => {
    setSales(prev => [sale, ...(prev || [])]);
    setLog(prev => [{
      id: randomId('evt'),
      receivedAt: new Date().toISOString(),
      event: sale.status === 'aprovada' ? 'venda.aprovada' : sale.status === 'pendente' ? 'venda.pendente' : 'venda.reembolsada',
      payload: rawPayload,
    }, ...prev].slice(0, 40));
  }, []);

  const sendTestEvent = useCallback(() => {
    setSending(true);
    const sale = makeSale(0);
    const payload = {
      evento: sale.status === 'aprovada' ? 'venda.aprovada' : sale.status === 'pendente' ? 'venda.pendente' : 'venda.reembolsada',
      cliente: sale.customer,
      produto: sale.product,
      valor: sale.amount,
      moeda: 'AOA',
      status: sale.status,
      utm_source: sale.source,
      utm_campaign: sale.campaign,
      data: sale.date,
    };
    setTimeout(() => {
      addSale(sale, payload);
      setSending(false);
    }, 450);
  }, [addSale]);

  const simulateCustomPayload = useCallback(() => {
    setJsonError('');
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      setJsonError('O JSON enviado não é válido. Confira as chaves e vírgulas.');
      return;
    }
    const amount = Number(parsed.valor ?? parsed.amount);
    if (!amount || amount <= 0) {
      setJsonError('Inclua um campo "valor" (ou "amount") maior que zero.');
      return;
    }
    const status = ['aprovada', 'pendente', 'reembolsada'].includes(parsed.status) ? parsed.status : 'aprovada';
    const sale = {
      id: randomId('venda'),
      date: parsed.data || new Date().toISOString(),
      customer: parsed.cliente || parsed.customer || 'Cliente do webhook',
      product: parsed.produto || parsed.product || 'Produto não identificado',
      amount,
      status,
      source: parsed.utm_source || parsed.source || 'direto',
      campaign: parsed.utm_campaign || parsed.campaign || '—',
    };
    addSale(sale, parsed);
    setJsonInput('');
  }, [jsonInput, addSale]);

  /* ------------------------ render ------------------------ */

  if (loading) {
    return (
      <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, borderRadius: 16 }}>
        <span style={{ color: t.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>A carregar o painel…</span>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Visão geral', icon: LayoutGrid },
    { id: 'sales', label: 'Vendas', icon: Receipt },
    { id: 'sources', label: 'Origens', icon: Globe2 },
    { id: 'webhook', label: 'Webhook', icon: Webhook },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif", background: t.bg, color: t.text, minHeight: '100%',
      borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`,
      transition: 'background 0.25s ease, color 0.25s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .st-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .st-scroll::-webkit-scrollbar-thumb { background: ${t.borderStrong}; border-radius: 4px; }
        .st-navbtn { transition: background 0.15s ease, color 0.15s ease; }
        .st-row:hover { background: ${t.raised}; }
      `}</style>

      <div style={{ display: 'flex', minHeight: 640 }}>
        {/* Sidebar */}
        <div style={{
          width: 208, flexShrink: 0, borderRight: `1px solid ${t.border}`, background: t.bgSubtle,
          padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L21 12L12 22L3 12L12 2Z" stroke={t.gold} strokeWidth="1.6" />
              <path d="M12 2V22" stroke={t.gold} strokeWidth="1.6" />
            </svg>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17.5, letterSpacing: '-0.01em', color: t.text }}>
              Savora <span style={{ color: t.gold }}>Track</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const activeItem = tab === item.id;
              return (
                <button key={item.id} className="st-navbtn" onClick={() => setTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9,
                    border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, textAlign: 'left',
                    background: activeItem ? t.goldSoft : 'transparent',
                    color: activeItem ? (t.scheme === 'light' ? '#7A5A16' : t.goldBright) : t.textMuted,
                  }}>
                  <Icon size={16} strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginBottom: 8, padding: '0 6px' }}>Tema</div>
            <div style={{
              display: 'flex', background: t.raised, borderRadius: 10, padding: 3,
              border: `1px solid ${t.border}`,
            }}>
              <button onClick={() => setThemeName('light')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                background: themeName === 'light' ? '#FFFFFF' : 'transparent',
                color: themeName === 'light' ? '#7A5A16' : t.textMuted,
                boxShadow: themeName === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}>
                <Sun size={13} /> Claro
              </button>
              <button onClick={() => setThemeName('dark')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                background: themeName === 'dark' ? '#211A0E' : 'transparent',
                color: themeName === 'dark' ? t.goldBright : t.textMuted,
                boxShadow: themeName === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}>
                <Moon size={13} /> Escuro
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowX: 'auto' }}>
          {tab === 'overview' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>Visão geral</div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>Resumo dos últimos 7 dias, em kwanza.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                <MetricCard t={t} label="Faturamento aprovado" value={formatKz(totalRevenue)} sub={`${approved.length} vendas aprovadas`} />
                <MetricCard t={t} label="Ticket médio" value={formatKz(avgTicket)} sub="por venda aprovada" />
                <MetricCard t={t} label="Pendentes" value={pending.length} sub={`${formatKz(pendingValue)} a confirmar`} />
                <MetricCard t={t} label="Eventos recebidos" value={log.length} sub="via webhook" />
              </div>

              <div style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px 8px',
                boxShadow: t.shadow, marginBottom: 20,
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Faturamento por dia</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 6 }}>Apenas vendas aprovadas</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={t.gold} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={t.gold} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={t.border} />
                      <XAxis dataKey="label" tick={{ fill: t.textMuted, fontSize: 12 }} axisLine={{ stroke: t.border }} tickLine={false} />
                      <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} width={38} />
                      <Tooltip
                        formatter={(v) => [formatKz(v), 'Faturamento']}
                        contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 12.5 }}
                        labelStyle={{ color: t.textMuted }}
                      />
                      <Area type="monotone" dataKey="total" stroke={t.gold} strokeWidth={2} fill="url(#goldFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {tab === 'sales' && (
            <>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>Vendas</div>
                  <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>{sales.length} registos, mais recentes primeiro.</div>
                </div>
              </div>
              <div className="st-scroll" style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, boxShadow: t.shadow, overflow: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
                      {['Data', 'Cliente', 'Produto', 'Origem', 'Valor', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 60).map(s => (
                      <tr key={s.id} className="st-row" style={{ borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                        <td style={{ padding: '10px 16px', color: t.textMuted, whiteSpace: 'nowrap' }}>{formatDateTime(s.date)}</td>
                        <td style={{ padding: '10px 16px' }}>{s.customer}</td>
                        <td style={{ padding: '10px 16px', color: t.textMuted }}>{s.product}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontSize: 11.5, padding: '2px 8px', borderRadius: 999, border: `1px solid ${t.border}`,
                            color: t.textMuted, textTransform: 'capitalize',
                          }}>{s.source}</span>
                        </td>
                        <td style={{ padding: '10px 16px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatKz(s.amount)}</td>
                        <td style={{ padding: '10px 16px' }}><StatusPill status={s.status} t={t} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'sources' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>Origens</div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>Faturamento aprovado por origem (utm_source).</div>
              </div>
              <div style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, boxShadow: t.shadow, padding: '8px 20px',
              }}>
                {bySource.map((row, i) => (
                  <div key={row.source} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
                    borderBottom: i < bySource.length - 1 ? `1px solid ${t.border}` : 'none',
                  }}>
                    <div style={{ width: 92, fontSize: 13.5, textTransform: 'capitalize', flexShrink: 0 }}>{row.source}</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 5, background: t.raised, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(row.pct * 100, 3)}%`, height: '100%', background: t.gold, borderRadius: 5 }} />
                    </div>
                    <div style={{ width: 120, textAlign: 'right', fontSize: 13.5, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {formatKz(row.revenue)}
                    </div>
                    <div style={{ width: 60, textAlign: 'right', fontSize: 12.5, color: t.textMuted, flexShrink: 0 }}>
                      {row.count} pedido{row.count === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'webhook' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>Webhook</div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3, maxWidth: 560, lineHeight: 1.5 }}>
                  Configure este endereço na sua plataforma de pagamento para receber cada venda em tempo real.
                  Este painel roda no seu navegador, por isso os eventos abaixo são simulados aqui mesmo — use
                  o formulário de teste para ver como um evento real seria processado.
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18,
              }}>
                <CopyField t={t} label="URL do webhook" value={`https://hooks.savoratrack.com/wh/${endpoint.id}`} />
                <CopyField t={t} label="Chave secreta" value={endpoint.secret} masked />
              </div>

              <div style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, boxShadow: t.shadow,
                padding: 20, marginBottom: 18,
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Testar recebimento</div>
                <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 14 }}>
                  Envie um evento de exemplo ou cole o corpo de um webhook em JSON.
                </div>

                <button onClick={sendTestEvent} disabled={sending} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9,
                  border: 'none', cursor: sending ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
                  background: t.gold, color: t.scheme === 'light' ? '#FFFDF7' : '#1B1508', marginBottom: 16,
                  opacity: sending ? 0.7 : 1,
                }}>
                  {sending ? <RefreshCcw size={14} className="spin" /> : <Send size={14} />}
                  Enviar evento de teste
                </button>

                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={'{\n  "cliente": "Mariana Costa",\n  "produto": "Plano Anual",\n  "valor": 25000,\n  "status": "aprovada",\n  "utm_source": "google",\n  "utm_campaign": "black-friday"\n}'}
                  rows={7}
                  style={{
                    width: '100%', boxSizing: 'border-box', background: t.raised, border: `1px solid ${t.border}`,
                    borderRadius: 10, padding: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5,
                    color: t.text, resize: 'vertical', marginBottom: 10,
                  }}
                />
                {jsonError && (
                  <div style={{ fontSize: 12.5, color: t.danger, marginBottom: 10 }}>{jsonError}</div>
                )}
                <button onClick={simulateCustomPayload} disabled={!jsonInput.trim()} style={{
                  padding: '8px 14px', borderRadius: 9, border: `1px solid ${t.borderStrong}`,
                  background: 'transparent', color: t.text, fontSize: 13, fontWeight: 600,
                  cursor: jsonInput.trim() ? 'pointer' : 'default', opacity: jsonInput.trim() ? 1 : 0.5,
                }}>
                  Simular recebimento
                </button>
              </div>

              <div style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, boxShadow: t.shadow, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>
                  Últimos eventos recebidos
                </div>
                {log.length === 0 ? (
                  <div style={{ padding: 24, fontSize: 13, color: t.textMuted, textAlign: 'center' }}>
                    Nenhum evento ainda. Envie um teste acima para ver como aparece aqui.
                  </div>
                ) : (
                  <div className="st-scroll" style={{ maxHeight: 280, overflow: 'auto' }}>
                    {log.map(entry => (
                      <div key={entry.id} style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: t.gold }}>{entry.event}</span>
                          <span style={{ fontSize: 11.5, color: t.textMuted }}>{formatDateTime(entry.receivedAt)}</span>
                        </div>
                        <code style={{
                          display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5,
                          color: t.textMuted, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {JSON.stringify(entry.payload)}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
