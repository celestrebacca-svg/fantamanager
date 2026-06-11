with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

old_prestito = '''      <div id="campo-prestito-trat" style="display:none">
        <div class="form-group"><label class="form-label">Scadenza Prestito</label><input class="form-input" type="date" id="trat-scadenza-prestito"></div>
      </div>'''

new_prestito = '''      <div id="campo-prestito-trat" style="display:none">
        <div class="form-group"><label class="form-label">Cifra Prestito (FM)</label><input class="form-input" type="number" id="trat-cifra-prestito" step="100000" placeholder="Es. 2000000"></div>
        <div class="form-group"><label class="form-label">Scadenza Prestito</label><input class="form-input" type="date" id="trat-scadenza-prestito"></div>
      </div>'''

old_importo = '''      <div id="campo-importo">
        <div class="form-group"><label class="form-label">Importo (FM)</label><input class="form-input" type="number" id="trat-importo" placeholder="Es. 15000000" step="100000"></div>
      </div>'''

new_importo = '''      <div id="campo-importo">
        <div class="form-group">
          <label class="form-label">Direzione Soldi</label>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button type="button" id="btn-pago" onclick="setDirezioneImporto(\'pago\')" style="flex:1;padding:8px;border-radius:8px;border:2px solid var(--rosso);background:rgba(255,68,68,0.15);color:var(--rosso);font-family:\'Bebas Neue\',sans-serif;font-size:14px;cursor:pointer">💸 IO PAGO</button>
            <button type="button" id="btn-ricevo" onclick="setDirezioneImporto(\'ricevo\')" style="flex:1;padding:8px;border-radius:8px;border:2px solid var(--grigio-chiaro);background:transparent;color:var(--testo-dim);font-family:\'Bebas Neue\',sans-serif;font-size:14px;cursor:pointer">💰 IO RICEVO</button>
          </div>
          <input type="hidden" id="trat-direzione-importo" value="pago">
        </div>
        <div class="form-group"><label class="form-label">Importo (FM)</label><input class="form-input" type="number" id="trat-importo" placeholder="Es. 15000000" step="100000"></div>
      </div>'''

content = content.replace(old_prestito, new_prestito)
content = content.replace(old_importo, new_importo)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Fatto!")