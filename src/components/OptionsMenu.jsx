import React, { useState, useRef, useEffect } from 'react';
// ⭐ CANVI: Substituïm 'SortAscending' per 'ArrowUpDown' per solucionar l'error de Netlify
import { Menu, X, List, Grid3X3, ArrowUpDown, Layers } from 'lucide-react'; 

// Aquest component mostrarà un botó de 'tres punts' (o menú hamburguesa)
const OptionsMenu = ({ isGridView, onToggleView, onOpenSectionOrderModal, onReorderProducts }) => {
  // 'isOpen' controlarà si el menú desplegable està obert o tancat.
  const [isOpen, setIsOpen] = useState(false);

  // 'menuRef' és una referència per saber on és el menú al DOM i tancar-lo si l'usuari clica fora.
  const menuRef = useRef(null);

  // Funció per tancar el menú quan l'usuari clica fora d'ell.
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú està obert i el clic NO és dins del menú
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Afegim l'escoltador d'esdeveniments quan el component es munta
    document.addEventListener('mousedown', handleClickOutside);

    // Eliminem l'escoltador quan el component es desmunta (per netejar)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Funció que cridem quan fem clic a una opció del menú.
  const handleOptionClick = (action) => {
    // Si la funció d'acció existeix, la cridem
    if (action) {
      action();
    }
    // Tanquem el menú després de fer l'acció
    setIsOpen(false);
  };

  return (
    // 'ref={menuRef}' connecta la referència amb el contenidor del botó i el menú
    <div className="relative inline-block text-left z-20" ref={menuRef}> 
      {/* Botó principal per obrir/tancar el menú */}
      <div>
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full transition duration-150 ease-in-out shadow-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Opcions de visualització i ordenació"
        >
          {/* Mostrem la icona de tancar (X) si el menú està obert, si no, la de menú. */}
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú Desplegable (es mostra si 'isOpen' és true) */}
      {isOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu" 
          aria-orientation="vertical" 
          aria-labelledby="options-menu"
        >
          <div className="py-1" role="none">
            
            {/* OPCIÓ 1: Canviar la vista (Llista o Quadrícula) */}
            <button
              onClick={() => handleOptionClick(onToggleView)}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              {isGridView ? (
                // Si actualment és Quadrícula, oferim canviar a Llista
                <>
                  <List className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                  Veure en Format Llista
                </>
              ) : (
                // Si actualment és Llista, oferim canviar a Quadrícula
                <>
                  <Grid3X3 className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                  Veure en Quadrícula
                </>
              )}
            </button>

            {/* OPCIÓ 2: Reordenar Productes (usant la icona corregida) */}
            <button
              onClick={() => handleOptionClick(onReorderProducts)}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              {/* ⭐ ÚS DE LA ICONA CORREGIDA */}
              <ArrowUpDown className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
              Reordenar Productes
            </button>

            {/* OPCIÓ 3: Reordenar Seccions (Obre el modal SectionOrderModal) */}
            <button
              onClick={() => handleOptionClick(onOpenSectionOrderModal)}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              <Layers className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
              Reordenar Seccions
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsMenu;
