import { useState, useEffect, useCallback } from "react";

// ── CONFIG SUPABASE ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://leqidlevtqnfbeedjvca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcWlkbGV2dHFuZmJlZWRqdmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTQ3ODQsImV4cCI6MjA5NzA5MDc4NH0.vFRl1CJosYD1JumwMzI7F1gUneD1CtET2dSZrNtxciA";

const H = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, ...opts });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── PALETTE ───────────────────────────────────────────────────────────────────
const P = {
  nebbia:     "#E8E4DC",
  ecru:       "#DDD5C5",
  ruggine:    "#A0442A",
  muschio:    "#6B7A5E",
  terra:      "#2C2218",
  canvas:     "#F5F1EB",
  warm_white: "#FDFAF6",
};

const STATI = [
  { id: "ricezione_testo",   label: "Ricezione testo",   bg: "#EDEAE6", text: "#6B5E4E", dot: "#B0A898" },
  { id: "revisione_testo",   label: "Revisione testo",   bg: "#EDE8F8", text: "#3D2A72", dot: "#A990E0" },
  { id: "impost_grafica",    label: "Impost. grafica",   bg: "#FDF3D0", text: "#7A5A0A", dot: "#E8C23A" },
  { id: "revisione_grafica", label: "Revisione grafica", bg: "#FDE4C8", text: "#7A3A0A", dot: "#E8803A" },
  { id: "pronto",            label: "Pronto",            bg: "#E4E2FF", text: "#2A1F8A", dot: "#6C63FF" },
  { id: "programmato",       label: "Programmato su IG", bg: "#C8E8F8", text: "#0A3A5A", dot: "#2A8EC8" },
  { id: "pubblicato",        label: "Pubblicato",        bg: "#C8DCC8", text: "#1A3A1A", dot: "#3A7A3A" },
];
const statoById = (id) => STATI.find(s => s.id === id) || STATI[0];

const MESI_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
                 "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_IT = ["D","L","M","M","G","V","S"];

function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function isWeekend(y, m, d) { const w = new Date(y,m,d).getDay(); return w===0||w===6; }
function giorniA(dataStr) {
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const t = new Date(dataStr); t.setHours(0,0,0,0);
  return Math.round((t-oggi)/86400000);
}
function textOnBg(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return (0.299*r+0.587*g+0.114*b)/255 > 0.55 ? "#2C2218" : "#FFFFFF";
}
function padDate(y,m,d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

// ── COMPONENTI BASE ───────────────────────────────────────────────────────────

function StatoBadge({ id, small }) {
  const s = statoById(id);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:s.bg, color:s.text,
      borderRadius:20, padding: small ? "2px 8px" : "4px 10px",
      fontSize: small ? 10 : 11, fontWeight:600, whiteSpace:"nowrap",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

function ScadenzaChip({ dataStr }) {
  const g = giorniA(dataStr);
  let bg, color, label;
  if (g < 0)        { bg="#F8D7DA"; color="#842029"; label=`Scaduto ${Math.abs(g)}g fa`; }
  else if (g === 0) { bg="#FFF3CD"; color="#856404"; label="Oggi"; }
  else if (g <= 3)  { bg="#FFF3CD"; color="#856404"; label=`${g}g`; }
  else if (g <= 7)  { bg="#D1ECF1"; color="#0C5460"; label=`${g}g`; }
  else              { bg=P.canvas;  color="#6B5E4E"; label=`${g}g`; }
  return <span style={{ background:bg, color, borderRadius:12, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{label}</span>;
}

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{
        width:32, height:32, borderRadius:"50%",
        border:`3px solid ${P.ecru}`, borderTopColor:P.ruggine,
        animation:"spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background:P.terra, color:P.ecru, borderRadius:10,
      padding:"10px 20px", fontSize:12, fontWeight:600, zIndex:300,
      boxShadow:"0 4px 20px #2C221844",
    }}>{msg}</div>
  );
}

// ── MODAL WRAPPER ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"#2C221899", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div style={{
        background:P.warm_white, borderRadius:16, padding:24,
        maxWidth:460, width:"100%", boxShadow:"0 20px 60px #2C221844",
        border:`1px solid ${P.ecru}`, maxHeight:"88vh", overflowY:"auto",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800, color:P.terra }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#A89880", lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#9A8E84", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", boxSizing:"border-box",
  background:P.canvas, border:`1px solid ${P.ecru}`,
  borderRadius:8, padding:"8px 12px",
  fontSize:13, color:P.terra, fontFamily:"inherit",
};
const btnChip = (active, bg="#2C2218", fg="#fff") => ({
  border:`1px solid ${P.ecru}`, borderRadius:8,
  padding:"5px 11px", fontSize:11, fontWeight:600, cursor:"pointer",
  background: active ? bg : P.canvas,
  color: active ? fg : P.terra,
  transition:"all 0.12s",
});
const btnPrimary = (disabled) => ({
  width:"100%", marginTop:8,
  background: disabled ? "#C4B8A8" : P.ruggine,
  color:"#fff", border:"none", borderRadius:10,
  padding:"12px 0", fontSize:14, fontWeight:700, cursor: disabled ? "default" : "pointer",
});

