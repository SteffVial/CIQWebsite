import React, { useState, useRef, useEffect } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const ParagraphBlock = ({ block, isSelected, onUpdate, onSelect, onFocus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selection, setSelection] = useState(null);
  const textRef = useRef(null);
  const toolbarRef = useRef(null);

  const handleClick = () => {
    onSelect();
    setIsEditing(true);
    setShowToolbar(true);
  };

  const handleBlur = () => {
    // Délai pour permettre aux clics sur la toolbar
    setTimeout(() => {
      if (!toolbarRef.current?.contains(document.activeElement)) {
        setIsEditing(false);
        setShowToolbar(false);
      }
    }, 100);
  };

  const handleInput = (e) => {
  let text = e.target.textContent;
  
  // 🔧 CORRECTION : Détecter et corriger le texte à l'envers
  if (text && text.length > 0) {
    // Forcer la mise à jour immédiate du DOM
    setTimeout(() => {
      if (e.target.textContent !== text) {
        e.target.textContent = text;
        
        // Repositionner le curseur
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(e.target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 5);
  }
  
  onUpdate({
    content: {
      ...block.content,
      text: text
    }
  });
};

  const handleKeyDown = (e) => {
  // Gestion des raccourcis clavier
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b':
        e.preventDefault();
        toggleFormat('bold');
        break;
      case 'i':
        e.preventDefault();
        toggleFormat('italic');
        break;
      case 'u':
        e.preventDefault();
        toggleFormat('underline');
        break;
    }
  }

  // Empêcher les sauts de ligne multiples
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    // Optionnel : créer un nouveau bloc paragraphe
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
};

  const toggleFormat = (format) => {
    document.execCommand(format, false, null);
    textRef.current?.focus();
    updateSelection();
  };

  const updateSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      setSelection({
        start: range.startOffset,
        end: range.endOffset,
        text: sel.toString()
      });
    }
  };

  const handleSelectionChange = () => {
    if (isEditing && document.activeElement === textRef.current) {
      updateSelection();
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isEditing]);

  useEffect(() => {
  if (textRef.current && block.content.text !== textRef.current.textContent) {
    textRef.current.textContent = block.content.text || '';
  }
}, [block.content.text]);



  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      document.execCommand('createLink', false, url);
      textRef.current?.focus();
    }
  };

  const getAlignment = () => {
    return block.styles?.alignment || 'left';
  };

  const getFontSize = () => {
    const sizeMap = {
      small: 'text-sm',
      normal: 'text-base',
      large: 'text-lg'
    };
    return sizeMap[block.styles?.fontSize] || 'text-base';
  };

  const getTextAlign = () => {
    const alignMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };
    return alignMap[getAlignment()] || 'text-left';
  };

  return (
    <div className="relative group">
      {/* Floating toolbar */}
      {showToolbar && isSelected && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-0 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1 z-30"
        >
          <button
            onClick={() => toggleFormat('bold')}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Gras (Ctrl+B)"
          >
            <BoldIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => toggleFormat('italic')}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Italique (Ctrl+I)"
          >
            <ItalicIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => toggleFormat('underline')}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Souligné (Ctrl+U)"
          >
            <UnderlineIcon className="h-3 w-3" />
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button
            onClick={insertLink}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Ajouter un lien"
          >
            <LinkIcon className="h-3 w-3" />
          </button>

          {/* Alignment controls */}
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <select
            value={getAlignment()}
            onChange={(e) => onUpdate({
              styles: {
                ...block.styles,
                alignment: e.target.value
              }
            })}
            className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 border-none focus:outline-none"
          >
            <option value="left">↰</option>
            <option value="center">≡</option>
            <option value="right">↱</option>
            <option value="justify">⫠</option>
          </select>

          {/* Font size */}
          <select
            value={block.styles?.fontSize || 'normal'}
            onChange={(e) => onUpdate({
              styles: {
                ...block.styles,
                fontSize: e.target.value
              }
            })}
            className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 border-none focus:outline-none"
          >
            <option value="small">S</option>
            <option value="normal">M</option>
            <option value="large">L</option>
          </select>
        </div>
      )}

      {/* Text content */}
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className={`
          w-full p-3 min-h-[2.5rem] outline-none border-2 border-transparent rounded-md transition-all duration-200
          ${getFontSize()} ${getTextAlign()}
          ${isSelected
            ? 'border-cyner-blue bg-blue-50'
            : 'hover:border-gray-200 hover:bg-gray-50'
          }
          ${!block.content.text ? 'text-gray-400' : 'text-gray-900'}
        `}
        style={{
          color: block.styles?.color || undefined,
          lineHeight: '1.6',
          direction: 'ltr',
          unicodeBidi: 'normal'
        }}
        dir="ltr"
        onClick={handleClick}
        onFocus={onFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        //dangerouslySetInnerHTML={{
        //  __html: block.content.text || ''
        //}}
        data-placeholder={!block.content.text ? 'Tapez votre texte ici...' : undefined}
      />

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        [contenteditable]:focus::before {
          content: none;
        }
      `}</style>
    </div>
  );
};

export default ParagraphBlock;