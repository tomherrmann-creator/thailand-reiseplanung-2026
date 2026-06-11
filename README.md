# Thailand-Reiseplanung

Diese kleine Website nutzt die Markdown-Dateien als Quelle:

- `anforderungen.md`: Rahmenbedingungen und Präferenzen
- `reiseplan.md`: konkrete Reiseroute, Tagesplan, Links und Anpassungslogik
- `index.html`, `styles.css`, `script.js`: Website

## Lokal starten

```bash
python3 -m http.server 4173
```

Dann im Browser öffnen:

```text
http://localhost:4173
```

Nach Änderungen an den Markdown-Dateien die Seite neu laden. Wenn sich die Anforderungen grundlegend ändern, kann `anforderungen.md` als Briefing für eine neue Planung dienen.
