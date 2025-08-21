import React, { useState, useRef, useCallback } from 'react';
import { BLOCK_TYPES, createBlock } from '../../types/blogTypes';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

// Import des composants de blocs individuels
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ImageBlock from './blocks/ImageBlock';
import ListBlock from './blocks/ListBlock';
import QuoteBlock from './blocks/QuoteBlock';
import SeparatorBlock from './blocks/SeparatorBlock';

const BlockEditor = ({
  blocks,
  onBlocksChange,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  selectedBlockId,
  onSelectBlock
}) => {
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(null);
  const dragCounter = useRef(0);
  const [showActionsMenu, setShowActionsMenu] = useState(null);


  // Types de blocs disponibles pour le menu d'ajout
  const blockTypes = [
    { type: BLOCK_TYPES.PARAGRAPH, label: 'Paragraphe', icon: '¶', description: 'Texte simple' },
    { type: BLOCK_TYPES.HEADING, label: 'Titre', icon: 'H', description: 'Titre de section' },
    { type: BLOCK_TYPES.IMAGE, label: 'Image', icon: '🖼️', description: 'Photo ou illustration' },
    { type: BLOCK_TYPES.LIST, label: 'Liste', icon: '•', description: 'Liste à puces ou numérotée' },
    { type: BLOCK_TYPES.QUOTE, label: 'Citation', icon: '"', description: 'Citation ou témoignage' },
    { type: BLOCK_TYPES.SEPARATOR, label: 'Séparateur', icon: '—', description: 'Ligne de séparation' }
  ];

  // Gestion du drag & drop
  const handleDragStart = (e, blockId) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDropPosition(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, targetBlockId) => {
    e.preventDefault();
    dragCounter.current++;

    if (draggedBlockId && draggedBlockId !== targetBlockId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const position = e.clientY < midPoint ? 'before' : 'after';

      setDropPosition({ blockId: targetBlockId, position });
    }
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e, targetBlockId) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDropPosition(null);
      return;
    }

    const sourceIndex = blocks.findIndex(block => block.id === draggedBlockId);
    const targetIndex = blocks.findIndex(block => block.id === targetBlockId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);

    let insertIndex = targetIndex;
    if (sourceIndex < targetIndex) {
      insertIndex = targetIndex;
    }
    if (dropPosition?.position === 'after') {
      insertIndex += 1;
    }

    newBlocks.splice(insertIndex, 0, movedBlock);
    onBlocksChange(newBlocks);
    setDropPosition(null);
  };

  // Mise à jour d'un bloc spécifique
  const updateBlock = useCallback((blockId, updates) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updatedAt: new Date().toISOString() }
        : block
    );
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  // Rendu d'un bloc selon son type
  const renderBlock = (block) => {
    const commonProps = {
      block,
      isSelected: selectedBlockId === block.id,
      onUpdate: (updates) => updateBlock(block.id, updates),
      onSelect: () => onSelectBlock(block.id),
      onFocus: () => onSelectBlock(block.id)
    };

    switch (block.type) {
      case BLOCK_TYPES.PARAGRAPH:
        return <ParagraphBlock {...commonProps} />;
      case BLOCK_TYPES.HEADING:
        return <HeadingBlock {...commonProps} />;
      case BLOCK_TYPES.IMAGE:
        return <ImageBlock {...commonProps} />;
      case BLOCK_TYPES.LIST:
        return <ListBlock {...commonProps} />;
      case BLOCK_TYPES.QUOTE:
        return <QuoteBlock {...commonProps} />;
      case BLOCK_TYPES.SEPARATOR:
        return <SeparatorBlock {...commonProps} />;
      default:
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Type de bloc non reconnu: {block.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div key={block.id} className="relative group">
          {/* Indicateur de drop */}
          {dropPosition?.blockId === block.id && dropPosition.position === 'before' && (
            <div className="h-1 bg-cyner-blue rounded-full mb-2 mx-4"></div>
          )}

          {/* Conteneur de bloc */}
          <div
            className={`relative transition-all duration-200 ${selectedBlockId === block.id
              ? 'ring-2 ring-cyner-blue ring-opacity-50'
              : ''
              } ${draggedBlockId === block.id
                ? 'opacity-50 transform scale-105'
                : ''
              }`}
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, block.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, block.id)}
            onClick={() => onSelectBlock(block.id)}
          >
            {/* Toolbar de bloc */}
            <div className={`absolute left-0 top-0 transform -translate-x-full flex items-center space-x-1 transition-opacity duration-200 ${selectedBlockId === block.id || showAddMenu === block.id
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
              }`}>
              {/* Drag handle */}
              <button
                className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                title="Déplacer le bloc"
              >
                <Bars3Icon className="h-4 w-4" />
              </button>

              {/* Add block menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMenu(showAddMenu === block.id ? null : block.id);
                  }}
                  className="p-1 text-gray-400 hover:text-cyner-blue"
                  title="Ajouter un bloc"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>

                {/* Menu déroulant d'ajout */}
                {showAddMenu === block.id && (
                  <>
                    {/* Overlay pour fermer le menu */}
                    <div
                      className="fixed inset-0 z-[250]"
                      onClick={() => setShowAddMenu(null)}
                    />

                    {/* Menu avec z-index élevé */}
                    <div
                      className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[300]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                          Ajouter un bloc
                        </div>
                        {blockTypes.map((blockType) => (
                          <button
                            key={blockType.type}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddBlock(blockType.type, index);
                              setShowAddMenu(null);
                            }}
                            className="w-full flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <span className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm">
                              {blockType.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {blockType.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {blockType.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Block actions menu */}
              {/* Block actions menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionsMenu(showActionsMenu === block.id ? null : block.id); // ✅ Ajoutez cette ligne
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Options du bloc"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>

                {/* Actions menu */}
                {showActionsMenu === block.id && (
                  <>
                    {/* Overlay qui évite la zone du menu */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowActionsMenu(null)}
                    />

                    {/* Menu avec z-index plus élevé */}
                    <div
                      className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[200]"
                      onClick={(e) => e.stopPropagation()} // ✅ Empêche la propagation
                    >
                      <div className="p-1">
                        <button
                          onClick={() => {
                            console.log('🔍 Bouton cliqué');
                            onDuplicateBlock(block.id);
                            setShowActionsMenu(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Dupliquer</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔍 Bouton supprimer cliqué');
                            if (window.confirm('Supprimer ce bloc ?')) {
                              onDeleteBlock(block.id);
                            }
                            setShowActionsMenu(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 rounded-md transition-colors"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contenu du bloc */}
            <div className="pl-2">
              {renderBlock(block)}
            </div>
          </div>

          {/* Indicateur de drop après */}
          {dropPosition?.blockId === block.id && dropPosition.position === 'after' && (
            <div className="h-1 bg-cyner-blue rounded-full mt-2 mx-4"></div>
          )}
        </div>
      ))}

      
    </div>
  );
};

export default BlockEditor;