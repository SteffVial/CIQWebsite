import React, { useState, useRef } from 'react';

const SeparatorBlock = ({ block, isSelected, onUpdate, onSelect }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const toolbarRef = useRef(null);

  const handleClick = () => {
    onSelect();
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!toolbarRef.current?.contains(document.activeElement)) {
        setShowToolbar(false);
      }
    }, 100);
  };

  const updateStyle = (property, value) => {
    onUpdate({
      styles: {
        ...block.styles,
        [property]: value
      }
    });
  };

  const getStyle = () => {
    return block.styles?.style || 'line';
  };

  const getThickness = () => {
    return block.styles?.thickness || 'medium';
  };

  const getSpacing = () => {
    return block.styles?.spacing || 'medium';
  };

  const getSpacingClasses = () => {
    const spacingMap = {
      small: 'py-2',
      medium: 'py-4',
      large: 'py-8'
    };
    return spacingMap[getSpacing()] || 'py-4';
  };

  const getThicknessClasses = () => {
    const thicknessMap = {
      thin: 'h-px',
      medium: 'h-0.5',
      thick: 'h-1'
    };
    return thicknessMap[getThickness()] || 'h-0.5';
  };

  const renderSeparator = () => {
    const style = getStyle();
    const commonClasses = `w-full transition-all duration-200 ${
      isSelected ? 'bg-cyner-blue' : 'bg-gray-300'
    }`;

    switch (style) {
      case 'line':
        return (
          <div className={`${commonClasses} ${getThicknessClasses()}`} />
        );
        
      case 'dots':
        return (
          <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isSelected ? 'bg-cyner-blue' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        );
        
      case 'stars':
        return (
          <div className="flex justify-center items-center space-x-3">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={`text-lg transition-all duration-200 ${
                  isSelected ? 'text-cyner-blue' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        );
        
      case 'wave':
        return (
          <div className="flex justify-center">
            <svg
              width="100"
              height="20"
              viewBox="0 0 100 20"
              className={`transition-all duration-200 ${
                isSelected ? 'text-cyner-blue' : 'text-gray-300'
              }`}
            >
              <path
                d="M0,10 Q25,0 50,10 T100,10"
                stroke="currentColor"
                strokeWidth={getThickness() === 'thin' ? '1' : getThickness() === 'thick' ? '3' : '2'}
                fill="none"
              />
            </svg>
          </div>
        );
        
      default:
        return (
          <div className={`${commonClasses} ${getThicknessClasses()}`} />
        );
    }
  };

  return (
    <div className="relative group">
      {/* Floating toolbar */}
      {showToolbar && isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1 z-30"
        >
          {/* Style selector */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateStyle('style', 'line')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'line' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Ligne"
            >
              —
            </button>
            <button
              onClick={() => updateStyle('style', 'dots')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'dots' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Points"
            >
              • • •
            </button>
            <button
              onClick={() => updateStyle('style', 'stars')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'stars' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Étoiles"
            >
              ★ ★ ★
            </button>
            <button
              onClick={() => updateStyle('style', 'wave')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'wave' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Vague"
            >
              ～
            </button>
          </div>

          {getStyle() === 'line' && (
            <>
              <div className="w-px h-4 bg-gray-700 mx-1"></div>
              
              {/* Thickness selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => updateStyle('thickness', 'thin')}
                  className={`px-2 py-1 text-xs rounded ${
                    getThickness() === 'thin' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                  title="Fin"
                >
                  ▁
                </button>
                <button
                  onClick={() => updateStyle('thickness', 'medium')}
                  className={`px-2 py-1 text-xs rounded ${
                    getThickness() === 'medium' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                  title="Moyen"
                >
                  ▄
                </button>
                <button
                  onClick={() => updateStyle('thickness', 'thick')}
                  className={`px-2 py-1 text-xs rounded ${
                    getThickness() === 'thick' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                  }`}
                  title="Épais"
                >
                  █
                </button>
              </div>
            </>
          )}

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Spacing selector */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateStyle('spacing', 'small')}
              className={`px-2 py-1 text-xs rounded ${
                getSpacing() === 'small' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Espacement petit"
            >
              S
            </button>
            <button
              onClick={() => updateStyle('spacing', 'medium')}
              className={`px-2 py-1 text-xs rounded ${
                getSpacing() === 'medium' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Espacement moyen"
            >
              M
            </button>
            <button
              onClick={() => updateStyle('spacing', 'large')}
              className={`px-2 py-1 text-xs rounded ${
                getSpacing() === 'large' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Espacement grand"
            >
              L
            </button>
          </div>
        </div>
      )}

      {/* Separator content */}
      <div
        className={`
          w-full flex items-center justify-center cursor-pointer transition-all duration-200
          ${getSpacingClasses()}
          ${isSelected 
            ? 'bg-blue-50 border-2 border-cyner-blue rounded-md' 
            : 'hover:bg-gray-50 border-2 border-transparent rounded-md'
          }
        `}
        onClick={handleClick}
        onBlur={handleBlur}
        tabIndex={0}
      >
        {renderSeparator()}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-cyner-blue text-white text-xs font-bold rounded-full">
            —
          </span>
        </div>
      )}
    </div>
  );
};

export default SeparatorBlock;