# TV-Music Faso — Web

Tableau de bord React (Vite) `http://localhost:5173`. Dépôt séparé de l’API et du desktop.

Le proxy `/api` pointe vers l’API : `https://localhost:7245` (dépôt `TV-Music-Faso-Api`).

## Lancer

1. Postgres (desktop) : `docker compose up -d`
2. API (dossier `TV-Music-Faso-Api`) : `dotnet run --project src/TVMusicFaso.Api`
3. Web :

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:5173**.

Comptes : les mêmes que le desktop (`sara.programmateur`, `ibrahim.technicien`, `marie.direction`).
