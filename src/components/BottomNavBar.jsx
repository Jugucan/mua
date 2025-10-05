import React from 'react';
// Importem les icones necessàries
import { Grid3X3, List, User, ListChecks } from 'lucide-react';

const BottomNavBar = ({ 
    isGridView,            // true o false per la vista
    onToggleView,          // Funció per canviar vista (Grid <-> List)
    onOpenAuthModal,       // Funció per obrir el modal d'usuari
    onOpenListManagerModal // Funció per obrir el gestor de llistes
}) => {

    // Icona de Vista: Mostra la icona contrària a la vista actual
    const ViewIcon = isGridView ? List : Grid3X3;
    const viewLabel = isGridView ? "Veure en Llista" : "Veure en Quadrícula";
    
    // Classes de base per als botons normals (estil 'sortit')
    const defaultClass = 'text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-105';
    // Classe per al botó de vista quan està "actiu" (estil 'premsat')
    const activeClass = 'text-green-500 box-shadow-neomorphic-button-inset transition-all-smooth';
    
    // El botó de vista ha d'estar "premsat" si la vista actual és Llista (perquè la icona que mostra és Grid)
    const viewButtonClass = isGridView ? defaultClass : activeClass;

    // Aquest contenidor es manté FIX a la part inferior de la pantalla.
    return (
        // ⭐ CANVI: Posicionem fix a baix
        <div className="fixed bottom-0 left-0 right-0 w-full z-30">
            {/* ⭐ Apliquem l'estil al contenidor central amb ombra superior */}
            <div className="bg-[#f0f3f5] max-w-lg mx-auto p-3 rounded-t-xl box-shadow-neomorphic-container-bottom flex justify-around items-center">
                
                {/* 1. Botó Gestor de Llistes (Comú) */}
                <button
                    onClick={onOpenListManagerModal}
                    className={`p-3 rounded-full ${defaultClass}`}
                    aria-label="Gestionar Llistes"
                >
                    <ListChecks className="w-6 h-6" />
                </button>

                {/* 2. Botó de Vista (Comú, canvi d'estil) */}
                <button
                    onClick={onToggleView}
                    className={`p-3 rounded-full ${viewButtonClass}`}
                    aria-label={viewLabel}
                >
                    <ViewIcon className="w-6 h-6" />
                </button>

                {/* 3. Botó de Menú Usuari (Comú) */}
                <button
                    onClick={onOpenAuthModal}
                    className={`p-3 rounded-full ${defaultClass}`}
                    aria-label="Menú d'Usuari"
                >
                    <User className="w-6 h-6" />
                </button>
                
            </div>
        </div>
    );
};

export default BottomNavBar;
