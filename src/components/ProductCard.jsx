import React, { useState, useEffect, useRef } from 'react'; 
import { RotateCw, Pencil, Menu, ShoppingBag } from 'lucide-react'; 
import ImageModal from './ImageModal';

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
  isDraggable = false,
  isShoppingList = false, 
  isPantryList = false 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const pressTimerRef = useRef(null);
  const isPressingRef = useRef(false);
  const PRESS_DURATION = 500;

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePressStart = (e) => {
    e.preventDefault(); 
    if (!onPressAndHold) return;

    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        onPressAndHold(item);
        setClickCount(0); 
        if (clickTimer) clearTimeout(clickTimer);
        isPressingRef.current = false;
      }
    }, PRESS_DURATION);
  };
  
  const handlePressEnd = () => {
    clearTimeout(pressTimerRef.current);
    isPressingRef.current = false;
  };
  
  const handleCardClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      if (isPressingRef.current) {
        isPressingRef.current = false;
        return; 
      }
    }
    
    // ⭐⭐⭐ MODIFICACIÓ DEFINITIVA: Forçar sol clic si no es requereix doble clic 
    // O si l'ítem ja està comprat (assumim que és l'acció de la Despensa) ⭐⭐⭐
    if (!requireDoubleClick || item.isBought) {
      if (onAction) onAction();
      return;
    }
    // ⭐⭐⭐ FI MODIFICACIÓ DEFINITIVA ⭐⭐⭐


    // Lògica de doble clic (només si requireDoubleClick és true I item.isBought és false)
    setClickCount(prev => prev + 1);
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const timer = setTimeout(() => {
      if (clickCount + 1 === 2) {
        if (onAction) onAction();
      }
      setClickCount(0);
    }, 300);

    setClickTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (clickTimer) clearTimeout(clickTimer);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, [clickTimer]);

  const renderItemIcon = (iconUrl, className = "w-16 h-16", clickable = false) => {
    if (iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'))) {
      return (
        <img
          src={iconUrl}
          alt="icona personalitzada"
          className={`${className} object-contain rounded ${clickable ? 'cursor-zoom-in' : ''}`}
          onError={(e) => {
            e.target.src = 'https://placehold.co/64x64/cccccc/000000?text=Error';
          }}
          onClick={clickable ? (e) => {
            e.stopPropagation();
            setModalImage(iconUrl);
            setIsImageModalOpen(true);
          } : undefined}
        />
      );
    }
    return <ShoppingBag className={`${className} text-gray-600`} />;
  };
  
  // LÒGICA DE GRISAT: Només aplicar grisat si és llista de la compra I està comprat
  const shouldBeGrayedOut = isShoppingList && item.isBought && !isPantryList; 
  const purchasedClass = shouldBeGrayedOut ? 'product-card-purchased' : '';
  
  const nameStyleClass = shouldBeGrayedOut ? 'line-through text-gray-400' : 
    (additionalClasses.includes('box-shadow-neomorphic-element-red') && !item.isBought ? 'product-name-pending' : '');

  return (
    <>
      <div 
        className={`relative w-full h-full ${purchasedClass}`}
        style={{ opacity }}
        onMouseDown={onPressAndHold ? handlePressStart : null}
        onMouseUp={onPressAndHold ? handlePressEnd : null}
        onMouseLeave={onPressAndHold ? handlePressEnd : null} 
        onTouchStart={onPressAndHold ? handlePressStart : null}
        onTouchEnd={onPressAndHold ? handlePressEnd : null}
      >
        <div className="flip-card w-full h-full">
          <div className={`flip-card-inner w-full h-full ${isFlipped ? 'flip-card-flipped' : ""}`}>

            {/* Front */}
            <div
              className={`flip-card-front bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} cursor-pointer select-none`}
              onClick={handleCardClick}
              title={actionLabel}
            >
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

              {item.quantity && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                  {item.quantity}
                </div>
              )}

              <div className="flex-shrink-0 mb-3">{renderItemIcon(item.icon, 'w-16 h-16')}</div>

              <div className="text-center w-full flex-grow flex flex-col justify-center">
                <span className={`font-semibold text-sm block text-center mb-1 leading-tight break-words ${nameStyleClass}`}>
                  {item.name}
                </span>
                {item.section && (<span className="text-xs text-gray-400 block text-center">{item.section}</span>)}
              </div>
            </div>

            {/* Back */}
            {item.secondIcon && (
              <div
                className={`flip-card-back bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] w-full ${additionalClasses} cursor-pointer select-none`}
                onClick={handleCardClick}
                title={actionLabel}
              >
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

                {item.quantity && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    {item.quantity}
                  </div>
                )}

                <div className="flex-shrink-0 mb-3">
                  {renderItemIcon(item.secondIcon, 'w-16 h-16', true)}
                </div>

                <div className="text-center w-full flex-grow flex flex-col justify-center">
                  <span className={`font-semibold text-sm block text-center mb-1 leading-tight break-words ${nameStyleClass}`}>
                    {item.name}
                  </span>
                  {item.section && (<span className="text-xs text-gray-400 block text-center">{item.section}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {showEditButton && onEdit && !isDraggable && (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(item); 
            }} 
            className={`absolute top-2 right-2 p-1 rounded-full bg-[#f0f3f5] ${shouldBeGrayedOut ? 'text-gray-400' : 'text-gray-600'} box-shadow-neomorphic-button-small z-10 transition-all-smooth hover:scale-110`} 
            aria-label={`Edita ${item.name}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        
        {isDraggable && (
          <div 
            className={`absolute top-2 right-2 p-1 rounded-full bg-[#f0f3f5] ${shouldBeGrayedOut ? 'text-gray-400' : 'text-gray-600'} box-shadow-neomorphic-button-small z-10 cursor-grab`}
          >
            <Menu className="w-4 h-4" />
          </div>
        )}
      </div>

      {isImageModalOpen && (
        <ImageModal 
          src={modalImage} 
          onClose={() => setIsImageModalOpen(false)} 
        />
      )}
    </>
  );
};

export default ProductCard;
