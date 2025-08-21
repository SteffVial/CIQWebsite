import React, { useState, useRef, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const ListBlock = ({ block, isSelected, onUpdate, onSelect, onFocus }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const toolbarRef = useRef(null);
  const listRef = useRef(null);

  const handleClick = () => {
    onSelect();
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!toolbarRef.current?.contains(document.activeElement)) {
        setShowToolbar(false);
        setSelectedItemIndex(null);
      }
    }, 100);
  };

  const updateItems = useCallback((newItems) => {
    onUpdate({
      content: {
        ...block.content,
        items: newItems.filter(item => item.trim() !== '' || newItems.length === 1)
      }
    });
  }, [block.content, onUpdate]);

  const updateItem = (index, value) => {
    const newItems = [...block.content.items];
    newItems[index] = value;
    updateItems(newItems);
  };

  const addItem = (afterIndex = -1) => {
    const newItems = [...block.content.items];
    if (afterIndex >= 0) {
      newItems.splice(afterIndex + 1, 0, '');
    } else {
      newItems.push('');
    }
    updateItems(newItems);

    // Focus sur le nouvel item après mise à jour
    setTimeout(() => {
      const targetIndex = afterIndex >= 0 ? afterIndex + 1 : newItems.length - 1;
      const input = listRef.current?.children[targetIndex]?.querySelector('input');
      input?.focus();
    }, 50);
  };

  const removeItem = (index) => {
    if (block.content.items.length <= 1) return; // Garder au moins un item

    const newItems = [...block.content.items];
    newItems.splice(index, 1);
    updateItems(newItems);
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= block.content.items.length) return;

    const newItems = [...block.content.items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    updateItems(newItems);
  };

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        addItem(index);
        break;

      case 'Backspace':
        if (e.target.value === '' && block.content.items.length > 1) {
          e.preventDefault();
          removeItem(index);
          // Focus sur l'item précédent
          const prevIndex = Math.max(0, index - 1);
          setTimeout(() => {
            const input = listRef.current?.children[prevIndex]?.querySelector('input');
            input?.focus();
          }, 50);
        }
        break;

      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          moveItem(index, index - 1);
        }
        break;

      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          moveItem(index, index + 1);
        }
        break;
    }
  };

  const updateListType = (listType) => {
    onUpdate({
      content: {
        ...block.content,
        listType
      }
    });
  };

  const updateBulletStyle = (bulletStyle) => {
    onUpdate({
      styles: {
        ...block.styles,
        bulletStyle
      }
    });
  };

  const updateNumberStyle = (numberStyle) => {
    onUpdate({
      styles: {
        ...block.styles,
        numberStyle
      }
    });
  };

  const updateIndentation = (indentation) => {
    onUpdate({
      styles: {
        ...block.styles,
        indentation
      }
    });
  };

  const getListType = () => block.content.listType || 'bullet';
  const getBulletStyle = () => block.styles?.bulletStyle || 'disc';
  const getNumberStyle = () => block.styles?.numberStyle || 'decimal';
  const getIndentation = () => block.styles?.indentation || 0;

  const getBulletChar = (style) => {
    const bullets = {
      disc: '•',
      circle: '○',
      square: '▪'
    };
    return bullets[style] || '•';
  };

  const getNumberPrefix = (index, style) => {
    switch (style) {
      case 'decimal':
        return `${index + 1}.`;
      case 'roman':
        return `${toRoman(index + 1)}.`;
      case 'alpha':
        return `${String.fromCharCode(97 + index)}.`;
      default:
        return `${index + 1}.`;
    }
  };

  const toRoman = (num) => {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';

    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    return result.toLowerCase();
  };

  const items = block.content.items || [''];

  return (
    <div className="relative group">
      {/* Floating toolbar */}
      {showToolbar && isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-0 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1 z-30"
        >
          {/* List type selector */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateListType('bullet')}
              className={`px-2 py-1 text-xs rounded ${getListType() === 'bullet' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
              title="Liste à puces"
            >
              • Liste
            </button>
            <button
              onClick={() => updateListType('numbered')}
              className={`px-2 py-1 text-xs rounded ${getListType() === 'numbered' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
              title="Liste numérotée"
            >
              1. Liste
            </button>
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Style options based on list type */}
          {getListType() === 'bullet' ? (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => updateBulletStyle('disc')}
                className={`px-2 py-1 text-xs rounded ${getBulletStyle() === 'disc' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Puce pleine"
              >
                •
              </button>
              <button
                onClick={() => updateBulletStyle('circle')}
                className={`px-2 py-1 text-xs rounded ${getBulletStyle() === 'circle' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Puce vide"
              >
                ○
              </button>
              <button
                onClick={() => updateBulletStyle('square')}
                className={`px-2 py-1 text-xs rounded ${getBulletStyle() === 'square' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Puce carrée"
              >
                ▪
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => updateNumberStyle('decimal')}
                className={`px-2 py-1 text-xs rounded ${getNumberStyle() === 'decimal' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Numéros"
              >
                1,2,3
              </button>
              <button
                onClick={() => updateNumberStyle('roman')}
                className={`px-2 py-1 text-xs rounded ${getNumberStyle() === 'roman' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Chiffres romains"
              >
                i,ii,iii
              </button>
              <button
                onClick={() => updateNumberStyle('alpha')}
                className={`px-2 py-1 text-xs rounded ${getNumberStyle() === 'alpha' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                title="Lettres"
              >
                a,b,c
              </button>
            </div>
          )}

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Indentation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateIndentation(Math.max(0, getIndentation() - 1))}
              className="px-2 py-1 text-xs rounded hover:bg-gray-700"
              title="Réduire l'indentation"
              disabled={getIndentation() <= 0}
            >
              ←
            </button>
            <span className="px-2 py-1 text-xs">{getIndentation()}</span>
            <button
              onClick={() => updateIndentation(getIndentation() + 1)}
              className="px-2 py-1 text-xs rounded hover:bg-gray-700"
              title="Augmenter l'indentation"
            >
              →
            </button>
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Add item */}
          <button
            onClick={() => addItem()}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Ajouter un élément"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* List content */}
      <div
        className={`
          w-full p-3 border-2 border-transparent rounded-md transition-all duration-200
          ${isSelected
            ? 'border-cyner-blue bg-blue-50'
            : 'hover:border-gray-200 hover:bg-gray-50'
          }
        `}
        onClick={handleClick}
        onBlur={handleBlur}
        tabIndex={0}
        style={{ paddingLeft: `${1 + getIndentation() * 1.5}rem` }}
      >
        <div ref={listRef} className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 group/item"
              onMouseEnter={() => setSelectedItemIndex(index)}
              onMouseLeave={() => setSelectedItemIndex(null)}
            >
              {/* List marker */}
              <div className="flex-shrink-0 w-6 text-center text-gray-500 font-medium pt-0.5">
                {getListType() === 'bullet'
                  ? getBulletChar(getBulletStyle())
                  : getNumberPrefix(index, getNumberStyle())
                }
              </div>

              {/* Item input */}
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={onFocus}
                placeholder={index === 0 ? "Premier élément..." : "Nouvel élément..."}
                className="flex-1 border-none focus:outline-none focus:ring-0 bg-transparent text-gray-900 placeholder-gray-400"
                style={{ direction: 'ltr', unicodeBidi: 'normal' }}
                dir="ltr"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Item actions */}
              <div className={`flex items-center space-x-1 transition-opacity duration-200 ${selectedItemIndex === index ? 'opacity-100' : 'opacity-0'
                }`}>
                {/* Move up */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveItem(index, index - 1);
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Déplacer vers le haut"
                >
                  <Bars3Icon className="h-3 w-3 transform rotate-90" />
                </button>

                {/* Add item after */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(index);
                  }}
                  className="p-1 text-gray-400 hover:text-cyner-blue"
                  title="Ajouter un élément"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>

                {/* Remove item */}
                {items.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Supprimer cet élément"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help text */}
        {isSelected && (
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-200 pt-2">
            <p>💡 <strong>Raccourcis :</strong> Entrée = nouvel élément • Retour arrière = supprimer • Ctrl+↑↓ = déplacer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListBlock;