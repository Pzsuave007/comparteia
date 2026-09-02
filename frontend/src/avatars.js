// Bundled avatar illustrations (served from /public/avatars). Grouped by rank.
export const AVATARS = {
  explorer: [
    { id: "explorer_boy", name: { es: "Niño explorador", en: "Boy explorer" } },
    { id: "explorer_girl", name: { es: "Niña con brújula", en: "Compass girl" } },
    { id: "explorer_puppy", name: { es: "Cachorro aventurero", en: "Adventure pup" } },
    { id: "explorer_camel", name: { es: "Camello simpático", en: "Friendly camel" } },
    { id: "explorer_owl", name: { es: "Lechuza sabia", en: "Wise owl" } },
    { id: "explorer_fox", name: { es: "Zorro del desierto", en: "Desert fox" } },
  ],
  investigator: [
    { id: "inv_boy_fedora", name: { es: "Aventurero del sombrero", en: "Fedora adventurer" } },
    { id: "inv_girl_lantern", name: { es: "Chica de la linterna", en: "Lantern girl" } },
    { id: "inv_boy_backpack", name: { es: "Joven arqueólogo", en: "Young archaeologist" } },
    { id: "inv_girl_goggles", name: { es: "Exploradora con gafas", en: "Goggles explorer" } },
    { id: "inv_boy_camera", name: { es: "Explorador con cámara", en: "Camera explorer" } },
    { id: "inv_girl_whip", name: { es: "Aventurera de la cuerda", en: "Rope adventurer" } },
  ],
  archaeologist: [
    { id: "arch_veteran", name: { es: "Explorador veterano", en: "Veteran explorer" } },
    { id: "arch_woman_scrolls", name: { es: "Arqueóloga de pergaminos", en: "Scroll archaeologist" } },
    { id: "arch_sage_lamp", name: { es: "Sabio de la lámpara", en: "Lamp sage" } },
    { id: "arch_bearded_map", name: { es: "Explorador del mapa", en: "Map explorer" } },
    { id: "arch_woman_helmet", name: { es: "Arqueóloga del casco", en: "Helmet archaeologist" } },
    { id: "arch_professor", name: { es: "Profesor arqueólogo", en: "Archaeologist professor" } },
  ],
};

export const avatarSrc = (id) => `${process.env.PUBLIC_URL || ""}/avatars/${id}.jpg`;

export const ALL_AVATARS = Object.values(AVATARS).flat();
export const avatarName = (id, lang = "es") => {
  const a = ALL_AVATARS.find((x) => x.id === id);
  return a ? a.name[lang] || a.name.es : "";
};
