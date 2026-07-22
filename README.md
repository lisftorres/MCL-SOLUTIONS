<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sYNSvpT8nUN1T-jxfK2FNCkaoX9aaX93

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Start [OmniRoute](./OmniRoute) (passerelle IA) en local :
   `npx omniroute` (dashboard sur `http://localhost:20128`)
3. Dans le dashboard OmniRoute, connectez un fournisseur puis copiez votre clé d'API (Dashboard → Endpoints)
4. Renseignez `VITE_OMNIROUTE_API_KEY` (et `VITE_OMNIROUTE_BASE_URL` si différent de `http://localhost:20128/v1`) dans [.env.local](.env.local)
5. Run the app:
   `npm run dev`

L'application appelle systématiquement OmniRoute (`services/omnirouteClient.ts`) pour ses requêtes IA, au lieu d'appeler un fournisseur directement.
