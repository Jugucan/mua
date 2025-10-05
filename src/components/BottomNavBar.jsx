import React from 'react';
// Importem les icones necessàries
import { Grid3X3, List, User, ListChecks } from 'lucide-react';

const BottomNavBar = ({ 
    displayMode,           // 'grid' o 'list'
    onToggleView,          // Funció per canviar vista (Grid <-> List)
    onOpenAuthModal,       // Funció per obrir el modal d'usuari
    onOpenListManagerModal // Funció per obrir el gestor de llistes
}) => {

    // Icona de Vista: Mostra la icona contrària a la vista actual
    const isGridView = displayMode === 'grid';
    const ViewIcon = isGridView ? List : Grid3X3;
    const viewLabel = isGridView ? "Veure en Llista" : "Veure en Quadrícula";
    
    // Classes de base per als botons normals (estil 'sortit')
    const defaultClass = 'text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-105';
    // Classe per al botó de vista quan està "actiu" (estil 'premsat')
    // El botó de vista ha d'estar "premsat" si la vista actual és 'list' (perquè la icona que mostra és Grid3X3)
    const viewButtonClass = isGridView ? defaultClass : 'text-green-500 box-shadow-neomorphic-button-inset transition-all-smooth';
    
    // El botó de l'usuari (al centre) sempre està "sortit"
    const userButtonClass = defaultClass;
    
    // Aquest contenidor es manté FIX a la part inferior de la pantalla.
    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-30">
            {/* Aplicar estils al contenidor central amb ombra superior */}
            <div className="bg-[#f0f3f5] max-w-lg mx-auto p-3 rounded-t-xl box-shadow-neomorphic-container-bottom flex justify-between items-center">
                
                {/* 1. Botó de Vista (Esquerra) */}
                <button
                    onClick={onToggleView}
                    className={`p-3 rounded-full ${viewButtonClass} flex-1 mx-2`}
                    aria-label={viewLabel}
                    title={viewLabel}
                >
                    <ViewIcon className="w-6 h-6 mx-auto" />
                </button>

                {/* 2. Botó de Menú Usuari (Centre) */}
                <button
                    onClick={onOpenAuthModal}
                    className={`p-3 rounded-full ${userButtonClass} flex-1 mx-2`}
                    aria-label="Menú d'Usuari"
                    title="Menú d'Usuari"
                >
                    <User className="w-6 h-6 mx-auto" />
                </button>
                
                {/* 3. Botó Gestor de Llistes (Dreta) */}
                <button
                    onClick={onOpenListManagerModal}
                    className={`p-3 rounded-full ${defaultClass} flex-1 mx-2`}
                    aria-label="Gestionar Llistes"
                    title="Gestionar Llistes"
                >
                    <ListChecks className="w-6 h-6 mx-auto" />
                </button>
                
            </div>
        </div>
    );
};

export default BottomNavBar;
