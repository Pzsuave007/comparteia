import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, User, MapPin, Scroll, HelpCircle } from "lucide-react";
import { BACKEND } from "@/useRoom";
import { toast } from "sonner";

const API = `${BACKEND}/api`;

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
  const [tab, setTab] = useState("character");
  return (
    <div className="min-h-screen bg-midnight grain text-parchment">
      <div className="border-b border-bronze/20 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 bg-midnight/90 backdrop-blur">
        <button data-testid="admin-back" onClick={() => nav("/")} className="text-sand/60 hover:text-bronze"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-display text-xl tracking-widest text-bronze">ADMIN · ARCHIVO BÍBLICO</h1>
      </div>
      <div className="flex gap-2 p-6 flex-wrap">
        {[{ id: "character", l: "Personajes", icon: User }, { id: "location", l: "Lugares", icon: MapPin },
          { id: "event", l: "Acontecimientos", icon: Scroll }, { id: "questions", l: "Preguntas", icon: HelpCircle }].map((t) => (
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

function EntityAdmin({ category }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_ENTITY(category));

  const load = async () => {
    const res = await axios.get(`${API}/admin/entities`, { params: { category } });
    setItems(res.data);
  };
  useEffect(() => { setForm(EMPTY_ENTITY(category)); load(); }, [category]);

  const save = async () => {
    if (!form.id) return toast.error("id requerido");
    const body = { ...form, references: typeof form.references === "string" ? form.references.split(",").map(s => s.trim()).filter(Boolean) : form.references };
    await axios.post(`${API}/admin/entities`, body);
    toast.success("Guardado");
    setForm(EMPTY_ENTITY(category));
    load();
  };
  const del = async (it) => { await axios.delete(`${API}/admin/entities/${category}/${it.id}`); toast.success("Eliminado"); load(); };

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

function QuestionsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_Q());
  const load = async () => { const r = await axios.get(`${API}/admin/questions`); setItems(r.data); };
  useEffect(() => { load(); }, []);

  const set = (path, val) => setForm((f) => {
    const c = JSON.parse(JSON.stringify(f)); let o = c; const ks = path.split(".");
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; return c;
  });
  const save = async () => {
    if (!form.id) return toast.error("id requerido");
    await axios.post(`${API}/admin/questions`, form); toast.success("Guardado"); setForm(EMPTY_Q()); load();
  };
  const del = async (q) => { await axios.delete(`${API}/admin/questions/${q.id}`); toast.success("Eliminado"); load(); };

  return (
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
              <button data-testid={`q-edit-${q.id}`} onClick={() => setForm({ ...EMPTY_Q(), ...q })} className="text-bronze hover:text-gold text-sm">Editar</button>
              <button data-testid={`q-del-${q.id}`} onClick={() => del(q)} className="text-incorrect/70 hover:text-incorrect"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
