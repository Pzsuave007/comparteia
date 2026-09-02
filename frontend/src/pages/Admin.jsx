import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, User, MapPin, Scroll, HelpCircle, Upload, Download, FileSpreadsheet, LogOut, Lock } from "lucide-react";
import { BACKEND } from "@/useRoom";
import { toast } from "sonner";

const API = `${BACKEND}/api`;
const TOKEN_KEY = "abp_admin_token";

const api = axios.create({ baseURL: API });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const EMPTY_ENTITY = (cat) => ({
  id: "", category: cat, active: true, image: "", references: [],
  translations: { es: { name: "", description: "" }, en: { name: "", description: "" } },
  clues: { es: [], en: [] }, map_position: { x: 50, y: 50 },
});
const EMPTY_Q = () => ({
  id: "", category: "character", related_entity_id: "", rank: "explorer",
  correct_answer: "A", bible_reference: "", active: true,
  translations: {
    es: { question: "", answer_a: "", answer_b: "", answer_c: "", answer_d: "", explanation: "" },
    en: { question: "", answer_a: "", answer_b: "", answer_c: "", answer_d: "", explanation: "" },
  },
});

export default function Admin() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(!!localStorage.getItem(TOKEN_KEY));
  const [tab, setTab] = useState("questions");

  useEffect(() => {
    if (!authed) return;
    api.get("/admin/me").catch(() => { localStorage.removeItem(TOKEN_KEY); setAuthed(false); });
  }, [authed]);

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setAuthed(false); };

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} nav={nav} />;

  return (
    <div className="min-h-screen bg-midnight grain text-parchment">
      <div className="border-b border-bronze/20 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 bg-midnight/90 backdrop-blur">
        <button data-testid="admin-back" onClick={() => nav("/")} className="text-sand/60 hover:text-bronze"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-display text-xl tracking-widest text-bronze">ADMIN · ARCHIVO BÍBLICO</h1>
        <button data-testid="admin-logout" onClick={logout} className="ml-auto text-sand/60 hover:text-incorrect flex items-center gap-2 text-sm"><LogOut className="w-4 h-4" /> Salir</button>
      </div>
      <div className="flex gap-2 p-6 flex-wrap">
        {[{ id: "questions", l: "Preguntas", icon: HelpCircle }, { id: "character", l: "Personajes", icon: User },
          { id: "location", l: "Lugares", icon: MapPin }, { id: "event", l: "Acontecimientos", icon: Scroll }].map((t) => (
          <button key={t.id} data-testid={`admin-tab-${t.id}`} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${tab === t.id ? "bg-bronze text-midnight" : "glass text-parchment border border-bronze/30"}`}>
            <t.icon className="w-4 h-4" /> {t.l}
          </button>
        ))}
      </div>
      <div className="px-6 pb-20">
        {tab === "questions" ? <QuestionsAdmin /> : <EntityAdmin category={tab} />}
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess, nav }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const { data } = await axios.post(`${API}/admin/login`, { username, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      onSuccess();
    } catch (e) {
      setErr(e.response?.status === 401 ? "Usuario o contraseña incorrectos" : "Error al iniciar sesión");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-midnight grain text-parchment flex items-center justify-center px-6">
      <form onSubmit={submit} className="glass rounded-3xl p-8 border-bronze/30 w-full max-w-sm" data-testid="admin-login-form">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-bronze/20 border border-bronze/40 flex items-center justify-center"><Lock className="w-6 h-6 text-gold" /></div>
          <div>
            <h1 className="font-display text-lg tracking-widest text-bronze">PANEL DE ADMIN</h1>
            <p className="text-sand/50 text-xs">Archivo Bíblico Perdido</p>
          </div>
        </div>
        <label className="block mb-3">
          <span className="text-xs uppercase tracking-widest text-sand/60">Usuario</span>
          <input data-testid="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
            className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment outline-none focus:border-gold" />
        </label>
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-widest text-sand/60">Contraseña</span>
          <input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment outline-none focus:border-gold" />
        </label>
        {err && <p className="text-incorrect text-sm mb-3" data-testid="admin-login-error">{err}</p>}
        <button data-testid="admin-login-btn" disabled={busy} type="submit"
          className="btn-tactile w-full bg-gold text-midnight border-[#a9822f] font-bold rounded-xl px-6 py-3 disabled:opacity-50">
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <button type="button" onClick={() => nav("/")} className="w-full mt-3 text-sand/50 hover:text-bronze text-sm">Volver al inicio</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, testid, textarea }) {
  return (
    <label className="block mb-3">
      <span className="text-xs uppercase tracking-widest text-sand/60">{label}</span>
      {textarea ? (
        <textarea data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment outline-none focus:border-gold" />
      ) : (
        <input data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment outline-none focus:border-gold" />
      )}
    </label>
  );
}

async function downloadCsv(url, filename) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    const href = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = href; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(href);
  } catch {
    toast.error("No se pudo descargar");
  }
}

function EntityAdmin({ category }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_ENTITY(category));

  const load = async () => {
    const res = await api.get(`/admin/entities`, { params: { category } });
    setItems(res.data);
  };
  useEffect(() => { setForm(EMPTY_ENTITY(category)); load(); }, [category]);

  const save = async () => {
    if (!form.id) return toast.error("id requerido");
    const body = { ...form, references: typeof form.references === "string" ? form.references.split(",").map(s => s.trim()).filter(Boolean) : form.references };
    await api.post(`/admin/entities`, body);
    toast.success("Guardado");
    setForm(EMPTY_ENTITY(category));
    load();
  };
  const del = async (it) => { await api.delete(`/admin/entities/${category}/${it.id}`); toast.success("Eliminado"); load(); };

  const set = (path, val) => setForm((f) => {
    const c = JSON.parse(JSON.stringify(f));
    let o = c; const ks = path.split("."); for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val; return c;
  });

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-serif text-2xl mb-4">Editar / Crear</h2>
        <div className="glass rounded-2xl p-5 border-bronze/30">
          <Field label="ID (único)" testid="ent-id" value={form.id} onChange={(v) => set("id", v.toLowerCase().replace(/\s/g, "_"))} />
          <Field label="Imagen URL" testid="ent-img" value={form.image} onChange={(v) => set("image", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre (ES)" testid="ent-name-es" value={form.translations.es.name} onChange={(v) => set("translations.es.name", v)} />
            <Field label="Name (EN)" testid="ent-name-en" value={form.translations.en.name} onChange={(v) => set("translations.en.name", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Descripción (ES)" value={form.translations.es.description} onChange={(v) => set("translations.es.description", v)} />
            <Field label="Description (EN)" value={form.translations.en.description} onChange={(v) => set("translations.en.description", v)} />
          </div>
          {category === "location" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mapa X (%)" value={form.map_position.x} onChange={(v) => set("map_position.x", Number(v) || 0)} />
              <Field label="Mapa Y (%)" value={form.map_position.y} onChange={(v) => set("map_position.y", Number(v) || 0)} />
            </div>
          )}
          <Field label="Referencias (coma)" value={Array.isArray(form.references) ? form.references.join(", ") : form.references} onChange={(v) => set("references", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pistas ES (una por línea)" textarea value={(form.clues.es || []).join("\n")} onChange={(v) => set("clues.es", v.split("\n").filter(Boolean))} />
            <Field label="Clues EN (one per line)" textarea value={(form.clues.en || []).join("\n")} onChange={(v) => set("clues.en", v.split("\n").filter(Boolean))} />
          </div>
          <button data-testid="ent-save" onClick={save} className="btn-tactile mt-3 bg-gold text-midnight border-[#a9822f] font-bold rounded-xl px-6 py-3 flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl mb-4">{items.length} elementos</h2>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {items.map((it) => (
            <div key={it.id} className="glass rounded-xl p-3 border-bronze/20 flex items-center gap-3">
              {it.image && <img src={it.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="font-serif text-lg truncate">{it.translations?.es?.name} / {it.translations?.en?.name}</div>
                <div className="text-xs text-sand/50">{it.id}</div>
              </div>
              <button data-testid={`ent-edit-${it.id}`} onClick={() => setForm({ ...EMPTY_ENTITY(category), ...it, clues: it.clues || { es: [], en: [] }, map_position: it.map_position || { x: 50, y: 50 } })} className="text-bronze hover:text-gold text-sm">Editar</button>
              <button data-testid={`ent-del-${it.id}`} onClick={() => del(it)} className="text-incorrect/70 hover:text-incorrect"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CsvPanel({ onImported }) {
  const [cat, setCat] = useState("character");
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = replace ? `/admin/questions/import_csv?replace_category=${cat}` : `/admin/questions/import_csv`;
      const { data } = await api.post(url, fd);
      setResult(data);
      toast.success(`Importado: ${data.added} nuevas, ${data.updated} actualizadas`);
      onImported?.();
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Error al importar el CSV");
    } finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-2xl p-5 border-gold/30 mb-6" data-testid="csv-panel">
      <div className="flex items-center gap-2 mb-3">
        <FileSpreadsheet className="w-5 h-5 text-gold" />
        <h3 className="font-serif text-xl text-gold">Banco de preguntas por CSV</h3>
      </div>
      <p className="text-sand/60 text-sm mb-4">Sube tu archivo CSV para agregar o actualizar preguntas en bloque. Formato: <span className="text-parchment">question_id, entity_type, entity_id, difficulty, language, question, option_a…d, correct_answer, bible_reference, explanation, active</span></p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-sand/70">Categoría:
          <select data-testid="csv-cat" value={cat} onChange={(e) => setCat(e.target.value)}
            className="ml-2 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-1.5 text-parchment">
            {["character", "location", "event"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-sm text-sand/70 flex items-center gap-2 cursor-pointer">
          <input data-testid="csv-replace" type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="accent-gold w-4 h-4" />
          Reemplazar todas las preguntas de esta categoría
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <label data-testid="csv-import-btn" className={`btn-tactile bg-gold text-midnight border-[#a9822f] font-bold rounded-xl px-5 py-3 flex items-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="w-4 h-4" /> {busy ? "Importando…" : "Subir CSV"}
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
        <button data-testid="csv-template-btn" onClick={() => downloadCsv("/admin/questions/template", "plantilla_preguntas.csv")}
          className="btn-tactile glass border border-bronze/40 text-parchment rounded-xl px-5 py-3 flex items-center gap-2">
          <Download className="w-4 h-4" /> Descargar plantilla
        </button>
        <button data-testid="csv-export-btn" onClick={() => downloadCsv(`/admin/questions/export?category=${cat}`, `preguntas_${cat}.csv`)}
          className="btn-tactile glass border border-bronze/40 text-parchment rounded-xl px-5 py-3 flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar actual
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-xl border border-correct/40 bg-correct/10 p-4 text-sm" data-testid="csv-result">
          <p className="text-correct font-semibold">✅ Filas procesadas: {result.rows} · Nuevas: {result.added} · Actualizadas: {result.updated}{result.deleted ? ` · Eliminadas antes: ${result.deleted}` : ""}</p>
          {result.errors?.length > 0 && (
            <div className="mt-2 text-incorrect">
              <p className="font-semibold">{result.errors.length} fila(s) rechazada(s):</p>
              <ul className="list-disc pl-5">{result.errors.slice(0, 10).map((er, i) => <li key={i}>{er}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_Q());
  const load = async () => { const r = await api.get(`/admin/questions`); setItems(r.data); };
  useEffect(() => { load(); }, []);

  const set = (path, val) => setForm((f) => {
    const c = JSON.parse(JSON.stringify(f)); let o = c; const ks = path.split(".");
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; return c;
  });
  const save = async () => {
    if (!form.id) return toast.error("id requerido");
    await api.post(`/admin/questions`, form); toast.success("Guardado"); setForm(EMPTY_Q()); load();
  };
  const del = async (q) => { await api.delete(`/admin/questions/${q.id}`); toast.success("Eliminado"); load(); };

  const byCat = items.reduce((m, q) => { m[q.category] = (m[q.category] || 0) + 1; return m; }, {});

  return (
    <div>
      <CsvPanel onImported={load} />
      <div className="flex flex-wrap gap-2 mb-6 text-xs text-sand/60">
        <span className="glass px-3 py-1 rounded-full border border-bronze/20">Total: {items.length}</span>
        {["character", "location", "event", "general"].map((c) => byCat[c] ? <span key={c} className="glass px-3 py-1 rounded-full border border-bronze/20">{c}: {byCat[c]}</span> : null)}
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-serif text-2xl mb-4">Editar / Crear pregunta</h2>
          <div className="glass rounded-2xl p-5 border-bronze/30">
            <Field label="ID" testid="q-id" value={form.id} onChange={(v) => set("id", v)} />
            <div className="grid grid-cols-2 gap-3">
              <label className="block mb-3"><span className="text-xs uppercase tracking-widest text-sand/60">Categoría</span>
                <select data-testid="q-cat" value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment">
                  {["character", "location", "event", "general"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select></label>
              <label className="block mb-3"><span className="text-xs uppercase tracking-widest text-sand/60">Rango</span>
                <select data-testid="q-rank" value={form.rank} onChange={(e) => set("rank", e.target.value)} className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment">
                  {["explorer", "investigator", "archaeologist"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Entidad relacionada (id)" value={form.related_entity_id || ""} onChange={(v) => set("related_entity_id", v)} />
              <label className="block mb-3"><span className="text-xs uppercase tracking-widest text-sand/60">Respuesta correcta</span>
                <select data-testid="q-correct" value={form.correct_answer} onChange={(e) => set("correct_answer", e.target.value)} className="w-full mt-1 bg-charcoal/70 border border-bronze/30 rounded-lg px-3 py-2 text-parchment">
                  {["A", "B", "C", "D"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select></label>
            </div>
            <Field label="Referencia bíblica" value={form.bible_reference} onChange={(v) => set("bible_reference", v)} />
            {["es", "en"].map((lg) => (
              <div key={lg} className="border-t border-bronze/20 pt-3 mt-2">
                <p className="text-gold font-semibold text-sm mb-2">{lg.toUpperCase()}</p>
                <Field label="Pregunta" testid={`q-${lg}`} value={form.translations[lg].question} onChange={(v) => set(`translations.${lg}.question`, v)} />
                <div className="grid grid-cols-2 gap-3">
                  {["a", "b", "c", "d"].map((x) => <Field key={x} label={`Resp ${x.toUpperCase()}`} value={form.translations[lg]["answer_" + x]} onChange={(v) => set(`translations.${lg}.answer_${x}`, v)} />)}
                </div>
                <Field label="Explicación" textarea value={form.translations[lg].explanation} onChange={(v) => set(`translations.${lg}.explanation`, v)} />
              </div>
            ))}
            <button data-testid="q-save" onClick={save} className="btn-tactile mt-3 bg-gold text-midnight border-[#a9822f] font-bold rounded-xl px-6 py-3 flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
          </div>
        </div>
        <div>
          <h2 className="font-serif text-2xl mb-4">{items.length} preguntas</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {items.map((q) => (
              <div key={q.id} className="glass rounded-xl p-3 border-bronze/20 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate text-parchment">{q.translations?.es?.question}</div>
                  <div className="text-xs text-sand/50">{q.id} · {q.category} · {q.rank} · ✓{q.correct_answer}</div>
                </div>
                <button data-testid={`q-edit-${q.id}`} onClick={() => setForm({ ...EMPTY_Q(), ...q, translations: { es: { ...EMPTY_Q().translations.es, ...(q.translations?.es || {}) }, en: { ...EMPTY_Q().translations.en, ...(q.translations?.en || {}) } } })} className="text-bronze hover:text-gold text-sm">Editar</button>
                <button data-testid={`q-del-${q.id}`} onClick={() => del(q)} className="text-incorrect/70 hover:text-incorrect"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