// ── MODAL NUOVO POST ──────────────────────────────────────────────────────────
function NuovoPostModal({ onClose, onSave, aree, progetti, team, prefillAreaId, prefillData }) {
  const [form, setForm] = useState({
    area_id: prefillAreaId || (aree[0]?.id || ""),
    progetto_id: "",
    titolo: "",
    data_pubblicazione: prefillData || padDate(2026, new Date().getMonth(), new Date().getDate()),
    stato: "ricezione_testo",
    responsabile_id: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  const progettiArea = progetti.filter(p => p.area_id === form.area_id);
  const areaSelezionata = aree.find(a => a.id === form.area_id);

  async function handleSave() {
    if (!form.titolo || !form.data_pubblicazione) return;
    setSaving(true);
    await onSave({
      area_id: form.area_id || null,
      progetto_id: form.progetto_id || null,
      titolo: form.titolo,
      data_pubblicazione: form.data_pubblicazione,
      stato: form.stato,
      responsabile_id: form.responsabile_id || null,
      note: form.note || null,
    });
    setSaving(false);
  }

  return (
    <Modal title="Nuovo contenuto" onClose={onClose}>
      <Field label="Area">
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {aree.map(a => {
            const sel = form.area_id === a.id;
            return (
              <button key={a.id} onClick={()=>set("area_id",a.id)} style={{
                ...btnChip(sel, a.colore_hex, textOnBg(a.colore_hex)),
                display:"flex", alignItems:"center", gap:5,
              }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:a.colore_hex }} />
                {a.nome}
              </button>
            );
          })}
        </div>
      </Field>

      {progettiArea.length > 0 && (
        <Field label="Progetto (opzionale)">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <button onClick={()=>set("progetto_id","")} style={btnChip(form.progetto_id==="")}>Nessuno</button>
            {progettiArea.map(p => (
              <button key={p.id} onClick={()=>set("progetto_id",p.id)}
                style={btnChip(form.progetto_id===p.id, areaSelezionata?.colore_hex||P.terra, textOnBg(areaSelezionata?.colore_hex||P.terra))}>
                {p.sigla} — {p.nome}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Titolo / tema">
        <input value={form.titolo} onChange={e=>set("titolo",e.target.value)}
          placeholder="es. Carico sensoriale in estate" style={inputStyle} />
      </Field>

      <Field label="Data di pubblicazione">
        <input type="date" value={form.data_pubblicazione} onChange={e=>set("data_pubblicazione",e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Responsabile">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[{id:"",nome:"— nessuno —"}, ...team].map(t => (
            <button key={t.id} onClick={()=>set("responsabile_id",t.id)}
              style={btnChip(form.responsabile_id===t.id, P.muschio)}>
              {t.nome}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Stato iniziale">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {STATI.map(s => (
            <button key={s.id} onClick={()=>set("stato",s.id)} style={{
              background: form.stato===s.id ? s.dot : s.bg,
              color: form.stato===s.id ? "#fff" : s.text,
              border:`1px solid ${s.dot}`, borderRadius:16,
              padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
            }}>{s.label}</button>
          ))}
        </div>
      </Field>

      <Field label="Note (opzionale)">
        <textarea value={form.note} onChange={e=>set("note",e.target.value)}
          placeholder="Note aggiuntive..." rows={2}
          style={{...inputStyle, resize:"vertical"}} />
      </Field>

      <button onClick={handleSave} disabled={saving||!form.titolo} style={btnPrimary(saving||!form.titolo)}>
        {saving ? "Salvataggio…" : "Aggiungi contenuto"}
      </button>
    </Modal>
  );
}

// ── MODAL GESTIONE AREE (nuova + modifica + archivia) ────────────────────────
function GestioneAreeModal({ onClose, aree, onSave, onUpdate, onArchivia }) {
  const [tab, setTab] = useState("lista"); // lista | nuova
  const [nome, setNome] = useState("");
  const [colore, setColore] = useState("#A0442A");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editColore, setEditColore] = useState("");
  const [confirmArch, setConfirmArch] = useState(null);

  async function handleSave() {
    if (!nome) return;
    setSaving(true);
    await onSave(nome, colore);
    setNome(""); setColore("#A0442A");
    setSaving(false);
    setTab("lista");
  }

  async function handleUpdate(id) {
    setSaving(true);
    await onUpdate(id, { nome: editNome, colore_hex: editColore });
    setSaving(false);
    setEditId(null);
  }

  async function handleArchivia(id) {
    setSaving(true);
    await onArchivia(id);
    setSaving(false);
    setConfirmArch(null);
  }

  const areeAttive = aree.filter(a => !a.archiviata);

  return (
    <Modal title="Gestione aree" onClose={onClose}>
      <div style={{ display:"flex", gap:6, marginBottom:20, background:P.canvas, borderRadius:10, padding:4 }}>
        {[{id:"lista",label:"Aree attive"},{id:"nuova",label:"+ Nuova area"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:"7px 0", background:tab===t.id?P.terra:"transparent",
            color:tab===t.id?P.ecru:P.terra, border:"none", borderRadius:7,
            fontSize:12, fontWeight:700, cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="lista" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {areeAttive.map(a => (
            <div key={a.id}>
              {confirmArch===a.id ? (
                <div style={{ background:"#FEF9E7", border:`1px solid #F0C040`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:12, color:P.terra, marginBottom:10 }}>Archiviare <strong>{a.nome}</strong>? Sparirà dal calendario ma i post restano.</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setConfirmArch(null)} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:8, padding:"7px 0", fontSize:12, cursor:"pointer" }}>Annulla</button>
                    <button onClick={()=>handleArchivia(a.id)} disabled={saving} style={{ flex:1, background:"#E67E22", border:"none", borderRadius:8, padding:"7px 0", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>Archivia</button>
                  </div>
                </div>
              ) : editId===a.id ? (
                <div style={{ background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:10, padding:"12px 14px" }}>
                  <input value={editNome} onChange={e=>setEditNome(e.target.value)} style={{...inputStyle, marginBottom:10}} />
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <input type="color" value={editColore} onChange={e=>setEditColore(e.target.value)}
                      style={{ width:36, height:36, border:"none", borderRadius:6, cursor:"pointer" }} />
                    <div style={{ background:editColore, color:textOnBg(editColore), borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:700 }}>{editNome}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setEditId(null)} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:8, padding:"7px 0", fontSize:12, cursor:"pointer" }}>Annulla</button>
                    <button onClick={()=>handleUpdate(a.id)} disabled={saving} style={{ flex:2, background:P.ruggine, border:"none", borderRadius:8, padding:"7px 0", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>Salva</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:P.warm_white, border:`1px solid ${P.ecru}`, borderLeft:`4px solid ${a.colore_hex}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:10, height:10, borderRadius:"50%", background:a.colore_hex, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:13, fontWeight:700, color:P.terra }}>{a.nome}</span>
                  <button onClick={()=>{ setEditId(a.id); setEditNome(a.nome); setEditColore(a.colore_hex); }} style={{ background:"none", border:`1px solid ${P.ecru}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:P.muschio, cursor:"pointer" }}>✏️</button>
                  <button onClick={()=>setConfirmArch(a.id)} style={{ background:"none", border:`1px solid #F5C6C6`, borderRadius:6, padding:"4px 8px", fontSize:11, color:"#E67E22", cursor:"pointer" }}>📦</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="nuova" && (
        <>
          <Field label="Nome area">
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="es. Trauma" style={inputStyle} />
          </Field>
          <Field label="Colore identificativo">
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <input type="color" value={colore} onChange={e=>setColore(e.target.value)}
                style={{ width:44, height:44, border:"none", borderRadius:8, cursor:"pointer" }} />
              <div style={{ background:colore, color:textOnBg(colore), borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:700 }}>
                {nome||"Anteprima"}
              </div>
            </div>
          </Field>
          <button onClick={handleSave} disabled={saving||!nome} style={btnPrimary(saving||!nome)}>
            {saving ? "Salvataggio…" : "Aggiungi area"}
          </button>
        </>
      )}
    </Modal>
  );
}

// ── MODAL GESTIONE PROGETTI ───────────────────────────────────────────────────
function GestioneProgettiModal({ onClose, progetti, aree, team, onSave, onUpdate, onArchivia }) {
  const [tab, setTab] = useState("lista");
  const [form, setForm] = useState({ area_id: aree[0]?.id||"", nome:"", sigla:"", resp_grafica_id:"", ref_coworker:"" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmArch, setConfirmArch] = useState(null);

  function setF(k,v) { setForm(f=>({...f,[k]:v})); }
  function setEF(k,v) { setEditForm(f=>({...f,[k]:v})); }

  async function handleSave() {
    if (!form.nome||!form.sigla) return;
    setSaving(true);
    await onSave({ ...form, resp_grafica_id: form.resp_grafica_id||null });
    setForm({ area_id: aree[0]?.id||"", nome:"", sigla:"", resp_grafica_id:"", ref_coworker:"" });
    setSaving(false);
    setTab("lista");
  }

  async function handleUpdate(id) {
    setSaving(true);
    await onUpdate(id, { nome: editForm.nome, sigla: editForm.sigla, resp_grafica_id: editForm.resp_grafica_id||null, ref_coworker: editForm.ref_coworker });
    setSaving(false);
    setEditId(null);
  }

  async function handleArchivia(id) {
    setSaving(true);
    await onArchivia(id);
    setSaving(false);
    setConfirmArch(null);
  }

  const progettiAttivi = progetti.filter(p => !p.archiviato);

  return (
    <Modal title="Gestione progetti" onClose={onClose}>
      <div style={{ display:"flex", gap:6, marginBottom:20, background:P.canvas, borderRadius:10, padding:4 }}>
        {[{id:"lista",label:"Progetti attivi"},{id:"nuovo",label:"+ Nuovo"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:"7px 0", background:tab===t.id?P.terra:"transparent",
            color:tab===t.id?P.ecru:P.terra, border:"none", borderRadius:7,
            fontSize:12, fontWeight:700, cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="lista" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {progettiAttivi.map(p => {
            const area = aree.find(a=>a.id===p.area_id);
            const col = area?.colore_hex||"#C4B8A8";
            const resp = team.find(t=>t.id===p.resp_grafica_id);
            return (
              <div key={p.id}>
                {confirmArch===p.id ? (
                  <div style={{ background:"#FEF9E7", border:`1px solid #F0C040`, borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:12, color:P.terra, marginBottom:10 }}>Archiviare <strong>{p.nome}</strong>?</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setConfirmArch(null)} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:8, padding:"7px 0", fontSize:12, cursor:"pointer" }}>Annulla</button>
                      <button onClick={()=>handleArchivia(p.id)} disabled={saving} style={{ flex:1, background:"#E67E22", border:"none", borderRadius:8, padding:"7px 0", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>Archivia</button>
                    </div>
                  </div>
                ) : editId===p.id ? (
                  <div style={{ background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <input value={editForm.nome} onChange={e=>setEF("nome",e.target.value)} placeholder="Nome" style={{...inputStyle, flex:2}} />
                      <input value={editForm.sigla} onChange={e=>setEF("sigla",e.target.value.toUpperCase().slice(0,3))} placeholder="Sigla" style={{...inputStyle, flex:1}} />
                    </div>
                    <input value={editForm.ref_coworker||""} onChange={e=>setEF("ref_coworker",e.target.value)} placeholder="Ref. coworker" style={{...inputStyle, marginBottom:8}} />
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setEditId(null)} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:8, padding:"7px 0", fontSize:12, cursor:"pointer" }}>Annulla</button>
                      <button onClick={()=>handleUpdate(p.id)} disabled={saving} style={{ flex:2, background:P.ruggine, border:"none", borderRadius:8, padding:"7px 0", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>Salva</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background:P.warm_white, border:`1px solid ${P.ecru}`, borderLeft:`4px solid ${col}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ background:col, color:textOnBg(col), borderRadius:5, padding:"2px 7px", fontSize:11, fontWeight:800 }}>{p.sigla}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:P.terra }}>{p.nome}</div>
                      <div style={{ fontSize:10, color:P.muschio }}>{area?.nome}{resp ? ` · ${resp.nome}` : ""}</div>
                    </div>
                    <button onClick={()=>{ setEditId(p.id); setEditForm({nome:p.nome, sigla:p.sigla, resp_grafica_id:p.resp_grafica_id||"", ref_coworker:p.ref_coworker||""}); }} style={{ background:"none", border:`1px solid ${P.ecru}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:P.muschio, cursor:"pointer" }}>✏️</button>
                    <button onClick={()=>setConfirmArch(p.id)} style={{ background:"none", border:`1px solid #F5C6C6`, borderRadius:6, padding:"4px 8px", fontSize:11, color:"#E67E22", cursor:"pointer" }}>📦</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab==="nuovo" && (
        <>
          <Field label="Area">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {aree.filter(a=>!a.archiviata).map(a => (
                <button key={a.id} onClick={()=>setF("area_id",a.id)} style={{
                  ...btnChip(form.area_id===a.id, a.colore_hex, textOnBg(a.colore_hex)),
                  display:"flex", alignItems:"center", gap:5,
                }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:a.colore_hex }} />
                  {a.nome}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nome progetto">
            <input value={form.nome} onChange={e=>setF("nome",e.target.value)} placeholder="es. Sclerosi Multipla" style={inputStyle} />
          </Field>
          <Field label="Sigla (max 3 caratteri)">
            <input value={form.sigla} onChange={e=>setF("sigla",e.target.value.toUpperCase().slice(0,3))} placeholder="es. SM" style={inputStyle} />
          </Field>
          <Field label="Responsabile grafica">
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[{id:"",nome:"—"}, ...team].map(t => (
                <button key={t.id} onClick={()=>setF("resp_grafica_id",t.id)} style={btnChip(form.resp_grafica_id===t.id, P.muschio)}>{t.nome}</button>
              ))}
            </div>
          </Field>
          <Field label="Referente coworker">
            <input value={form.ref_coworker} onChange={e=>setF("ref_coworker",e.target.value)} placeholder="es. Dr. Bianchi" style={inputStyle} />
          </Field>
          <button onClick={handleSave} disabled={saving||!form.nome||!form.sigla} style={btnPrimary(saving||!form.nome||!form.sigla)}>
            {saving ? "Salvataggio…" : "Aggiungi progetto"}
          </button>
        </>
      )}
    </Modal>
  );
}

// ── MODAL NUOVO PROGETTO ──────────────────────────────────────────────────────
function NuovoProgettoModal({ onClose, onSave, aree, team }) {
  const [form, setForm] = useState({ area_id: aree[0]?.id||"", nome:"", sigla:"", resp_grafica_id:"", ref_coworker:"" });
  const [saving, setSaving] = useState(false);
  function set(k,v) { setForm(f=>({...f,[k]:v})); }

  async function handleSave() {
    if (!form.nome||!form.sigla) return;
    setSaving(true);
    await onSave({ ...form, resp_grafica_id: form.resp_grafica_id||null });
    setSaving(false);
  }

  return (
    <Modal title="Nuovo progetto" onClose={onClose}>
      <Field label="Area">
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {aree.map(a => {
            const sel = form.area_id===a.id;
            return (
              <button key={a.id} onClick={()=>set("area_id",a.id)} style={{
                ...btnChip(sel, a.colore_hex, textOnBg(a.colore_hex)),
                display:"flex", alignItems:"center", gap:5,
              }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:a.colore_hex }} />
                {a.nome}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Nome progetto">
        <input value={form.nome} onChange={e=>set("nome",e.target.value)} placeholder="es. Sclerosi Multipla" style={inputStyle} />
      </Field>
      <Field label="Sigla (max 3 caratteri)">
        <input value={form.sigla} onChange={e=>set("sigla",e.target.value.toUpperCase().slice(0,3))} placeholder="es. SM" style={inputStyle} />
      </Field>
      <Field label="Responsabile grafica">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[{id:"",nome:"—"}, ...team].map(t => (
            <button key={t.id} onClick={()=>set("resp_grafica_id",t.id)} style={btnChip(form.resp_grafica_id===t.id, P.muschio)}>
              {t.nome}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Referente coworker (esterno)">
        <input value={form.ref_coworker} onChange={e=>set("ref_coworker",e.target.value)} placeholder="es. Dr. Bianchi" style={inputStyle} />
      </Field>
      <button onClick={handleSave} disabled={saving||!form.nome||!form.sigla} style={btnPrimary(saving||!form.nome||!form.sigla)}>
        {saving ? "Salvataggio…" : "Aggiungi progetto"}
      </button>
    </Modal>
  );
}

// ── MODAL DETTAGLIO POST (con modifica completa + elimina) ───────────────────
function PostModal({ post, onClose, onUpdate, onDelete, aree, team, progetti }) {
  if (!post) return null;
  const [mode, setMode] = useState("view"); // view | edit
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    titolo: post.titolo,
    data_pubblicazione: post.data_pubblicazione,
    area_id: post.area_id,
    progetto_id: post.progetto_id || "",
    responsabile_id: post.responsabile_id || "",
    stato: post.stato,
    note: post.note || "",
  });

  const area = aree.find(a => a.id === (mode==="edit" ? form.area_id : post.area_id));
  const col = area?.colore_hex || "#C4B8A8";
  const progetto = progetti.find(p => p.id === post.progetto_id);
  const responsabile = team.find(t => t.id === post.responsabile_id);
  const progettiArea = progetti.filter(p => p.area_id === form.area_id);

  function setF(k,v) { setForm(f=>({...f,[k]:v})); }

  async function handleSave() {
    setSaving(true);
    await onUpdate(post.id, {
      ...form,
      progetto_id: form.progetto_id || null,
      responsabile_id: form.responsabile_id || null,
    });
    setSaving(false);
    setMode("view");
  }

  async function handleDelete() {
    setSaving(true);
    await onDelete(post.id);
    setSaving(false);
    onClose();
  }

  async function quickUpdateStato(statoId) {
    setSaving(true);
    await onUpdate(post.id, { stato: statoId });
    setSaving(false);
  }

  if (confirmDelete) return (
    <Modal title="Elimina contenuto" onClose={()=>setConfirmDelete(false)}>
      <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
        <div style={{ fontSize:14, color:P.terra, marginBottom:6, fontWeight:600 }}>Vuoi eliminare questo contenuto?</div>
        <div style={{ fontSize:12, color:"#9A8E84", marginBottom:24 }}>"{post.titolo}"</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setConfirmDelete(false)} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:P.terra }}>
            Annulla
          </button>
          <button onClick={handleDelete} disabled={saving} style={{ flex:1, background:"#C0392B", border:"none", borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#fff" }}>
            {saving ? "…" : "Elimina"}
          </button>
        </div>
      </div>
    </Modal>
  );

  if (mode === "edit") return (
    <Modal title="Modifica contenuto" onClose={()=>setMode("view")}>
      <Field label="Titolo / tema">
        <input value={form.titolo} onChange={e=>setF("titolo",e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Data di pubblicazione">
        <input type="date" value={form.data_pubblicazione} onChange={e=>setF("data_pubblicazione",e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Area">
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {aree.map(a => (
            <button key={a.id} onClick={()=>{ setF("area_id",a.id); setF("progetto_id",""); }} style={{
              ...btnChip(form.area_id===a.id, a.colore_hex, textOnBg(a.colore_hex)),
              display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:a.colore_hex }} />
              {a.nome}
            </button>
          ))}
        </div>
      </Field>
      {progettiArea.length > 0 && (
        <Field label="Progetto">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <button onClick={()=>setF("progetto_id","")} style={btnChip(form.progetto_id==="")}>Nessuno</button>
            {progettiArea.map(p => (
              <button key={p.id} onClick={()=>setF("progetto_id",p.id)}
                style={btnChip(form.progetto_id===p.id, area?.colore_hex||P.terra, textOnBg(area?.colore_hex||P.terra))}>
                {p.sigla} — {p.nome}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Responsabile">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[{id:"",nome:"— nessuno —"}, ...team].map(t => (
            <button key={t.id} onClick={()=>setF("responsabile_id",t.id)} style={btnChip(form.responsabile_id===t.id, P.muschio)}>
              {t.nome}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Stato">
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {STATI.map(s => (
            <button key={s.id} onClick={()=>setF("stato",s.id)} style={{
              background: form.stato===s.id ? s.dot : s.bg,
              color: form.stato===s.id ? "#fff" : s.text,
              border:`1px solid ${s.dot}`, borderRadius:16,
              padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
            }}>{s.label}</button>
          ))}
        </div>
      </Field>
      <Field label="Note">
        <textarea value={form.note} onChange={e=>setF("note",e.target.value)} rows={2} style={{...inputStyle, resize:"vertical"}} />
      </Field>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <button onClick={()=>setMode("view")} style={{ flex:1, background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:P.terra }}>
          Annulla
        </button>
        <button onClick={handleSave} disabled={saving||!form.titolo} style={{ flex:2, background:saving||!form.titolo?"#C4B8A8":P.ruggine, border:"none", borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>
          {saving ? "Salvataggio…" : "Salva modifiche"}
        </button>
      </div>
    </Modal>
  );

  return (
    <Modal title="" onClose={onClose}>
      <div style={{ height:4, borderRadius:4, background:col, marginBottom:16, marginTop:-8 }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <span style={{ width:9, height:9, borderRadius:"50%", background:col }} />
            <span style={{ fontSize:11, color:P.muschio, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>
              {area?.nome}{progetto ? ` · ${progetto.sigla}` : ""}
            </span>
          </div>
          <div style={{ fontSize:17, fontWeight:700, color:P.terra, lineHeight:1.3 }}>{post.titolo}</div>
        </div>
        <div style={{ display:"flex", gap:6, marginLeft:8 }}>
          <button onClick={()=>setMode("edit")} style={{ background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:7, padding:"5px 10px", fontSize:11, color:P.muschio, cursor:"pointer" }}>✏️ Modifica</button>
          <button onClick={()=>setConfirmDelete(true)} style={{ background:"none", border:`1px solid #F5C6C6`, borderRadius:7, padding:"5px 10px", fontSize:11, color:"#C0392B", cursor:"pointer" }}>🗑️</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:"#7A6E65" }}>📅 {post.data_pubblicazione?.split("-").reverse().join("/")}</span>
        {post.stato !== "pubblicato" && post.data_pubblicazione && <ScadenzaChip dataStr={post.data_pubblicazione} />}
        {responsabile && <span style={{ fontSize:12, color:"#7A6E65" }}>👤 {responsabile.nome}</span>}
      </div>

      {post.note && (
        <div style={{ background:P.canvas, borderRadius:8, padding:"8px 12px", marginBottom:16, fontSize:12, color:"#6B5E4E" }}>{post.note}</div>
      )}

      <div style={{ borderTop:`1px solid ${P.ecru}`, margin:"16px 0" }} />

      <div>
        <div style={{ fontSize:11, color:"#9A8E84", marginBottom:8, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Aggiorna stato</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {STATI.map(st => (
            <button key={st.id} onClick={()=>quickUpdateStato(st.id)} disabled={saving} style={{
              background: st.id===post.stato ? st.dot : st.bg,
              color: st.id===post.stato ? "#fff" : st.text,
              border:`1px solid ${st.dot}`, borderRadius:20,
              padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer",
              opacity: saving ? 0.6 : 1,
            }}>{st.label}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── PANNELLO SIGLE ────────────────────────────────────────────────────────────
function PannelloSigle({ progetti, aree, team, onAggiungi }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: expanded ? 12 : 10 }}>
        <button onClick={()=>setExpanded(e=>!e)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:P.muschio, letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Sigle progetti ({progetti.length})
          </span>
          <span style={{ fontSize:12, color:P.muschio }}>{expanded ? "▲" : "▼"}</span>
        </button>
        <button onClick={onAggiungi} style={{ background:"none", border:`1px dashed ${P.ecru}`, borderRadius:7, padding:"4px 10px", fontSize:11, color:"#A89880", cursor:"pointer" }}>
          + Aggiungi
        </button>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {progetti.map(p => {
          const area = aree.find(a => a.id === p.area_id);
          const col = area?.colore_hex || "#C4B8A8";
          return (
            <div key={p.id} style={{ display:"inline-flex", alignItems:"center", gap:6, background:P.warm_white, border:`2px solid ${col}`, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ background:col, color:textOnBg(col), borderRadius:5, padding:"1px 6px", fontSize:11, fontWeight:800 }}>{p.sigla}</span>
              <span style={{ fontSize:11, color:P.terra, fontWeight:600 }}>{p.nome}</span>
            </div>
          );
        })}
      </div>

      {expanded && (
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
          {progetti.map(p => {
            const area = aree.find(a => a.id === p.area_id);
            const col = area?.colore_hex || "#C4B8A8";
            const respGrafica = team.find(t => t.id === p.resp_grafica_id);
            return (
              <div key={p.id} style={{ background:P.warm_white, borderLeft:`4px solid ${col}`, borderRadius:8, padding:"10px 14px", display:"grid", gridTemplateColumns:"auto 1fr 1fr 1fr", gap:"8px 16px", alignItems:"center" }}>
                <span style={{ background:col, color:textOnBg(col), borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:800 }}>{p.sigla}</span>
                <div>
                  <div style={{ fontSize:10, color:"#9A8E84", marginBottom:2 }}>Progetto</div>
                  <div style={{ fontSize:12, fontWeight:700, color:P.terra }}>{p.nome}</div>
                  <div style={{ fontSize:10, color:P.muschio }}>{area?.nome}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:"#9A8E84", marginBottom:2 }}>Resp. grafica</div>
                  <div style={{ fontSize:12, color:P.terra }}>{respGrafica?.nome || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:"#9A8E84", marginBottom:2 }}>Ref. coworker</div>
                  <div style={{ fontSize:12, color:P.terra }}>{p.ref_coworker || "—"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── VISTA TIMELINE ────────────────────────────────────────────────────────────
function VistaTimeline({ posts, year, month, onPostClick, onCellClick, aree, progetti }) {
  const days = daysInMonth(year, month);
  const oggi = new Date();
  const oggiDay = (oggi.getFullYear()===year && oggi.getMonth()===month) ? oggi.getDate() : null;

  const postMap = {};
  posts.forEach(p => {
    const d = parseInt(p.data_pubblicazione?.split("-")[2]);
    const key = `${p.area_id}__${d}`;
    if (!postMap[key]) postMap[key] = [];
    postMap[key].push(p);
  });

  const COL_AREA = 126, COL_DAY = 38;

  return (
    <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${P.ecru}` }}>
      <div style={{ minWidth: COL_AREA + days * COL_DAY }}>
        <div style={{ display:"flex", background:P.terra, borderRadius:"11px 11px 0 0" }}>
          <div style={{ width:COL_AREA, flexShrink:0, padding:"10px 12px", fontSize:10, color:P.ecru, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Area</div>
          {Array.from({length:days},(_,i)=>i+1).map(d => {
            const wd = new Date(year,month,d).getDay();
            const we = wd===0||wd===6;
            const isOggi = d===oggiDay;
            return (
              <div key={d} style={{ width:COL_DAY, flexShrink:0, textAlign:"center", padding:"6px 2px", background:isOggi?P.ruggine:"transparent", borderRadius:isOggi?6:0 }}>
                <div style={{ fontSize:9, color:we?"#8A7A6A":"#C4B8A8", marginBottom:2 }}>{GIORNI_IT[wd]}</div>
                <div style={{ fontSize:11, fontWeight:700, color:isOggi?"#fff":we?"#8A7A6A":P.ecru }}>{d}</div>
              </div>
            );
          })}
        </div>

        {aree.map((area, ai) => (
          <div key={area.id} style={{ display:"flex", background:ai%2===0?P.warm_white:P.canvas, borderTop:`1px solid ${P.ecru}`, minHeight:48, alignItems:"stretch" }}>
            <div style={{ width:COL_AREA, flexShrink:0, padding:"8px 12px", fontSize:11, fontWeight:700, color:P.terra, borderRight:`3px solid ${area.colore_hex}`, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:area.colore_hex, flexShrink:0 }} />
              {area.nome}
            </div>
            {Array.from({length:days},(_,i)=>i+1).map(d => {
              const we = isWeekend(year,month,d);
              const key = `${area.id}__${d}`;
              const cellPosts = postMap[key]||[];
              return (
                <div key={d}
                  onClick={()=>{ if(cellPosts.length===0) onCellClick(area.id, d); }}
                  style={{ width:COL_DAY, flexShrink:0, borderRight:`1px solid ${P.ecru}44`, background:we?"#F0EDE744":"transparent", padding:"3px 2px", display:"flex", flexDirection:"column", gap:2, alignItems:"stretch", cursor:cellPosts.length===0?"cell":"default" }}>
                  {cellPosts.map(p => {
                    const s = statoById(p.stato);
                    const prog = progetti.find(pr => pr.id === p.progetto_id);
                    return (
                      <div key={p.id}
                        onClick={e=>{ e.stopPropagation(); onPostClick(p); }}
                        title={`${p.titolo}${prog?` [${prog.sigla}]`:""} · ${s.label}`}
                        style={{ background:s.dot, borderRadius:4, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff" }}
                        onMouseEnter={e=>e.currentTarget.style.opacity="0.72"}
                        onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                      >
                        {prog?.sigla || "●"}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VISTA LISTA ───────────────────────────────────────────────────────────────
function VistaLista({ posts, onPostClick, aree, team, progetti }) {
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroArea,  setFiltroArea]  = useState("tutte");

  const filtrati = posts
    .filter(p => filtroStato==="tutti" || p.stato===filtroStato)
    .filter(p => filtroArea==="tutte"  || p.area_id===filtroArea)
    .sort((a,b) => (a.data_pubblicazione||"").localeCompare(b.data_pubblicazione||""));

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <select value={filtroStato} onChange={e=>setFiltroStato(e.target.value)} style={selStyle}>
          <option value="tutti">Tutti gli stati</option>
          {STATI.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={filtroArea} onChange={e=>setFiltroArea(e.target.value)} style={selStyle}>
          <option value="tutte">Tutte le aree</option>
          {aree.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtrati.length===0 && <div style={{ textAlign:"center", color:"#A89880", padding:32, fontSize:13 }}>Nessun contenuto trovato</div>}
        {filtrati.map(p => {
          const area = aree.find(a=>a.id===p.area_id);
          const col = area?.colore_hex||"#C4B8A8";
          const prog = progetti.find(pr=>pr.id===p.progetto_id);
          const resp = team.find(t=>t.id===p.responsabile_id);
          const parts = p.data_pubblicazione?.split("-")||[];
          return (
            <div key={p.id} onClick={()=>onPostClick(p)} style={{ background:P.warm_white, border:`1px solid ${P.ecru}`, borderLeft:`4px solid ${col}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ flexShrink:0, width:40, textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:800, color:P.terra, lineHeight:1 }}>{parts[2]}</div>
                <div style={{ fontSize:10, color:"#A89880" }}>{MESI_IT[parseInt(parts[1])-1]?.slice(0,3)}</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:P.muschio, fontWeight:600, marginBottom:2 }}>
                  {area?.nome}{prog ? ` · ${prog.sigla}` : ""}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:P.terra, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.titolo}</div>
                {resp && <div style={{ fontSize:11, color:"#9A8E84", marginTop:2 }}>👤 {resp.nome}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <StatoBadge id={p.stato} small />
                {p.stato!=="pubblicato" && p.data_pubblicazione && <ScadenzaChip dataStr={p.data_pubblicazione} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VISTA TODO ────────────────────────────────────────────────────────────────
function VistaTodo({ posts, onPostClick, aree, team, progetti }) {
  const [personaId, setPersonaId] = useState(team[0]?.id||"");

  const mieiPost = posts
    .filter(p => p.responsabile_id===personaId && p.stato!=="pubblicato")
    .sort((a,b)=>(a.data_pubblicazione||"").localeCompare(b.data_pubblicazione||""));

  const pubblicati = posts
    .filter(p => p.responsabile_id===personaId && p.stato==="pubblicato")
    .sort((a,b)=>(b.data_pubblicazione||"").localeCompare(a.data_pubblicazione||""));

  const counts = {};
  STATI.forEach(s => { counts[s.id] = mieiPost.filter(p=>p.stato===s.id).length; });

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:24, background:P.canvas, borderRadius:12, padding:6, border:`1px solid ${P.ecru}` }}>
        {team.map(t => (
          <button key={t.id} onClick={()=>setPersonaId(t.id)} style={{
            flex:1, padding:"8px 0",
            background: personaId===t.id ? P.terra : "transparent",
            color: personaId===t.id ? P.ecru : P.terra,
            border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer",
          }}>{t.nome}</button>
        ))}
      </div>

      {mieiPost.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {STATI.filter(s=>s.id!=="pubblicato").map(s => counts[s.id]>0 && (
            <div key={s.id} style={{ background:s.bg, border:`1px solid ${s.dot}44`, borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:s.dot }} />
              <span style={{ fontSize:11, color:s.text, fontWeight:600 }}>{counts[s.id]} {s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:12, fontWeight:700, color:P.muschio, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
          In carico ({mieiPost.length})
        </div>
        {mieiPost.length===0 ? (
          <div style={{ background:P.canvas, border:`1px dashed ${P.ecru}`, borderRadius:12, padding:32, textAlign:"center", color:"#A89880", fontSize:13 }}>
            Nessun contenuto in carico ✓
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {mieiPost.map(p => {
              const s = statoById(p.stato);
              const area = aree.find(a=>a.id===p.area_id);
              const col = area?.colore_hex||"#C4B8A8";
              const prog = progetti.find(pr=>pr.id===p.progetto_id);
              const g = p.data_pubblicazione ? giorniA(p.data_pubblicazione) : 99;
              const urgente = g>=0 && g<=3;
              return (
                <div key={p.id} onClick={()=>onPostClick(p)} style={{ background:P.warm_white, border:`1px solid ${urgente?"#F0C040":P.ecru}`, borderLeft:`4px solid ${col}`, borderRadius:10, padding:"14px 16px", cursor:"pointer", boxShadow:urgente?"0 0 0 2px #F0C04022":"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <span style={{ width:8, height:8, borderRadius:"50%", background:col }} />
                        <span style={{ fontSize:11, color:P.muschio, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                          {area?.nome}{prog ? ` · ${prog.sigla}` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:P.terra, lineHeight:1.3, marginBottom:8 }}>{p.titolo}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <StatoBadge id={p.stato} small />
                        {p.data_pubblicazione && <span style={{ fontSize:11, color:"#9A8E84" }}>📅 {p.data_pubblicazione.split("-").reverse().join("/")}</span>}
                      </div>
                    </div>
                    {p.data_pubblicazione && <ScadenzaChip dataStr={p.data_pubblicazione} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pubblicati.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#9A8E84", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>Pubblicati di recente</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {pubblicati.slice(0,3).map(p => {
              const area = aree.find(a=>a.id===p.area_id);
              const col = area?.colore_hex||"#C4B8A8";
              return (
                <div key={p.id} onClick={()=>onPostClick(p)} style={{ background:P.canvas, border:`1px solid ${P.ecru}`, borderLeft:`3px solid ${col}`, borderRadius:8, padding:"10px 14px", cursor:"pointer", display:"flex", gap:12, alignItems:"center", opacity:0.8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:col }} />
                  <div style={{ flex:1, fontSize:12, color:P.terra, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.titolo}</div>
                  <StatoBadge id={p.stato} small />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ pagina, setPagina }) {
  const tabs = [
    { id:"calendario", icon:"▦", label:"Calendario" },
    { id:"lista",      icon:"☰", label:"Lista" },
    { id:"todo",       icon:"✓", label:"Le mie task" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:P.terra, borderTop:`1px solid #3A2E24`, display:"flex", zIndex:50 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>setPagina(t.id)} style={{ flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:pagina===t.id?P.ruggine:"#7A6A5A" }}>
          <span style={{ fontSize:18, lineHeight:1 }}>{t.icon}</span>
          <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

const selStyle = { background:P.canvas, border:`1px solid ${P.ecru}`, borderRadius:8, padding:"6px 10px", fontSize:12, color:P.terra, fontFamily:"inherit", cursor:"pointer" };
const navBtn = { background:P.warm_white, border:`1px solid ${P.ecru}`, borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:P.terra };

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [aree,     setAree]     = useState([]);
  const [team,     setTeam]     = useState([]);
  const [progetti, setProgetti] = useState([]);
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);

  const [pagina,      setPagina]      = useState("calendario");
  const [vistaCalend, setVistaCalend] = useState("timeline");
  const [meseIdx,     setMeseIdx]     = useState(new Date().getMonth());
  const [postSel,     setPostSel]     = useState(null);

  const [showNuovoPost,      setShowNuovoPost]      = useState(false);
  const [showGestioneAree,   setShowGestioneAree]   = useState(false);
  const [showGestioneProj,   setShowGestioneProj]   = useState(false);
  const [prefillAreaId,      setPrefillAreaId]      = useState(null);
  const [prefillData,        setPrefillData]        = useState(null);

  const year = 2026;

  function showToast(msg) { setToast(msg); }

  // ── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [a, t, pr, po] = await Promise.all([
          sb("aree?select=*&order=nome"),
          sb("team?select=*&order=nome"),
          sb("progetti?select=*&order=nome"),
          sb("posts?select=*&order=data_pubblicazione"),
        ]);
        setAree(a||[]);
        setTeam(t||[]);
        setProgetti(pr||[]);
        setPosts(po||[]);
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered active only
  const areeAttive = aree.filter(a => !a.archiviata);
  const progettiAttivi = progetti.filter(p => !p.archiviato);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async function savePost(form) {
    const res = await sb("posts", { method:"POST", body: JSON.stringify(form) });
    if (res?.length) {
      setPosts(prev => [...prev, res[0]]);
      setShowNuovoPost(false);
      showToast("Contenuto aggiunto ✓");
    }
  }

  async function deletePost(id) {
    await sb(`posts?id=eq.${id}`, { method:"DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
    setPostSel(null);
    showToast("Contenuto eliminato");
  }

  async function updateArea(id, changes) {
    const res = await sb(`aree?id=eq.${id}`, { method:"PATCH", body: JSON.stringify(changes) });
    if (res?.length) setAree(prev => prev.map(a => a.id===id ? {...a,...changes} : a));
  }

  async function archiviaArea(id) {
    await updateArea(id, { archiviata: true });
    showToast("Area archiviata");
  }

  async function updateProgetto(id, changes) {
    const res = await sb(`progetti?id=eq.${id}`, { method:"PATCH", body: JSON.stringify(changes) });
    if (res?.length) setProgetti(prev => prev.map(p => p.id===id ? {...p,...changes} : p));
  }

  async function archiviaProgetto(id) {
    await updateProgetto(id, { archiviato: true });
    showToast("Progetto archiviato");
  }

  async function updatePost(id, changes) {
    const res = await sb(`posts?id=eq.${id}`, { method:"PATCH", body: JSON.stringify(changes) });
    if (res?.length) {
      setPosts(prev => prev.map(p => p.id===id ? {...p,...changes} : p));
      setPostSel(prev => prev?.id===id ? {...prev,...changes} : prev);
    }
  }

  async function saveArea(nome, colore_hex) {
    const res = await sb("aree", { method:"POST", body: JSON.stringify({nome, colore_hex}) });
    if (res?.length) {
      setAree(prev => [...prev, res[0]]);
      setShowNuovaArea(false);
      showToast("Area aggiunta ✓");
    }
  }

  async function saveProgetto(form) {
    const res = await sb("progetti", { method:"POST", body: JSON.stringify(form) });
    if (res?.length) {
      setProgetti(prev => [...prev, res[0]]);
      setShowNuovoProgetto(false);
      showToast("Progetto aggiunto ✓");
    }
  }

  function handleCellClick(area_id, day) {
    setPrefillAreaId(area_id);
    setPrefillData(padDate(year, meseIdx, day));
    setShowNuovoPost(true);
  }

  const postsMese = posts.filter(p => {
    const m = p.data_pubblicazione ? parseInt(p.data_pubblicazione.split("-")[1])-1 : -1;
    return m === meseIdx;
  });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:P.nebbia, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center" }}>
        <Spinner />
        <div style={{ marginTop:12, color:P.muschio, fontSize:13 }}>Caricamento calendario…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", background:P.nebbia, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"system-ui" }}>
      <div style={{ background:P.warm_white, borderRadius:12, padding:24, maxWidth:400, textAlign:"center" }}>
        <div style={{ fontSize:24, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:14, fontWeight:700, color:P.terra, marginBottom:8 }}>Errore di connessione</div>
        <div style={{ fontSize:12, color:"#7A6E65" }}>{error}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:P.nebbia, fontFamily:"'Jost', system-ui, sans-serif", color:P.terra, paddingBottom:72 }}>

      {/* TOPBAR */}
      <div style={{ background:P.terra, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:P.ruggine, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📅</div>
          <span style={{ fontSize:14, fontWeight:700, color:"#DDD5C5" }}>Calendario Editoriale</span>
        </div>
        {pagina==="calendario" && (
          <div style={{ display:"flex", gap:6 }}>
            {[{id:"timeline",icon:"▦"},{id:"lista",icon:"☰"}].map(v => (
              <button key={v.id} onClick={()=>setVistaCalend(v.id)} style={{ background:vistaCalend===v.id?P.ruggine:"transparent", border:`1px solid ${vistaCalend===v.id?P.ruggine:"#5A4A3A"}`, color:vistaCalend===v.id?"#fff":"#C4B8A8", borderRadius:7, padding:"5px 10px", cursor:"pointer", fontSize:13, fontWeight:600 }}>{v.icon}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 16px" }}>

        {pagina==="calendario" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <button onClick={()=>setMeseIdx(m=>Math.max(0,m-1))} style={{...navBtn, opacity:meseIdx===0?0.3:1}}>←</button>
              <div style={{ fontSize:20, fontWeight:800, color:P.terra, flex:1, textAlign:"center" }}>{MESI_IT[meseIdx]} {year}</div>
              <button onClick={()=>setMeseIdx(m=>Math.min(11,m+1))} style={{...navBtn, opacity:meseIdx===11?0.3:1}}>→</button>
            </div>

            <PannelloSigle progetti={progettiAttivi} aree={areeAttive} team={team} onAggiungi={()=>setShowGestioneProj(true)} />

            {vistaCalend==="timeline"
              ? <>
                  <VistaTimeline posts={postsMese} year={year} month={meseIdx} onPostClick={setPostSel} onCellClick={handleCellClick} aree={areeAttive} progetti={progettiAttivi} />
                  <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
                    {STATI.map(s => (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:12, height:12, borderRadius:3, background:s.dot }} />
                        <span style={{ fontSize:11, color:"#7A6E65" }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              : <VistaLista posts={postsMese} onPostClick={setPostSel} aree={areeAttive} team={team} progetti={progettiAttivi} />
            }
          </>
        )}

        {pagina==="lista" && (
          <VistaLista posts={posts} onPostClick={setPostSel} aree={areeAttive} team={team} progetti={progettiAttivi} />
        )}

        {pagina==="todo" && (
          <VistaTodo posts={posts} onPostClick={setPostSel} aree={areeAttive} team={team} progetti={progettiAttivi} />
        )}
      </div>

      {/* FAB */}
      <div style={{ position:"fixed", bottom:82, right:20, display:"flex", flexDirection:"column", gap:10, zIndex:60 }}>
        <button onClick={()=>setShowGestioneAree(true)} title="Gestione aree" style={{ width:44, height:44, borderRadius:"50%", background:P.muschio, color:"#fff", border:"none", fontSize:11, fontWeight:800, cursor:"pointer", boxShadow:`0 4px 12px ${P.muschio}55` }}>+A</button>
        <button onClick={()=>{ setPrefillAreaId(null); setPrefillData(null); setShowNuovoPost(true); }} title="Nuovo contenuto" style={{ width:52, height:52, borderRadius:"50%", background:P.ruggine, color:"#fff", border:"none", fontSize:26, fontWeight:300, cursor:"pointer", boxShadow:`0 4px 16px ${P.ruggine}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
      </div>

      <BottomNav pagina={pagina} setPagina={setPagina} />

      {/* MODALI */}
      {showNuovoPost && (
        <NuovoPostModal
          onClose={()=>setShowNuovoPost(false)} onSave={savePost}
          aree={areeAttive} progetti={progettiAttivi} team={team}
          prefillAreaId={prefillAreaId} prefillData={prefillData}
        />
      )}
      {showGestioneAree && (
        <GestioneAreeModal
          onClose={()=>setShowGestioneAree(false)}
          aree={aree} onSave={saveArea} onUpdate={updateArea} onArchivia={archiviaArea}
        />
      )}
      {showGestioneProj && (
        <GestioneProgettiModal
          onClose={()=>setShowGestioneProj(false)}
          progetti={progetti} aree={areeAttive} team={team}
          onSave={saveProgetto} onUpdate={updateProgetto} onArchivia={archiviaProgetto}
        />
      )}
      {postSel && <PostModal post={postSel} onClose={()=>setPostSel(null)} onUpdate={updatePost} onDelete={deletePost} aree={aree} team={team} progetti={progetti} />}

      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
    </div>
  );
}
