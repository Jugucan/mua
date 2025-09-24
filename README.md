# Llista de la Compra - Nova Aplicació

Una aplicació moderna de llista de la compra construïda amb React, Vite, Firebase i Tailwind CSS.

## Característiques

- ✅ Gestió d'elements de despensa i llista de compra
- ✅ Autenticació amb Firebase (anònima i amb compte)
- ✅ Sincronització en temps real
- ✅ Interfície responsive i moderna
- ✅ Desplegament automàtic amb Netlify

## Configuració del Projecte

### 1. Crear el projecte Firebase

1. Ves a [Firebase Console](https://console.firebase.google.com/)
2. Clica "Add project" / "Afegir projecte"
3. Dona-li un nom (ex: `llista-compra-nova`)
4. Activa Google Analytics si vols
5. Clica "Create project"

### 2. Configurar Firebase

1. A la consola de Firebase, clica l'icona web (`</>`)
2. Registra l'app amb un nom (ex: `llista-compra-web`)
3. Copia la configuració de Firebase
4. Enganxa-la al fitxer `src/App.jsx` substituint:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Configurar Firestore

1. A Firebase Console, ves a "Firestore Database"
2. Clica "Create database"
3. Selecciona "Start in test mode" (per ara)
4. Tria una ubicació (europe-west3 per Europa)

### 4. Configurar Authentication

1. A Firebase Console, ves a "Authentication"
2. Clica "Get started"
3. A la pestanya "Sign-in method":
   - Activa "Anonymous"
   - Activa "Email/Password"

### 5. Crear repositori GitHub

1. Ves a [GitHub](https://github.com)
2. Clica "New repository"
3. Nom: `llista-compra-nova`
4. Marca "Add a README file"
5. Clica "Create repository"

### 6. Pujar fitxers a GitHub

1. Copia tots els fitxers d'aquest projecte
2. Crea els fitxers al repositori de GitHub un per un
3. Fes commit de cada fitxer

### 7. Configurar Netlify

1. Ves a [Netlify](https://netlify.com)
2. Clica "Add new site" > "Import an existing project"
3. Connecta amb GitHub i selecciona el repositori
4. Configuració de build:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Clica "Deploy site"

## Desenvolupament Local

```bash
# Instal·la dependències
npm install

# Inicia el servidor de desenvolupament
npm run dev

# Construeix per producció
npm run build
```

## Estructura del Projecte

```
llista-compra-nova/
├── src/
│   ├── App.jsx          # Component principal
│   ├── main.jsx         # Punt d'entrada
│   └── index.css        # Estils globals
├── index.html           # Template HTML
├── package.json         # Dependències
└── README.md           # Documentació
```

## Desplegament

Cada cop que facis canvis als fitxers a GitHub, Netlify redesplegarà automàticament l'aplicació.
