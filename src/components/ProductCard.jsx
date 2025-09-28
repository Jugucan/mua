import React, { useState } from 'react'; // [cite: 1] IMPORTEM useState
import { RotateCw, CreditCard as Edit, RotateCcw } from 'lucide-react'; // [cite: 2, 73] Afegim RotateCcw
import { ShoppingBag } from 'lucide-react'; // [cite: 3]

// [cite: 4]
const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return ""; // [cite: 5]
    const cleanedUrl = url.trim(); // [cite: 6]
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) { // [cite: 7]
        return cleanedUrl; // [cite: 9]
    }
    if (cleanedUrl.includes('.') && !cleanedUrl.includes(' ')) { // [cite: 10]
        return 'https://' + cleanedUrl; // [cite: 11]
    }
    return ""; // [cite: 14]
};

const ProductCard = ({ // [cite: 15]
    item, // [cite: 16]
    onToggleFlip, // ELIMINAT: Ja no s'utilitza a l'interior, però el deixem com a prop per no trencar la signatura
    onEdit, // [cite: 18]
    onAction, // [cite: 19]
    actionLabel, // [cite: 20]
    showEditButton = true, // [cite: 21]
    additionalClasses = "", // [cite: 22]
    opacity = 1 // [cite: 23]
}) => {
    // 1. ESTAT LOCAL: Per controlar el flip internament
    const [isFlipped, setIsFlipped] = useState(false);

    // 2. FUNCIÓ PER GESTIONAR EL FLIP LOCALMENT
    const handleFlip = (e) => {
        e.stopPropagation(); // Evitem que el clic es propagui al pare
        setIsFlipped(prev => !prev);
    };

    const renderItemIcon = (iconUrl, className = "w-16 h-16", onClick) => { // [cite: 25]
        if (iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'))) { // [cite: 26]
            return ( // [cite: 27]
                <img // [cite: 28]
                    src={iconUrl} // [cite: 29]
                    alt="icona personalitzada" // [cite: 32]
                    className={`${className} object-cover rounded ${onClick ? 'cursor-pointer' : ""}`}
                    onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined} // [cite: 33]
                    onError={(e) => { // [cite: 34]
                        e.target.src = 'https://placehold.co/64x64/cccccc/000000?text=Error'; // [cite: 35]
                    }}
                /> // [cite: 37]
            );
        }
        return ( // [cite: 38]
            <div onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined} // [cite: 39]
                className={onClick ? 'cursor-pointer' : ""}>
                <ShoppingBag className={`${className} text-gray-600`} /> {/* [cite: 42] */}
            </div>
        );
    };

    return ( // [cite: 44]
        <div className="relative w-full h-full" style={{ opacity }}> {/* [cite: 45] */}
            <div className="flip-card w-full h-full" style={{ perspective: '1000px' }}> {/* [cite: 46] */}
                {/* APLICA LA PROPIETAT LOCAL isFlipped */}
                <div className={`flip-card-inner w-full h-full ${isFlipped ? 'flip-card-flipped' : ""}`}> {/* [cite: 47, 48] */}
                    
                    {/* Front de la carta */}
                    <div className={`flip-card-front bg-white rounded-lg p-4 flex flex-col items-center
                        justify-center min-h-[180px] w-full ${additionalClasses}} onClick={onAction}> {/* [cite: 50] */}
                        
                        {/* Botó flip només si té segona imatge */}
                        {item.secondIcon && ( // [cite: 52]
                            <button 
                                onClick={handleFlip} // USA LA NOVA FUNCIÓ LOCAL handleFlip
                                className="absolute top-2 left-2 p-1 rounded-full bg-[#f0f3f5] text-blue-500 box-
                                    shadow-neomorphic-button-small z-10" aria-label="Girar carta"> {/* [cite: 53] */}
                                <RotateCw className="w-3 h-3" /> {/* [cite: 55] */}
                            </button>
                        )} {/* [cite: 54] */}

                        {/* Icona principal */}
                        <div className="flex-shrink-0 mb-3">{renderItemIcon(item.icon, 'w-16 h-16')}</div> {/* [cite: 58] */}
                        
                        {/* Text centrat - Més espai per a noms llargs */}
                        <div className="text-center w-full flex-grow flex flex-col justify-center"> {/* [cite: 60] */}
                            <span className="font-semibold text-sm block text-center mb-1 leading-tight
                                break-words">{item.name}</span> {/* [cite: 61] */}
                            {item.quantity && (<span className="text-xs text-gray-500 block text-center mb-
                                1">{item.quantity}</span>)} {/* [cite: 62] */}
                            {item.section && (<span className="text-xs text-gray-400 block text-
                                center">{item.section}</span>)} {/* [cite: 63, 64] */}
                        </div> {/* [cite: 65] */}
                    </div> {/* [cite: 66] */}

                    {/* Back de la carta (només si té segona imatge) */}
                    {item.secondIcon && ( // [cite: 68]
                        <div className={`flip-card-back bg-white rounded-lg p-4 flex flex-col items-center
                            justify-center min-h-[180px] w-full ${additionalClasses}} onClick={onAction}> {/* [cite: 69, 70] */}
                            
                            {/* Botó per tornar */}
                            <button 
                                onClick={handleFlip} // USA LA NOVA FUNCIÓ LOCAL handleFlip
                                className="absolute top-2 left-2 p-1 rounded-full bg-[#f0f3f5] text-blue-500 box-
                                    shadow-neomorphic-button-small z-10" aria-label="Tornar"> {/* [cite: 72] */}
                                <RotateCcw className="w-3 h-3" /> {/* Canviem a RotateCcw per coherència visual al "tornar" */}
                            </button> {/* [cite: 74] */}

                            {/* Segona icona */}
                            <div className="flex-shrink-0 mb-3"> {/* [cite: 76] */}
                                {renderItemIcon(item.secondIcon, 'w-16 h-16', () => { // [cite: 77]
                                    const url = cleanImageUrl(item.secondIcon) || item.secondIcon; // [cite: 78]
                                    if (url && onAction) onAction(); // [cite: 79]
                                })} {/* [cite: 81] */}
                            </div> {/* [cite: 82] */}

                            {/* Text centrat - Més espai per a noms llargs */}
                            <div className="text-center w-full flex-grow flex flex-col justify-center"> {/* [cite: 84] */}
                                <span className="font-semibold text-sm block text-center mb-1 leading-tight
                                    break-words">{item.name}</span> {/* [cite: 85, 86] */}
                                {item.quantity && (<span className="text-xs text-gray-500 block text-center mb-
                                    1">{item.quantity}</span>)} {/* [cite: 87, 88] */}
                                {item.section && (<span className="text-xs text-gray-400 block text-
                                    center">{item.section}</span>)} {/* [cite: 89, 90] */}
                            </div> {/* [cite: 91] */}
                        </div>
                    )} {/* [cite: 93] */}
                </div> {/* [cite: 94] */}
            </div> {/* [cite: 95] */}
            
            {/* Botó d'edició fora del flip per ser sempre visible */}
            {showEditButton && ( // [cite: 97]
                <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="absolute
                    top-2 right-2 p-1 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-
                    small" aria-label={`Edita ${item.name}`}> {/* [cite: 98] */}
                    <Edit className="w-4 h-4" /> {/* [cite: 101] */}
                </button> {/* [cite: 102] */}
            )} {/* [cite: 103] */}
        </div> // [cite: 104]
    );
}; // [cite: 99, 100]

export default ProductCard; // [cite: 105]
