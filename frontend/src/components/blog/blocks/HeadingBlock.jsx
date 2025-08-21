import React, { useState, useRef } from 'react';

const HeadingBlock = ({ block, isSelected, onUpdate, onSelect, onFocus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const textRef = useRef(null);
  const toolbarRef = useRef(null);

  const handleClick = () => {
    onSelect();
    setIsEditing(true);
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!toolbarRef.current?.contains(document.activeElement)) {
        setIsEditing(false);
        setShowToolbar(false);
      }
    }, 100);
  };

  const handleInput = (e) => {
    const text = e.target.textContent;
    onUpdate({
      content: {
        ...block.content,
        text: text
      }
    });
  };

  const handleKeyDown = (e) => {
  // Empêcher les sauts de ligne dans les titres
  if (e.key === 'Enter') {
    e.preventDefault();
  }

  // 🔧 NOUVEAU : Forcer la direction après chaque frappe
  setTimeout(() => {
    const element = e.target;
    if (element) {
      const content = element.textContent;
      // Réappliquer le contenu pour forcer la direction
      element.textContent = content;
      
      // Repositionner le curseur à la fin
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, 10);

  // Raccourcis pour changer le niveau (reste inchangé)
  if (e.ctrlKey || e.metaKey) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) {
      e.preventDefault();
      updateLevel(num);
    }
  }
};

  const updateLevel = (level) => {
    onUpdate({
      content: {
        ...block.content,
        level: level
      }
    });
  };

  const updateAlignment = (alignment) => {
    onUpdate({
      styles: {
        ...block.styles,
        alignment: alignment
      }
    });
  };

  const getAlignment = () => {
    return block.styles?.alignment || 'left';
  };

  const getTextAlign = () => {
    const alignMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return alignMap[getAlignment()] || 'text-left';
  };

  const getHeadingClasses = () => {
    const level = block.content.level || 2;
    const baseClasses = 'font-bold text-gray-900 leading-tight';

    const sizeClasses = {
      1: 'text-4xl md:text-5xl',
      2: 'text-3xl md:text-4xl',
      3: 'text-2xl md:text-3xl',
      4: 'text-xl md:text-2xl',
      5: 'text-lg md:text-xl',
      6: 'text-base md:text-lg'
    };

    return `${baseClasses} ${sizeClasses[level]} ${getTextAlign()}`;
  };

  const getHeadingTag = () => {
    const level = block.content.level || 2;
    return `h${level}`;
  };

  const HeadingComponent = getHeadingTag();

  return (
    <div className="relative group">
      {/* Floating toolbar */}
      {showToolbar && isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-0 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1 z-30"
        >
          {/* Heading level selector */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => updateLevel(level)}
                className={`px-2 py-1 text-xs rounded ${block.content.level === level
                    ? 'bg-cyner-blue text-white'
                    : 'hover:bg-gray-700'
                  }`}
                title={`Titre niveau ${level} (Ctrl+${level})`}
              >
                H{level}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Alignment controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateAlignment('left')}
              className={`p-1.5 text-xs rounded ${getAlignment() === 'left' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
              title="Aligner à gauche"
            >
              ↰
            </button>
            <button
              onClick={() => updateAlignment('center')}
              className={`p-1.5 text-xs rounded ${getAlignment() === 'center' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
              title="Centrer"
            >
              ≡
            </button>
            <button
              onClick={() => updateAlignment('right')}
              className={`p-1.5 text-xs rounded ${getAlignment() === 'right' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
              title="Aligner à droite"
            >
              ↱
            </button>
          </div>

          {/* Color picker (bonus) */}
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <input
            type="color"
            value={block.styles?.color || '#1F2937'}
            onChange={(e) => onUpdate({
              styles: {
                ...block.styles,
                color: e.target.value
              }
            })}
            className="w-6 h-6 rounded border-none cursor-pointer"
            title="Couleur du texte"
          />
        </div>
      )}

      {/* Heading content */}
      <HeadingComponent
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className={`
          w-full p-3 min-h-[3rem] outline-none border-2 border-transparent rounded-md transition-all duration-200
          ${getHeadingClasses()}
          ${isSelected
            ? 'border-cyner-blue bg-blue-50'
            : 'hover:border-gray-200 hover:bg-gray-50'
          }
          ${!block.content.text ? 'text-gray-400' : ''}
        `}
        style={{
          color: block.styles?.color || undefined,
          direction: 'ltr',
          unicodeBidi: 'normal'
        }}
        dir="ltr"
        onClick={handleClick}
        onFocus={onFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{
          __html: block.content.text || ''
        }}
        data-placeholder={!block.content.text ? `Titre niveau ${block.content.level || 2}...` : undefined}
      />

      {/* Level indicator */}
      {isSelected && (
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-cyner-blue text-white text-xs font-bold rounded-full">
            H{block.content.level || 2}
          </span>
        </div>
      )}

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
          font-weight: normal;
        }
        [contenteditable]:focus::before {
          content: none;
        }
      `}</style>
    </div>
  );
};

export default HeadingBlock;