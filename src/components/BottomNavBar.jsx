import React from 'react';
// Importem les icones comunes
import { Plus, Grid3X3, List, User, ListChecks } from 'lucide-react';

const BottomNavBar = ({ 
    currentView,           // 'pantry' o 'shoppingList'
    isGridView,            // true o false per la vista
    onToggleView,          // Funció per canviar vista (Grid <-> List)
    onOpenAddModal,        // Funció per obrir modal d'afegir
    onOpenAuthModal,       // Funció per obrir el modal d'usuari
    onOpenListManagerModal // Funció per obrir el gestor de llistes
}) => {

    // Icona de Vista: Mostra la icona contrària a la vista actual
    const ViewIcon = isGridView ? List : Grid3X3;
    const viewLabel = isGridView ? "Veure en Llista" : "Veure en Quadrícula";
    
    // Classes de base per als botons normals
    const defaultClass = 'text-gray-600 box-shadow-neomorphic-button hover:scale-105';
    // Classe activa per al botó de vista
    const activeClass = 'text-green-500 box-shadow-neomorphic-button-inset';
    
    // Determineu si el botó de vista ha d'estar actiu (marcat com a "premsat")
    // El botó mostra la icona CONTRÀRIA al mode actual, però el seu estil ha de ser el del mode actual
    const isViewButtonActive = currentView === 'pantry' 
        ? (isGridView ? false : true) // A la Despensa, si és Llista, activem
        : (isGridView ? false : true); // A la Llista, si és Llista, activem

    // Aquest contenidor es manté FIX a la part inferior de la pantalla.
    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-30">
            <div className="bg-[#f0f3f5] max-w-lg mx-auto p-3 rounded-t-xl shadow-2xl box-shadow-neomorphic-container-bottom flex justify-around items-center">
                
                {/* 1. Botó Gestor de Llistes (Comú) */}
                <button
                    onClick={onOpenListManagerModal}
                    className={`p-3 rounded-full transition-all-smooth ${defaultClass}`}
                    aria-label="Gestionar Llistes"
                >
                    <ListChecks className="w-6 h-6" />
                </button>

                {/* 2. Botó de Vista (Comú, canvi d'estil) */}
                <button
                    onClick={onToggleView}
                    className={`p-3 rounded-full transition-all-smooth ${isGridView ? defaultClass : activeClass}`}
                    aria-label={viewLabel}
                >
                    <ViewIcon className="w-6 h-6" />
                </button>

                {/* 3. Botó d'Afegir Producte (Comú, al centre) */}
                <button
                    onClick={onOpenAddModal}
                    className="p-4 rounded-full bg-green-500 text-white shadow-xl box-shadow-neomorphic-fab-inner transition-all-smooth transform hover:scale-110 -mt-8"
                    aria-label="Afegir nou producte"
                >
                    <Plus className="w-7 h-7" />
                </button>
                
                {/* 4. Botó de Menú Usuari (Comú) */}
                <button
                    onClick={onOpenAuthModal}
                    className={`p-3 rounded-full transition-all-smooth ${defaultClass}`}
                    aria-label="Menú d'Usuari"
                >
                    <User className="w-6 h-6" />
                </button>
                
            </div>
        </div>
    );
};

export default BottomNavBar;
