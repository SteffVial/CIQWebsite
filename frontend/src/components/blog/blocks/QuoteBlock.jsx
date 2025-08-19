import React, { useState, useRef } from 'react';
import {
  LinkIcon
} from '@heroicons/react/24/outline';

const QuoteBlock = ({ block, isSelected, onUpdate, onSelect, onFocus }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const toolbarRef = useRef(null);
  const quoteRef = useRef(null);

  const handleClick = () => {
    onSelect();
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!toolbarRef.current?.contains(document.activeElement)) {
        setShowToolbar(false);
        setActiveField(null);
      }
    }, 100);
  };

  const updateContent = (property, value) => {
    onUpdate({
      content: {
        ...block.content,
        [property]: value
      }
    });
  };

  const updateStyle = (property, value) => {
    onUpdate({
      styles: {
        ...block.styles,
        [property]: value
      }
    });
  };

  const getStyle = () => block.styles?.style || 'classic';
  const getAlignment = () => block.styles?.alignment || 'left';

  const getStyleClasses = () => {
    const style = getStyle();
    const alignment = getAlignment();

    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center', 
      right: 'text-right'
    };

    const baseClasses = `transition-all duration-200 ${alignmentClasses[alignment]}`;

    switch (style) {
      case 'classic':
        return {
          container: `${baseClasses} bg-gray-50 border-l-4 border-cyner-blue pl-6 pr-4 py-4`,
          quote: 'text-lg text-gray-700 font-medium italic leading-relaxed',
          author: 'text-sm text-gray-600 font-semibold mt-3',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-4xl text-cyner-blue opacity-50 font-serif'
        };
        
      case 'modern':
        return {
          container: `${baseClasses} bg-white border border-gray-200 rounded-lg p-6 shadow-sm`,
          quote: 'text-xl text-gray-800 font-light leading-relaxed',
          author: 'text-base text-cyner-blue font-semibold mt-4',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-5xl text-cyner-teal opacity-30 font-serif'
        };
        
      case 'minimal':
        return {
          container: `${baseClasses} py-4`,
          quote: 'text-lg text-gray-700 leading-relaxed',
          author: 'text-sm text-gray-600 font-medium mt-3',
          source: 'text-xs text-gray-500',
          quoteMark: 'text-3xl text-gray-300 font-serif'
        };
        
      default:
        return {
          container: `${baseClasses} bg-gray-50 border-l-4 border-cyner-blue pl-6 pr-4 py-4`,
          quote: 'text-lg text-gray-700 font-medium italic leading-relaxed',
          author: 'text-sm text-gray-600 font-semibold mt-3',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-4xl text-cyner-blue opacity-50 font-serif'
        };
    }
  };

  const styleClasses = getStyleClasses();

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Passer au champ suivant
      if (field === 'text') {
        const authorInput = quoteRef.current?.querySelector('[data-field="author"]');
        authorInput?.focus();
      } else if (field === 'author') {
        const sourceInput = quoteRef.current?.querySelector('[data-field="source"]');
        sourceInput?.focus();
      }
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
              onClick={() => updateStyle('style', 'classic')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'classic' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Style classique"
            >
              Classique
            </button>
            <button
              onClick={() => updateStyle('style', 'modern')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'modern' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Style moderne"
            >
              Moderne
            </button>
            <button
              onClick={() => updateStyle('style', 'minimal')}
              className={`px-2 py-1 text-xs rounded ${
                getStyle() === 'minimal' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Style minimal"
            >
              Minimal
            </button>
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Alignment controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateStyle('alignment', 'left')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'left' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Aligner à gauche"
            >
              ↰
            </button>
            <button
              onClick={() => updateStyle('alignment', 'center')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'center' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Centrer"
            >
              ≡
            </button>
            <button
              onClick={() => updateStyle('alignment', 'right')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'right' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Aligner à droite"
            >
              ↱
            </button>
          </div>

          {/* Link to source */}
          {block.content.url && (
            <>
              <div className="w-px h-4 bg-gray-700 mx-1"></div>
              <a
                href={block.content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-gray-700 rounded text-xs"
                title="Voir la source"
              >
                <LinkIcon className="h-3 w-3" />
              </a>
            </>
          )}
        </div>
      )}

      {/* Quote content */}
      <div
        ref={quoteRef}
        className={`
          w-full border-2 border-transparent rounded-md transition-all duration-200 cursor-text
          ${isSelected 
            ? 'border-cyner-blue' 
            : 'hover:border-gray-200'
          }
        `}
        onClick={handleClick}
        onBlur={handleBlur}
        tabIndex={0}
      >
        <blockquote className={styleClasses.container}>
          {/* Quote mark */}
          {getStyle() !== 'minimal' && (
            <div className={`${styleClasses.quoteMark} ${getAlignment() === 'center' ? 'text-center' : ''} mb-2`}>
              "
            </div>
          )}

          {/* Quote text */}
          <div className="relative">
            <textarea
              data-field="text"
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'text')}
              onFocus={(e) => {
                onFocus();
                setActiveField('text');
              }}
              placeholder="Tapez votre citation ici..."
              className={`w-full border-none focus:outline-none focus:ring-0 bg-transparent resize-none ${styleClasses.quote} placeholder-gray-400`}
              style={{ minHeight: '3rem' }}
              rows={3}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Author */}
          <div className="flex flex-col space-y-2 mt-4">
            <input
              data-field="author"
              type="text"
              value={block.content.author || ''}
              onChange={(e) => updateContent('author', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'author')}
              onFocus={(e) => {
                onFocus();
                setActiveField('author');
              }}
              placeholder="Nom de l'auteur..."
              className={`border-none focus:outline-none focus:ring-0 bg-transparent ${styleClasses.author} placeholder-gray-400`}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Source */}
            <div className="flex items-center space-x-2">
              <input
                data-field="source"
                type="text"
                value={block.content.source || ''}
                onChange={(e) => updateContent('source', e.target.value)}
                onFocus={(e) => {
                  onFocus();
                  setActiveField('source');
                }}
                placeholder="Source ou organisation..."
                className={`flex-1 border-none focus:outline-none focus:ring-0 bg-transparent ${styleClasses.source} placeholder-gray-400`}
                onClick={(e) => e.stopPropagation()}
              />

              {/* URL input (optional) */}
              {(activeField === 'source' || block.content.url) && (
                <input
                  type="url"
                  value={block.content.url || ''}
                  onChange={(e) => updateContent('url', e.target.value)}
                  placeholder="https://..."
                  className="w-32 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>

          {/* Closing quote mark */}
          {getStyle() !== 'minimal' && getAlignment() === 'right' && (
            <div className={`${styleClasses.quoteMark} text-right mt-2`}>
              "
            </div>
          )}
        </blockquote>
      </div>

      {/* Help text */}
      {isSelected && (
        <div className="mt-2 text-xs text-gray-500">
          <p>💡 <strong>Astuce :</strong> Appuyez sur Entrée pour passer au champ suivant</p>
        </div>
      )}
    </div>
  );
};

export default QuoteBlock;
