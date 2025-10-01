import React from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ src, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        <img 
          src={src} 
          alt="Expanded" 
          className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" 
        />
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
          aria-label="Tancar imatge"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
