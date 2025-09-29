import React, { useState, useEffect } from 'react';
import { RotateCw, Pencil } from 'lucide-react';
import { ShoppingBag } from 'lucide-react';

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
  opacity = 1
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Gestió del doble clic
  const handleCardClick = () => {
    if (!requireDoubleClick) {
      // Clic simple normal
      if (onAction) onAction();
      return;
    }

    // Lògica de doble clic
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
    }, 300);

    setClickTimer(timer);
  };

  // Neteja del timer
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
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
    return <ShoppingBag className={`${className} text-gray-600`} />;
  };

  return (
    <div className="relative w-full h-full" style={{ opacity }}>
      <div className="flip-card w-full h-full">
        <div className={`flip-card-inner w-full h-full ${isFlipped ? 'flip-card-flipped' : ""}`}>

          {/* Front de la carta */}
          <div 
            className={`flip-card-front bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} ${!requireDoubleClick ? 'cursor-pointer' : 'cursor-pointer select-none'}`} 
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
              className={`flip-card-back bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} ${!requireDoubleClick ? 'cursor-pointer' : 'cursor-pointer select-none'}`} 
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

      {/* Botó d'edició amb icona de LLAPIS */}
      {showEditButton && onEdit && (
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
    </div>
  );
};

export default ProductCard;
