import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

type Plan = { key:string; name:string; url:string; limit:number|null; active?:boolean }
type Org = { id_empresa:string; nome_empresa:string; status:string }
type PaymentEvent = { email:string|null; planKey?:string|null; plan_key?:string|null; status:string; amount?:number|null; transaction_id?:string|null; provider?:string|null; occurred_at:string }

function OrgRow({
  org,
  limitsEntry,
  paymentEntry,
  visiblePlans,
  isMobile,
  emails,
  onSave,
  onDelete
}: {
  org: Org
  limitsEntry?: { user_limit:number|null; allow_exceed:boolean }
  paymentEntry?: { plan_key?:string; status?:string; amount?:number|null; paid_at?:string|null; transaction_id?:string|null }
  visiblePlans: Plan[]
  isMobile: boolean
  emails?: string[]
  onSave: (payload: {
    status: string
    userLimit: number|null
    allowExceed: boolean
    editPayment: boolean
    payStatus?: string
    payPlan?: string
    payAmount?: number|null
  }) => void
  onDelete: () => void
}) {
  const [status, setStatus] = useState<string>(org.status || 'pending')
  const [limit, setLimit] = useState<number|null>(typeof limitsEntry?.user_limit === 'number' ? limitsEntry!.user_limit : null)
  const [exceed, setExceed] = useState<boolean>(!!limitsEntry?.allow_exceed)
  const [edit, setEdit] = useState<boolean>(false)
  const [payStatus, setPayStatus] = useState<string>(paymentEntry?.status || 'pending')
  const [payPlan, setPayPlan] = useState<string>(paymentEntry?.plan_key || (visiblePlans[0]?.key ?? 'basic'))
  const [payAmount, setPayAmount] = useState<number|null>(typeof paymentEntry?.amount === 'number' ? paymentEntry!.amount! : null)

  return (
    <div style={{ border:'1px solid #1f2937', borderRadius:8, padding:12, marginBottom:12, background:'#0b1220' }}>
      {isMobile ? (
        <div style={{ display:'grid', gap:12 }}>
          <div style={{ fontWeight:600 }}>{org.nome_empresa || '-'}</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>ID: {org.id_empresa}</div>
          {!!emails && emails.length > 0 && (
            <div style={{ fontSize:12, color:'#94a3b8' }}>
              Emails: <span style={{ color:'#e2e8f0' }}>{emails.join(', ')}</span>
            </div>
          )}
          <div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Status</div>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Limite de Usuários</div>
            <input
              type="number"
              inputMode="numeric"
              value={limit==null?'':String(limit)}
              onChange={e=>{
                const v=e.target.value.trim(); setLimit(v===''?null:Number(v))
              }}
              style={{ width:'100%', padding:10, borderRadius:10, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}
            />
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <input type="checkbox" checked={exceed} onChange={e=>setExceed(e.target.checked)}/>
              <span>Permitir exceder</span>
            </label>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Pagamento</div>
            {!edit ? (
              <div style={{ fontSize:12 }}>
                <div>Status: <span style={{ color:'#e2e8f0' }}>{paymentEntry?.status || 'pending'}</span></div>
                <div>Plano: <span style={{ color:'#e2e8f0' }}>{paymentEntry?.plan_key || '-'}</span></div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:8 }}>
                <select value={payStatus} onChange={e=>setPayStatus(e.target.value)} style={{ padding:10, borderRadius:10, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
                  <option value="paid">paid</option>
                  <option value="pending">pending</option>
                  <option value="failed">failed</option>
                </select>
                <select value={payPlan} onChange={e=>setPayPlan(e.target.value)} style={{ padding:10, borderRadius:10, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
                  {visiblePlans.map(p=><option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Valor"
                  value={payAmount==null?'':String(payAmount)}
                  onChange={e=>{
                    const v=e.target.value.trim(); setPayAmount(v===''?null:Number(v))
                  }}
                  style={{ padding:10, borderRadius:10, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}
                />
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setEdit(v=>!v)} style={{ flex:1, background:'#374151', color:'#fff', border:'none', padding:'10px 12px', borderRadius:10, cursor:'pointer' }}>
              {edit ? 'Cancelar' : 'Editar'}
            </button>
            <button onClick={onDelete} style={{ flex:'0 0 auto', background:'#ef4444', color:'#fff', border:'none', padding:'10px 12px', borderRadius:10, cursor:'pointer' }}>
              Excluir
            </button>
            <button
              onClick={()=>{
                onSave({
                  status,
                  userLimit: limit,
                  allowExceed: exceed,
                  editPayment: edit,
                  payStatus,
                  payPlan,
                  payAmount
                })
              }}
              style={{ flex:1, background:'#3b82f6', color:'#fff', border:'none', padding:'10px 12px', borderRadius:10, cursor:'pointer' }}
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'180px 120px 140px 160px 180px 120px 120px', gap:8, alignItems:'center' }}>
          <div>{org.nome_empresa || '-'}</div>
          <div>{org.id_empresa}</div>
          <div style={{ gridColumn:'1 / -1', fontSize:12, color:'#94a3b8' }}>
            {!!emails && emails.length > 0 && <>Emails: <span style={{ color:'#e2e8f0' }}>{emails.join(', ')}</span></>}
          </div>
          <div>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ width:'100%', padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              value={limit==null?'':String(limit)}
              onChange={e=>{
                const v=e.target.value.trim(); setLimit(v===''?null:Number(v))
              }}
              style={{ width:'100%', padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}
            />
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <input type="checkbox" checked={exceed} onChange={e=>setExceed(e.target.checked)}/>
              <span>Permitir exceder</span>
            </label>
          </div>
          <div>
            {!edit ? (
              <div style={{ fontSize:12 }}>
                <div>Status: <span style={{ color:'#e2e8f0' }}>{paymentEntry?.status || 'pending'}</span></div>
                <div>Plano: <span style={{ color:'#e2e8f0' }}>{paymentEntry?.plan_key || '-'}</span></div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'100px 100px 100px', gap:8 }}>
                <select value={payStatus} onChange={e=>setPayStatus(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
                  <option value="paid">paid</option>
                  <option value="pending">pending</option>
                  <option value="failed">failed</option>
                </select>
                <select value={payPlan} onChange={e=>setPayPlan(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}>
                  {visiblePlans.map(p=><option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Valor"
                  value={payAmount==null?'':String(payAmount)}
                  onChange={e=>{
                    const v=e.target.value.trim(); setPayAmount(v===''?null:Number(v))
                  }}
                  style={{ padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}
                />
              </div>
            )}
          </div>
          <div>
            <button onClick={()=>setEdit(v=>!v)} style={{ background:'#374151', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}>
              {edit ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          <div>
            <button onClick={onDelete} style={{ background:'#ef4444', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', marginRight:8 }}>
              Excluir
            </button>
            <button
              onClick={()=>{
                onSave({
                  status,
                  userLimit: limit,
                  allowExceed: exceed,
                  editPayment: edit,
                  payStatus,
                  payPlan,
                  payAmount
                })
              }}
              style={{ background:'#3b82f6', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [limits, setLimits] = useState<Record<string, { user_limit:number|null; allow_exceed:boolean }>>({})
  const [payments, setPayments] = useState<Record<string, { plan_key?:string; status?:string; amount?:number|null; paid_at?:string|null; transaction_id?:string|null }>>({})
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [emailsByOrg, setEmailsByOrg] = useState<Record<string, string[]>>({})
  const [events, setEvents] = useState<PaymentEvent[]>([])

  const defaultPlans: Plan[] = [
    { key: 'basic', name: 'Plano Básico', url: 'https://pay.cakto.com.br/yfsvcpc', limit: 5, active: true },
    { key: 'pro', name: 'Plano Pro', url: 'https://pay.cakto.com.br/3ektfrr', limit: 10, active: true },
    { key: 'business', name: 'Plano Business', url: 'https://pay.cakto.com.br/fnxpsti_416689', limit: 15, active: true },
    { key: 'enterprise', name: 'Plano Enterprise', url: 'https://pay.cakto.com.br/dtkq7nr', limit: 30, active: true },
    { key: 'corporate', name: 'Plano Corporate', url: 'https://pay.cakto.com.br/7iobe8j', limit: 40, active: true },
    { key: 'custom', name: 'Plano Custom', url: '', limit: null, active: true },
  ]

  const visiblePlans = useMemo(()=>plans.filter(p=>p.active!==false),[plans])

  async function loadPlans() {
    if (!supabase) { setPlans(defaultPlans); return }
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key','subscription_plans')
      .maybeSingle()
    const arr = Array.isArray(data?.value) ? data?.value as Plan[] : defaultPlans
    setPlans(arr)
  }

  async function savePlans() {
    if (!supabase) return
    await supabase
      .from('system_settings')
      .upsert([{ key:'subscription_plans', value: plans, description:'Configuração de planos'}], { onConflict:'key' })
  }

  async function loadLimits() {
    if (!supabase) { setLimits({}); return }
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key','org_user_limits')
      .maybeSingle()
    setLimits((data?.value) || {})
  }

  async function loadPayments() {
    if (!supabase) { setPayments({}); return }
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key','org_payments')
      .maybeSingle()
    setPayments((data?.value) || {})
  }

  async function loadOrgs(q?:string) {
    setLoading(true)
    try {
      if (!supabase) { setOrgs([]); return }
      if (q && q.trim()) {
        const { data } = await supabase
          .from('organizations')
          .select('id_empresa,nome_empresa,status')
          .ilike('nome_empresa', `%${q}%`)
        setOrgs(data || [])
      } else {
        const { data } = await supabase
          .from('organizations')
          .select('id_empresa,nome_empresa,status')
          .order('created_at', { ascending:false })
        setOrgs(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveOrg(idEmpresa:string, status:string, userLimit:number|null, allowExceed:boolean) {
    if (!supabase) return
    await supabase
      .from('organizations')
      .update({ status })
      .eq('id_empresa', idEmpresa)
    const next = { ...limits, [idEmpresa]: { user_limit:userLimit, allow_exceed:allowExceed } }
    setLimits(next)
    await supabase
      .from('system_settings')
      .upsert([{ key:'org_user_limits', value: next, description:'Limites por organização'}], { onConflict:'key' })
  }
  async function savePayment(idEmpresa:string, payment:{ plan_key?:string; status?:string; amount?:number|null; paid_at?:string|null; transaction_id?:string|null }) {
    if (!supabase) return
    const next = { ...payments, [idEmpresa]: payment }
    setPayments(next)
    await supabase
      .from('system_settings')
      .upsert([{ key:'org_payments', value: next, description:'Pagamentos por organização'}], { onConflict:'key' })
    if (payment?.status) {
      await supabase
        .from('organizations')
        .update({ status: payment.status === 'paid' ? 'active' : payment.status })
        .eq('id_empresa', idEmpresa)
      setOrgs(prev => prev.map(o => o.id_empresa === idEmpresa ? { ...o, status: payment.status === 'paid' ? 'active' : (payment.status || o.status) } : o))
    }
  }

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(mql.matches)
    apply()
    mql.addEventListener?.('change', apply)
    return () => mql.removeEventListener?.('change', apply)
  }, [])

  async function loadEmails() {
    if (!supabase) { setEmailsByOrg({}); return }
    const { data } = await supabase.from('users').select('id_empresa,email');
    const map: Record<string, string[]> = {};
    (data || []).forEach((u:any) => {
      const id = u?.id_empresa
      const em = String(u?.email || '').trim()
      if (!id || !em) return
      if (!map[id]) map[id] = []
      if (!map[id].includes(em)) map[id].push(em)
    })
    setEmailsByOrg(map)
  }

  async function loadEvents() {
    if (!supabase) { setEvents([]); return }
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key','payment_events')
      .maybeSingle()
    const arr = Array.isArray(data?.value) ? (data?.value as PaymentEvent[]) : []
    setEvents(arr.slice(-200).reverse())
  }

  useEffect(() => {
    loadPlans()
    loadLimits()
    loadPayments()
    loadOrgs()
    loadEmails()
    loadEvents()
  }, [])

  useEffect(() => {
    if (!supabase) return
    const ch = supabase.channel('assinatura-vb')
      .on('postgres_changes', { event:'*', schema:'public', table:'organizations' }, () => loadOrgs(search))
      .on('postgres_changes', { event:'*', schema:'public', table:'system_settings', filter:'key=eq.org_user_limits' }, loadLimits)
      .on('postgres_changes', { event:'*', schema:'public', table:'system_settings', filter:'key=eq.org_payments' }, loadPayments)
      .on('postgres_changes', { event:'*', schema:'public', table:'system_settings', filter:'key=eq.payment_events' }, loadEvents)
      .subscribe()
    return () => { if (supabase) supabase.removeChannel(ch) }
  }, [search])

  async function deleteOrg(idEmpresa:string) {
    if (!supabase) return
    const ok = window.confirm('Excluir organização e limpar limites/pagamentos?')
    if (!ok) return
    await supabase.from('organizations').delete().eq('id_empresa', idEmpresa)
    const nextLimits = { ...limits }; delete nextLimits[idEmpresa]
    const nextPayments = { ...payments }; delete nextPayments[idEmpresa]
    setLimits(nextLimits); setPayments(nextPayments)
    await supabase.from('system_settings').upsert([{ key:'org_user_limits', value: nextLimits, description:'Limites por organização'}], { onConflict:'key' })
    await supabase.from('system_settings').upsert([{ key:'org_payments', value: nextPayments, description:'Pagamentos por organização'}], { onConflict:'key' })
    setOrgs(prev => prev.filter(o => o.id_empresa !== idEmpresa))
  }

  return (
    <div style={{ background:'#0f172a', minHeight:'100vh', color:'#e2e8f0' }}>
      <div style={{ maxWidth:isMobile? '100%' : 1000, margin:'0 auto', padding:isMobile? 12 : 16 }}>
        <h1 style={{ fontSize:22, margin:'8px 0 16px' }}>ASSINATURA-VB</h1>
        {!supabase && (
          <div style={{ background:'#1f2937', border:'1px solid #374151', borderRadius:10, padding:12, marginBottom:16 }}>
            <div style={{ color:'#fca5a5', fontWeight:600, marginBottom:6 }}>Ambiente não configurado</div>
            <div style={{ color:'#e5e7eb', fontSize:13 }}>
              Defina VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY em assinatura-vb/.env para conectar ao banco.
            </div>
          </div>
        )}

        <div style={{ background:'#0b1220', border:'1px solid #1f2937', borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontSize:18, margin:0 }}>Planos</h2>
            <button onClick={savePlans} style={{ background:'#3b82f6', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}>Salvar</button>
          </div>
          <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {visiblePlans.map((p, idx)=>(
              <div key={p.key} style={{ border:'1px solid #1f2937', borderRadius:8, padding:12 }}>
                <div style={{ fontWeight:600 }}>{p.name}</div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>URL</div>
                    <input value={p.url||''} onChange={e=>{
                      const next=[...plans]; next[idx]={...p, url:e.target.value}; setPlans(next)
                    }} style={{ width:'100%', padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>Limite</div>
                    <input type="number" value={p.limit==null?'':String(p.limit)} onChange={e=>{
                      const v=e.target.value.trim(); const next=[...plans]; next[idx]={...p, limit:v===''?null:Number(v)}; setPlans(next)
                    }} style={{ width:'100%', padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}/>
                  </div>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  <input type="checkbox" checked={p.active!==false} onChange={e=>{
                    const next=[...plans]; next[idx]={...p, active:e.target.checked}; setPlans(next)
                  }}/>
                  <span>Ativo</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'#0b1220', border:'1px solid #1f2937', borderRadius:10, padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontSize:18, margin:0 }}>Organizações</h2>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input placeholder="Pesquisar por nome" value={search} onChange={e=>{
                setSearch(e.target.value); loadOrgs(e.target.value)
              }} style={{ width:isMobile? '100%' : 220, padding:8, borderRadius:8, background:'#0b132b', border:'1px solid #1f2937', color:'#e2e8f0' }}/>
              <button onClick={()=>loadOrgs(search)} style={{ background:'#3b82f6', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}>{loading ? 'Carregando...' : 'Atualizar'}</button>
            </div>
          </div>
          {loading ? <div>Carregando...</div> : (
            <div style={{ overflow:'auto' }}>
              {!isMobile && (
                <div style={{ display:'grid', gridTemplateColumns:'180px 120px 140px 160px 180px 120px 120px', gap:8, color:'#94a3b8', fontSize:12, marginBottom:6 }}>
                  <div>Empresa</div><div>ID</div><div>Status</div><div>Limite Usuários</div><div>Pagamento</div><div>Editar</div><div>Salvar</div>
                </div>
              )}
              {orgs.map(org=>{
                const cur = limits[org.id_empresa]
                const pay = payments[org.id_empresa]
                const emails = emailsByOrg[org.id_empresa]
                return (
                  <OrgRow
                    key={org.id_empresa}
                    org={org}
                    limitsEntry={cur}
                    paymentEntry={pay}
                    visiblePlans={visiblePlans}
                    isMobile={isMobile}
                    emails={emails}
                    onSave={({ status, userLimit, allowExceed, editPayment, payStatus, payPlan, payAmount })=>{
                      saveOrg(org.id_empresa, status, userLimit, allowExceed)
                      if (editPayment) {
                        savePayment(org.id_empresa, { status:payStatus, plan_key:payPlan, amount:payAmount })
                      }
                    }}
                    onDelete={()=>{
                      deleteOrg(org.id_empresa)
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div style={{ background:'#0b1220', border:'1px solid #1f2937', borderRadius:10, padding:16, marginTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontSize:18, margin:0 }}>Eventos de Pagamento (tempo real)</h2>
            <button onClick={loadEvents} style={{ background:'#3b82f6', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer' }}>Recarregar</button>
          </div>
          {events.length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:12 }}>Sem eventos registrados</div>
          ) : (
            <div style={{ display:'grid', gap:8 }}>
              {events.map((ev, idx)=>(
                <div key={idx} style={{ border:'1px solid #1f2937', borderRadius:8, padding:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8, fontSize:12 }}>
                    <div><span style={{ color:'#94a3b8' }}>Email:</span> {ev.email || '-'}</div>
                    <div><span style={{ color:'#94a3b8' }}>Plano:</span> {ev.planKey || ev.plan_key || '-'}</div>
                    <div><span style={{ color:'#94a3b8' }}>Status:</span> {ev.status}</div>
                    <div><span style={{ color:'#94a3b8' }}>Valor:</span> {ev.amount==null?'-':ev.amount}</div>
                    <div><span style={{ color:'#94a3b8' }}>Transação:</span> {ev.transaction_id || '-'}</div>
                    <div><span style={{ color:'#94a3b8' }}>Provider:</span> {ev.provider || '-'}</div>
                    <div><span style={{ color:'#94a3b8' }}>Quando:</span> {new Date(ev.occurred_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
