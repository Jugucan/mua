import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';

const EditItemModal = ({ item, onClose, onSave, onDelete, availableSections }) => {
  const [editedName, setEditedName] = useState(item.name);
  const [editedQuantity, setEditedQuantity] = useState(item.quantity || "");
  const [editedIcon, setEditedIcon] = useState(item.icon || 'ShoppingBag');
  const [editedSecondIcon, setEditedSecondIcon] = useState(item.secondIcon || "");
  const [editedSection, setEditedSection] = useState(item.section || "");

  const handleSave = () => {
    onSave(item.id, {
      name: editedName,
      quantity: editedQuantity,
      icon: editedIcon,
      secondIcon: editedSecondIcon,
      section: editedSection.trim() === '' ? null : editedSection.trim()
    });
    onClose();
  };

  const renderIcon = (iconString) => {
    if (iconString && (iconString.startsWith('http://') || iconString.startsWith('https://'))) {
      return (
        <img
          src={iconString}
          alt="icona"
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            e.target.src = 'https://placehold.co/48x48/cccccc/000000?text=Error';
          }}
        />
      );
    }
    return <ShoppingBag className="w-12 h-12 text-gray-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-[#f0f3f5] p-6 rounded-lg w-full max-w-md relative box-shadow-neomorphic-container">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold mb-4 text-gray-700">Edita l'element</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'element</label>
          <input
            type="text"
            className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantitat</label>
          <input
            type="text"
            className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
            value={editedQuantity}
            onChange={(e) => setEditedQuantity(e.target.value)}
            placeholder="Ex: 1 kg, 2 litres..."
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Icona Principal (URL)</label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden box-shadow-neomorphic-element">
              {renderIcon(editedIcon)}
            </div>
            <input
              type="text"
              placeholder="URL de la imatge (opcional)"
              className="flex-grow p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
              value={editedIcon}
              onChange={(e) => setEditedIcon(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Icona Secundària (URL - Opcional)</label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden box-shadow-neomorphic-element">
              {renderIcon(editedSecondIcon)}
            </div>
            <input
              type="text"
              placeholder="URL de la imatge secundària (opcional)"
              className="flex-grow p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
              value={editedSecondIcon}
              onChange={(e) => setEditedSecondIcon(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Secció / Passadís</label>
          <input
            type="text"
            list="sections-datalist"
            className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
            value={editedSection}
            onChange={(e) => setEditedSection(e.target.value)}
            placeholder="Ex: Làctics, Fruita i Verdura"
          />
          <datalist id="sections-datalist">
            {availableSections.map((section, index) => (
              <option key={index} value={section} />
            ))}
          </datalist>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-[#f0f3f5] text-gray-700 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold">
            Cancel·la
          </button>
          <button onClick={() => { onDelete(item); onClose(); }} className="px-4 py-2 bg-[#f0f3f5] text-red-500 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold">
            Elimina
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#f0f3f5] text-green-500 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold">
            Desa
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
