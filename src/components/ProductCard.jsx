import React, { useState, useEffect, useRef } from 'react'; 
// Importem ShoppingBag que s'utilitzava a la funció renderItemIcon (calia afegir-lo)
import { RotateCw, Pencil, Menu, ShoppingBag } from 'lucide-react'; 

const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return "";
  const cleanedUrl = url.trim();
  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl;
  }
  if (cleanedUrl.includes('.') && !cleanedUrl.includes(' ')) {
    return 'https://' + cleanedUrl;
  }
  return "";
};

const ProductCard = ({
  item,
  onEdit,
  onAction,
  actionLabel,
  showEditButton = true,
  requireDoubleClick = false,
  additionalClasses = "",
  opacity = 1,
  onPressAndHold = null, 
  isDraggable = false 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  
  // Estats i refs per a la lògica de "mantenir premut" (Manté la definició per si es reactiva)
  const pressTimerRef = useRef(null);
  const isPressingRef = useRef(false);
  const PRESS_DURATION = 500; // 500ms per detectar "mantenir premut"

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Inicia la detecció de "mantenir premut"
  const handlePressStart = (e) => {
    // Evita conflictes amb la selecció de text en mòbils
    e.preventDefault(); 
    
    if (!onPressAndHold) return;

    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
        if (isPressingRef.current) {
            // "Mantenir premut" detectat
            onPressAndHold(item);
            // Si detectem mantenir premut, evitem el clic o doble clic.
            setClickCount(0); 
            if (clickTimer) clearTimeout(clickTimer);
            isPressingRef.current = false;
        }
    }, PRESS_DURATION);
  };
  
  // Finalitza la detecció de "mantenir premut"
  const handlePressEnd = () => {
      clearTimeout(pressTimerRef.current);
      isPressingRef.current = false;
  };
  
  // NOU: Funció general de clic (tap)
  const handleCardClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); // MOLT IMPORTANT: Assegurem que el clic no es propagui

    // Netejar el timer de press&hold si existia
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      if (isPressingRef.current) {
          isPressingRef.current = false;
          // Si es va detectar press & hold, sortim
          return; 
      }
    }
    
    if (!requireDoubleClick) {
      // Clic simple normal (per afegir/treure de la llista)
      if (onAction) onAction();
      return;
    }

    // Lògica de doble clic (per marcar/desmarcar com comprat)
    setClickCount(prev => prev + 1);

    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const timer = setTimeout(() => {
      if (clickCount + 1 === 2) {
        // Doble clic detectat
        if (onAction) onAction();
      }
      setClickCount(0);
    }, 300); // 300ms és el temps típic per un doble clic

    setClickTimer(timer);
  };

  // Neteja del timer de clic i del timer de "mantenir premut"
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, [clickTimer]);

  const renderItemIcon = (iconUrl, className = "w-16 h-16") => {
    if (iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'))) {
      return (
        <img
          src={iconUrl}
          alt="icona personalitzada"
          className={`${className} object-cover rounded`}
          onError={(e) => {
            e.target.src = 'https://placehold.co/64x64/cccccc/000000?text=Error';
          }}
        />
      );
    }
    // Si no hi ha URL vàlida, mostrem la icona predeterminada
    return <ShoppingBag className={`${className} text-gray-600`} />;
  };

  return (
    <div 
      className="relative w-full h-full" 
      style={{ opacity }}
      // Afegim els handlers per al "mantenir premut"
      onMouseDown={onPressAndHold ? handlePressStart : null}
      onMouseUp={onPressAndHold ? handlePressEnd : null}
      onMouseLeave={onPressAndHold ? handlePressEnd : null} 
      onTouchStart={onPressAndHold ? handlePressStart : null}
      onTouchEnd={onPressAndHold ? handlePressEnd : null}
    >
      <div className="flip-card w-full h-full">
        <div className={`flip-card-inner w-full h-full ${isFlipped ? 'flip-card-flipped' : ""}`}>

          {/* Front de la carta */}
          <div 
            // IMPORTANT: Utilitzem el nostre handleCardClick per gestionar el clic/doble clic
            className={`flip-card-front bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} cursor-pointer select-none`} 
            onClick={handleCardClick}
            title={actionLabel}
          >
            
            {/* Botó flip només si té segona imatge */}
            {item.secondIcon && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleToggleFlip(); 
                }}
                className="absolute top-2 left-2 p-1 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button-small z-10 transition-all-smooth hover:scale-110" 
                aria-label="Girar carta"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            )}

            {/* Icona principal */}
            <div className="flex-shrink-0 mb-3">{renderItemIcon(item.icon, 'w-16 h-16')}</div>

            {/* Text centrat */}
            <div className="text-center w-full flex-grow flex flex-col justify-center">
              <span className="font-semibold text-sm block text-center mb-1 leading-tight break-words">{item.name}</span>
              {item.quantity && (<span className="text-xs text-gray-500 block text-center mb-1">{item.quantity}</span>)}
              {item.section && (<span className="text-xs text-gray-400 block text-center">{item.section}</span>)}
            </div>
          </div>

          {/* Back de la carta (només si té segona imatge) */}
          {item.secondIcon && (
            <div 
              // IMPORTANT: Utilitzem el nostre handleCardClick per gestionar el clic/doble clic
              className={`flip-card-back bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} cursor-pointer select-none`} 
              onClick={handleCardClick}
              title={actionLabel}
            >

              {/* Botó per tornar */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleToggleFlip(); 
                }}
                className="absolute top-2 left-2 p-1 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button-small z-10 transition-all-smooth hover:scale-110" 
                aria-label="Tornar"
              >
                <RotateCw className="w-3 h-3" />
              </button>

              {/* Segona icona */}
              <div className="flex-shrink-0 mb-3">
                {renderItemIcon(item.secondIcon, 'w-16 h-16')}
              </div>

              {/* Text centrat */}
              <div className="text-center w-full flex-grow flex flex-col justify-center">
                <span className="font-semibold text-sm block text-center mb-1 leading-tight break-words">{item.name}</span>
                {item.quantity && (<span className="text-xs text-gray-500 block text-center mb-1">{item.quantity}</span>)}
                {item.section && (<span className="text-xs text-gray-400 block text-center">{item.section}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botó d'edició amb icona de LLAPIS (S'oculta si és reordenació) */}
      {showEditButton && onEdit && !isDraggable && (
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onEdit(item); 
          }} 
          className="absolute top-2 right-2 p-1 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-small z-10 transition-all-smooth hover:scale-110" 
          aria-label={`Edita ${item.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      
      {/* NOU: Botó per a reordenació (Drag handle) */}
      {isDraggable && (
          <div 
              className="absolute top-2 right-2 p-1 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-small z-10 cursor-grab"
              // Els handlers de drag and drop es gestionarien aquí
          >
              <Menu className="w-4 h-4" />
          </div>
      )}
    </div>
  );
};

export default ProductCard;
