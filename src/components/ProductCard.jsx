import React, { useState } from "react";
import { CheckCircle, Circle, Edit, Menu } from "lucide-react";

const ProductCard = ({
  item,
  onEdit,
  onAction,
  requireDoubleClick = false,
  showEditButton = true,
  isDraggable = false,
}) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    if (requireDoubleClick) {
      setClickCount((prev) => prev + 1);
      setTimeout(() => setClickCount(0), 300);
      if (clickCount === 1) {
        onAction?.(item);
      }
    } else {
      onAction?.(item);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl text-center select-none transition-all-smooth cursor-pointer
        box-shadow-neomorphic-element hover:box-shadow-neomorphic-element-hover
        ${item.isBought ? "opacity-60" : ""}
      `}
      onClick={handleClick}
    >
      {/* Drag handle */}
      {isDraggable && (
        <div
          className="absolute top-2 left-2 text-gray-400 cursor-grab"
          title="Arrossega per reordenar"
        >
          <Menu className="w-5 h-5" />
        </div>
      )}

      {/* Icona principal */}
      {item.icon ? (
        <img
          src={item.icon}
          alt={item.name}
          className="mx-auto mb-2 w-16 h-16 object-contain"
        />
      ) : (
        <div className="mx-auto mb-2 w-16 h-16 flex items-center justify-center text-gray-400">
          <Circle className="w-10 h-10" />
        </div>
      )}

      {/* Icona secundària (ampliable) */}
      {item.secondIcon && (
        <img
          src={item.secondIcon}
          alt={`${item.name} secundària`}
          className="mx-auto mb-2 w-8 h-8 object-contain cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent("expandImage", {
              detail: item.secondIcon,
            });
            window.dispatchEvent(event);
          }}
        />
      )}

      {/* Nom i quantitat */}
      <div className="font-bold text-gray-700">{item.name}</div>
      {item.quantity && (
        <div className="text-sm text-gray-500">{item.quantity}</div>
      )}

      {/* Botó editar */}
      {showEditButton && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          title="Editar"
        >
          <Edit className="w-5 h-5" />
        </button>
      )}

      {/* Marcar com comprat */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction?.(item);
        }}
        className="absolute bottom-2 right-2 text-green-500 hover:text-green-700"
        title={item.isBought ? "Marcar com pendent" : "Marcar com comprat"}
      >
        {item.isBought ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default ProductCard;
