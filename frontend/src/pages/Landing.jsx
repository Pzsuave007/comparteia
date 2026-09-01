import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Tv, Smartphone, Settings } from "lucide-react";
import { tt } from "@/i18n";

const RUINS = "https://images.unsplash.com/photo-1565799446045-5ba401561908";

export default function Landing() {
  const nav = useNavigate();
  const [lang, setLang] = useState("es");
  const t = (k) => tt(lang, k);

  return (
    <div className="relative min-h-screen overflow-hidden grain tv-vignette">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${RUINS})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/85 to-midnight/60" />

      <div className="absolute top-6 right-6 z-20 flex gap-2">
        {["es", "en"].map((l) => (
          <button
            key={l}
            data-testid={`landing-lang-${l}`}
            onClick={() => setLang(l)}
            className={`px-4 py-2 rounded-full text-sm font-semibold btn-tactile border ${
              lang === l ? "bg-bronze text-midnight border-bronze/60" : "glass text-parchment border-bronze/30"
            }`}
          >
            {l === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}
          </button>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 max-w-4xl mx-auto text-center">
        <div className="animate-fade-in flex items-center gap-3 text-bronze mb-6">
          <Compass className="w-9 h-9 animate-spin-slow" style={{ animationDuration: "12s" }} />
          <span className="uppercase tracking-[0.35em] text-xs font-semibold text-sand">Expedición Bíblica</span>
        </div>

        <h1 className="font-display font-800 text-5xl sm:text-6xl lg:text-7xl leading-none text-parchment text-shadow-lg animate-fade-up">
          {t("appTitle")}
        </h1>
        <p className="mt-5 font-serif italic text-xl sm:text-2xl text-gold animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {t("appSubtitle")}
        </p>
        <p className="mt-6 max-w-xl text-sand/80 text-base sm:text-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {t("landingBlurb")}
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-5 w-full max-w-2xl">
          <button
            data-testid="landing-host-btn"
            onClick={() => nav("/host")}
            className="group glass btn-tactile border-bronze/40 rounded-2xl p-7 text-left hover:bg-midnight2/80 hover:border-gold"
          >
            <Tv className="w-9 h-9 text-gold mb-3 transition-transform group-hover:scale-110" />
            <div className="font-serif text-2xl text-parchment">{t("hostGame")}</div>
            <div className="text-sand/70 text-sm mt-1">TV / {lang === "es" ? "pantalla compartida" : "shared screen"}</div>
          </button>

          <button
            data-testid="landing-join-btn"
            onClick={() => nav("/play")}
            className="group glass btn-tactile border-bronze/40 rounded-2xl p-7 text-left hover:bg-midnight2/80 hover:border-gold"
          >
            <Smartphone className="w-9 h-9 text-gold mb-3 transition-transform group-hover:scale-110" />
            <div className="font-serif text-2xl text-parchment">{t("joinGame")}</div>
            <div className="text-sand/70 text-sm mt-1">{lang === "es" ? "Tu teléfono" : "Your phone"}</div>
          </button>
        </div>

        <button
          data-testid="landing-admin-btn"
          onClick={() => nav("/admin")}
          className="mt-8 inline-flex items-center gap-2 text-sand/60 hover:text-bronze transition-colors text-sm"
        >
          <Settings className="w-4 h-4" /> {t("admin")}
        </button>
      </div>
    </div>
  );
}
