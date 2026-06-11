with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"📄 File caricato: {len(lines)} righe\n")

sections = [
    (1,    350,  "01_css.html",           "CSS (stili)"),
    (351,  620,  "02_html_struttura.html","HTML - Login / Home / App / Sezioni"),
    (621,  1175, "03_html_modals.html",   "HTML - Modals"),
    (1176, 1601, "04_js_core.html",       "JS - Login / Dati / Overview / Squadra / Rosa"),
    (1602, 1785, "05_js_tifosi_comp_museo_mercato.html", "JS - Tifosi / Competizioni / Museo / Mercato"),
    (1786, 2059, "06_js_bonus_trattativa.html",  "JS - Bonus / Trattativa"),
    (2060, 2310, "07_js_transfermarkt_giocatori.html", "JS - Transfermarkt / Nuovo Giocatore / Sposta"),
    (2311, 2731, "08_js_svincolati.html", "JS - Svincolati"),
    (2732, 3347, "09_js_formazione.html", "JS - Formazione"),
    (3348, 3928, "10_js_admin_modifica_foto_logo.html", "JS - Admin / Modifica / Foto / Logo"),
    (3929, 4664, "11_js_navigazione_social.html", "JS - Navigazione / Social / Nuovo Post"),
]

import os
os.makedirs("parti", exist_ok=True)

for start, end, filename, label in sections:
    chunk = lines[start-1:end]
    filepath = os.path.join("parti", filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(chunk)
    size_kb = os.path.getsize(filepath) // 1024
    print(f"✅ {filename} — {end-start+1} righe, ~{size_kb} KB")

print(f"\n✅ Fatto! Cartella 'parti/' creata con {len(sections)} file")