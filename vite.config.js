import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ⭐ 1. IMPORTEM EL PLUGIN
import { VitePWA } from 'vite-plugin-pwa'; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // ⭐ 2. CONFIGURACIÓ DEL PLUGIN PWA
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      // La configuració bàsica per al manifest (que hem posat a la carpeta public/)
      manifest: './public/manifest.json', 
      
      // Configuració de Workbox per a la gestió de caché (necessari per a l'offline)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Si no vols mode offline, pots esborrar workbox, però és el propòsit d'una PWA
      },
      
      // Opcions per ajudar durant el desenvolupament (s'ignoren al build final)
      devOptions: {
        enabled: true
      }
    })
  ],
});
