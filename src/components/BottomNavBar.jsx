import React from 'react';
// Importem les icones necessàries
import { Plus, Grid3X3, List, Layers, ArrowUpDown } from 'lucide-react';

const BottomNavBar = ({ 
    currentView,           // 'pantry' o 'shoppingList'
    isGridView,            // true o false per la vista
    isReorderMode,         // true o false per mode reordenació
    onToggleView,          // Funció per canviar vista (Grid <-> List)
    onOpenAddModal,        // Funció per obrir modal d'afegir
    onOpenSectionOrderModal, // Funció per obrir modal d'ordenació de seccions
    onToggleReorderMode    // Funció per activar/desactivar mode reordenació
}) => {

    // La barra només es mostra si l'usuari ha iniciat sessió i estem en la vista Llista
    // Com que ja l'integrarem a App.jsx només quan sigui necessari, ho simplifiquem
    
    // Icona de Vista: Mostra la icona contrària a la vista actual
    const ViewIcon = isGridView ? List : Grid3X3;
    const viewLabel = isGridView ? "Veure en Llista" : "Veure en Quadrícula";
    // Classes actives per al mode reordenació (per canviar el color/estil del botó)
    const activeClass = 'text-green-500 box-shadow-neomorphic-button-inset';
    const defaultClass = 'text-gray-600 box-shadow-neomorphic-button hover:scale-105';

    // Aquest contenidor es manté FIX a la part inferior de la pantalla.
    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-30">
            <div className="bg-[#f0f3f5] max-w-lg mx-auto p-3 rounded-t-xl shadow-2xl box-shadow-neomorphic-container-bottom flex justify-around items-center">
                
                {/* 1. Botó de Vista (Només a la Llista) */}
                {currentView === 'shoppingList' && (
                    <button
                        onClick={onToggleView}
                        className={`p-3 rounded-full transition-all-smooth ${defaultClass}`}
                        aria-label={viewLabel}
                    >
                        <ViewIcon className="w-6 h-6" />
                    </button>
                )}

                {/* 2. Botó d'Afegir Producte (Sempre, substituint el FAB) */}
                <button
                    onClick={onOpenAddModal}
                    className="p-4 rounded-full bg-green-500 text-white shadow-xl box-shadow-neomorphic-fab-inner transition-all-smooth transform hover:scale-110 -mt-8"
                    aria-label="Afegir nou producte"
                >
                    <Plus className="w-7 h-7" />
                </button>
                
                {/* 3. Botó de Reordenar Seccions (Només a la Llista) */}
                {currentView === 'shoppingList' && (
                    <button
                        onClick={onOpenSectionOrderModal}
                        className={`p-3 rounded-full transition-all-smooth ${defaultClass}`}
                        aria-label="Reordenar seccions"
                    >
                        <Layers className="w-6 h-6" />
                    </button>
                )}
                
                {/* 4. Botó de Mode Reordenació de Productes (Només a la Llista) */}
                {currentView === 'shoppingList' && (
                    <button
                        onClick={onToggleReorderMode}
                        className={`p-3 rounded-full transition-all-smooth ${isReorderMode ? activeClass : defaultClass}`}
                        aria-label={isReorderMode ? "Desactivar reordenació" : "Activar reordenació de productes"}
                    >
                        <ArrowUpDown className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
