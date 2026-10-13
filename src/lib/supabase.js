// Small REST adapter for Supabase's Auth and PostgREST APIs. Authorization is
// enforced by PostgreSQL RLS; the anon key is public by design and never privileged.
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const enabled = Boolean(url && anonKey)
const SESSION_KEY = 'portfolio-supabase-session'
let currentSession = null
const listeners = new Set()
try { currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { currentSession = null }
function emit(event, session) { currentSession = session; try { session ? localStorage.setItem(SESSION_KEY, JSON.stringify(session)) : localStorage.removeItem(SESSION_KEY) } catch {} listeners.forEach(fn => fn(event, session)) }
async function request(path, options = {}, token = currentSession?.access_token) {
 const headers = { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) }
 const response = await fetch(`${url}${path}`, { ...options, headers })
 const body = response.status === 204 ? null : await response.json().catch(() => null)
 if (!response.ok) return { data: null, error: { message: body?.msg || body?.message || body?.error_description || `Supabase request failed (${response.status})`, status: response.status } }
 return { data: body, error: null }
}
class Query {
 constructor(table){this.table=table;this.method='GET';this.params=new URLSearchParams();this.payload=null;this.returning=false;this.singleMode=false}
 select(columns='*'){this.params.set('select',columns);this.returning=this.method!=='GET';return this}
 eq(key,value){this.params.set(key,`eq.${value}`);return this}
 lte(key,value){this.params.set(key,`lte.${value}`);return this}
 order(key,{ascending=true}={}){this.params.set('order',`${key}.${ascending?'asc':'desc'}`);return this}
 limit(value){this.params.set('limit',String(value));return this}
 insert(payload){this.method='POST';this.payload=payload;return this}
 update(payload){this.method='PATCH';this.payload=payload;return this}
 delete(){this.method='DELETE';return this}
 single(){this.singleMode=true;return this}
 then(resolve,reject){const prefer=[];if(this.returning)prefer.push('return=representation');if(this.method==='POST')prefer.push('return=representation');const path=`/rest/v1/${encodeURIComponent(this.table)}?${this.params.toString()}`;return request(path,{method:this.method,body:this.payload?JSON.stringify(this.payload):undefined,headers:prefer.length?{Prefer:prefer.join(',')}:{} }).then(result=>{if(!result.error&&this.singleMode){const data=Array.isArray(result.data)?result.data[0]||null:result.data;return resolve({...result,data})}return resolve(result)},reject)}
}
export const supabase = enabled ? {
 from(table){return new Query(table)},
 auth:{
  async getSession(){return {data:{session:currentSession},error:null}},
  onAuthStateChange(callback){listeners.add(callback);return {data:{subscription:{unsubscribe(){listeners.delete(callback)}}}}},
  async signInWithPassword({email,password}){const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})},anonKey);if(!result.error)emit('SIGNED_IN',result.data);return {data:result.data,error:result.error}},
  async signOut(){const result=await request('/auth/v1/logout',{method:'POST'});emit('SIGNED_OUT',null);return result}
 }
} : null
