# 🌳 Hype-Træet

> En interaktiv karriere tracker, der præsenterer dine kompetencer, bedrifter og udvikling som et **voksende træ**.

![Hype-Træet Screenshot](screenshot.png)

---

## ✨ Features

- **Interaktivt SVG-træ** med stamme, rødder, grene og blade
- **Dynamisk dataloading** fra `data.json` – ingen backend nødvendig
- **Hover-tooltips** med detaljer (titel, beskrivelse, dato, tags, niveau-stjerner)
- **Klik på grene** for at fremhæve én kategori
- **Mørk/lys tilstand** med husket præference
- **Del-funktion** til LinkedIn, Twitter/X og kopiering af link
- **Partikel-effekter** og animerede blade der vokser ind
- **Responsivt** – virker på desktop og mobil
- **GitHub Pages-venligt** – kun statiske filer

---

## 🗂 Filstruktur

```
hype-tree/
├── index.html      # Semantisk HTML-skelet
├── style.css       # Al styling (CSS custom properties, responsivt, animationer)
├── script.js       # SVG-rendering, data-loading, interaktivitet
├── data.json       # Din karrieredata – REDIGER DENNE
└── README.md       # Denne fil
```

---

## 🎨 Visuelle stilarter

| Stil | Beskrivelse | Farvepalet | Grafisk stil |
|---|---|---|---|
| **Enchanted Forest** *(nuværende)* | Mørk botanisk fantasy med neon-glød og organiske former | Sort, neon-grøn, guld, violet, himmelblå | SVG + CSS-animationer + partikler |
| **Minimalistisk** | Rent, luftigt design med tynde linjer | Beige, mørkegrøn, sort | SVG-linjer, cirkler til blade |
| **Watercolor** | Bløde, vandfarveagtige former med pastelfarver | Pastelgrøn, lyserød, blå | SVG med blur-filtre |
| **Sketch-Style** | Håndtegnede linjer og uregelmæssige former | Sort/hvid, rødbrun | SVG med "håndtegnede" paths |
| **Cyberpunk** | Neon-farver, glitch-effekter og futuristisk design | Neon-pink, cyan, sort | SVG/Canvas med glitch-animationer |

---

## 📝 Tilføj nye data til `data.json`

### Profil

```json
"profile": {
  "name": "Dit navn",
  "title": "Din jobtitel",
  "tagline": "Din personlige tagline",
  "startYear": 2020
}
```

### Tilføj en ny gren (kategori)

```json
{
  "id": "projects",
  "label": "Projekter",
  "icon": "🚀",
  "color": "#fb7185",
  "angle": 40,
  "leaves": []
}
```

**Angles**: Brug negative værdier (−60 til −10) for venstre side og positive (10 til 60) for højre side.

### Tilføj et nyt blad (kompetence/bedrift)

```json
{
  "id": "unikt-id-her",
  "title": "Titel på din bedrift",
  "description": "En kort beskrivelse af hvad du opnåede.",
  "date": "2024-06-15",
  "level": 4,
  "type": "achievement",
  "link": "https://link-til-bevis.dk",
  "from": "Navn, titel (kun til feedback-type)",
  "tags": ["tag1", "tag2"]
}
```

**Felter:**

| Felt | Type | Beskrivelse |
|---|---|---|
| `id` | string | Unikt ID (ingen mellemrum) |
| `title` | string | Kort, beskrivende titel |
| `description` | string | Detaljeret beskrivelse (vises i tooltip) |
| `date` | string | ISO-dato `YYYY-MM-DD` |
| `level` | number | 1–5 (påvirker bladstørrelse og glød) |
| `type` | string | `skill`, `achievement`, `feedback`, eller `learning` |
| `link` | string | Valgfrit link til bevis/artikel |
| `from` | string | Kilden (bruges til feedback-typen) |
| `tags` | array | Liste af nøgleord |

---

## 🚀 Deploy på GitHub Pages

### Metode 1: GitHub GUI (nemmest)

1. Opret et nyt GitHub repository
2. Upload alle filer (`index.html`, `style.css`, `script.js`, `data.json`, `README.md`)
3. Gå til **Settings → Pages**
4. Under **Source**, vælg **Deploy from a branch**
5. Vælg branch `main` og rod-mappe `/`
6. Klik **Save** – siden er live inden for et minut på `https://dit-brugernavn.github.io/dit-repo/`

### Metode 2: Git kommandolinjen

```bash
git init
git add .
git commit -m "🌳 Initial Hype-Træet"
git branch -M main
git remote add origin https://github.com/DIT-BRUGERNAVN/hype-traeet.git
git push -u origin main
```

Aktivér derefter GitHub Pages via Settings som beskrevet ovenfor.

---

## 🛠 Lokal udvikling

Åbn projektet med en lokal HTTP-server (nødvendig for `fetch()` til `data.json`):

```bash
# Python 3
python3 -m http.server 8000

# Node.js (med npx)
npx serve .

# VS Code: brug Live Server-extension
```

Åbn derefter `http://localhost:8000` i browseren.

---

## 🔮 Fremtidige udvidelser

- [ ] Automatisk oprettelse af blade via en formular
- [ ] Eksport som PNG/PDF
- [ ] Tidslinje-tilstand
- [ ] Multiplayer / delt træ

---

## 📄 Licens

MIT – brug frit, del gerne dine Hype-Træer!
