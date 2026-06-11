"""
Script per ristrutturare FantaManager in file JS separati.
Metti questo file in C:\\Users\\web\\fantamanager e lancia:
    python ristruttura.py
"""

import os

with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

total = len(lines)
print(f"File caricato: {total} righe\n")

# ============================================================
# 1. ESTRAI IL JAVASCRIPT (righe 1177 a 4662, 0-based: 1176-4661)
# ============================================================
js_lines = lines[1176:4662]  # tutto il blocco <script>...</script>
js_content = "".join(js_lines)

# ============================================================
# 2. DIVIDI IL JS IN SEZIONI
# ============================================================

# Cerca i marcatori di sezione
sections = {
    "js/carica-dati.js":      ("// ===== CARICA DATI =====",      "// ===== OVERVIEW ====="),
    "js/overview.js":         ("// ===== OVERVIEW =====",          "// ===== PAGINA SQUADRA ====="),
    "js/squadra.js":          ("// ===== PAGINA SQUADRA =====",    "// ===== ROSA ====="),
    "js/rosa.js":             ("// ===== ROSA =====",              "// ===== SCHEDA GIOCATORE ====="),
    "js/scheda-giocatore.js": ("// ===== SCHEDA GIOCATORE =====",  "// ===== TIFOSI ====="),
    "js/tifosi.js":           ("// ===== TIFOSI =====",            "// ===== COMPETIZIONI ====="),
    "js/competizioni.js":     ("// ===== COMPETIZIONI =====",      "// ===== MUSEO ====="),
    "js/museo.js":            ("// ===== MUSEO =====",             "// ===== MERCATO ====="),
    "js/mercato.js":          ("// ===== MERCATO =====",           "// ===== BONUS ====="),
    "js/bonus.js":            ("// ===== BONUS =====",             "// ===== TRANSFERMARKT"),
    "js/transfermarkt.js":    ("// ===== TRANSFERMARKT",           "// ===== NUOVO GIOCATORE ====="),
    "js/nuovo-giocatore.js":  ("// ===== NUOVO GIOCATORE =====",   "// ===== SPOSTA GIOCATORE ====="),
    "js/sposta-giocatore.js": ("// ===== SPOSTA GIOCATORE =====",  "// ===== SVINCOLATI ====="),
    "js/svincolati.js":       ("// ===== SVINCOLATI =====",        "// ===== FORMAZIONE ====="),
    "js/formazione.js":       ("// ===== FORMAZIONE =====",        "// ===== ADMIN ====="),
    "js/admin.js":            ("// ===== ADMIN =====",             "// ===== MODIFICA GIOCATORE ====="),
    "js/modifica-giocatore.js":("// ===== MODIFICA GIOCATORE =====","// ===== FOTO GIOCATORE ====="),
    "js/foto.js":             ("// ===== FOTO GIOCATORE =====",    "// ===== LOGO + MAGLIA"),
    "js/logo-maglia.js":      ("// ===== LOGO + MAGLIA",           "// ===== PRESIDENTI ====="),
    "js/presidenti.js":       ("// ===== PRESIDENTI =====",        "// ===== GESTIONE EMAIL ====="),
    "js/email.js":            ("// ===== GESTIONE EMAIL =====",    "// ===== NAVIGAZIONE ====="),
    "js/navigazione.js":      ("// ===== NAVIGAZIONE =====",       "// ===== SOCIAL MANAGER ====="),
    "js/social.js":           ("// ===== SOCIAL MANAGER =====",    "// ===== NUOVO POST ====="),
    "js/nuovo-post.js":       ("// ===== NUOVO POST =====",        None),
}

os.makedirs("js", exist_ok=True)

created_files = []
for filename, (start_marker, end_marker) in sections.items():
    start_idx = js_content.find(start_marker)
    if start_idx == -1:
        print(f"⚠️  {filename}: marcatore '{start_marker}' non trovato, saltato")
        continue
    
    if end_marker:
        end_idx = js_content.find(end_marker)
        if end_idx == -1:
            chunk = js_content[start_idx:]
        else:
            chunk = js_content[start_idx:end_idx]
    else:
        chunk = js_content[start_idx:]
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(chunk.strip() + "\n")
    
    size_kb = os.path.getsize(filename) // 1024
    print(f"✅ {filename} (~{size_kb} KB)")
    created_files.append(filename)

# ============================================================
# 3. AGGIORNA INDEX.HTML
# ============================================================
print("\n📝 Aggiorno index.html...")

# Prendi solo la parte HTML (prima del <script>)
html_part = lines[:1176]  # fino a riga 1176 (esclusa)
closing = lines[4662:]    # </script> e </body></html>

# Costruisci i tag script
script_tags = [
    '<!-- JS Configurazione e utilità -->\n',
    '<script src="js/config.js"></script>\n',
    '<script src="js/utils.js"></script>\n',
    '<script src="js/auth.js"></script>\n',
    '<!-- JS Applicazione -->\n',
]
for f in created_files:
    script_tags.append(f'<script src="{f}"></script>\n')

# Rimuovi il vecchio <script> e </script>
# html_part[-1] è "<script>\n", sostituiscilo con i tag
html_part = html_part[:-1]  # rimuovi "<script>"

# Rimuovi "</script>" e quello che viene dopo fino a </html>
# closing contiene: </script>\n</body>\n</html>\n
closing_html = ['</body>\n', '</html>\n']

# Componi il nuovo index.html
new_content = html_part + script_tags + closing_html

with open("index.html", "w", encoding="utf-8") as f:
    f.writelines(new_content)

print("✅ index.html aggiornato!")
print(f"\n🎉 Fatto! Creati {len(created_files)} file JS separati")
print("\nOra esegui:")
print("  git add .")
print("  git commit -m 'ristrutturazione js separati'")
print("  git push")
