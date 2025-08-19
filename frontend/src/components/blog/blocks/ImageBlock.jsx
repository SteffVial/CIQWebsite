import React, { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { blogService } from '../../../services/api';
import {
  PhotoIcon,
  LinkIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ImageBlock = ({ block, isSelected, onUpdate, onSelect }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  
  const fileInputRef = useRef(null);
  const toolbarRef = useRef(null);
  const dragCounter = useRef(0);

  // Mutation pour l'upload d'image
  const uploadMutation = useMutation({
    mutationFn: (file) => blogService.uploadBlockImage(file, block.id),
    onSuccess: (data) => {
      onUpdate({
        content: {
          ...block.content,
          src: data.url,
          alt: data.alt || '',
          title: data.title || ''
        },
        metadata: {
          ...block.metadata,
          originalName: data.originalName,
          size: data.size,
          dimensions: data.dimensions
        }
      });
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploadProgress(0);
    }
  });

  // Écoute des événements de progression d'upload
  React.useEffect(() => {
    const handleUploadProgress = (event) => {
      if (event.detail.blockId === block.id) {
        setUploadProgress(event.detail.progress);
      }
    };

    window.addEventListener('uploadProgress', handleUploadProgress);
    return () => window.removeEventListener('uploadProgress', handleUploadProgress);
  }, [block.id]);

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

  const handleFileSelect = useCallback((files) => {
    const file = files[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }

    // Validation de la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximale : 10MB.');
      return;
    }

    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    // Validation basique de l'URL
    try {
      new URL(urlInput);
      onUpdate({
        content: {
          ...block.content,
          src: urlInput.trim(),
          alt: block.content.alt || ''
        }
      });
      setShowUrlInput(false);
      setUrlInput('');
      setImageError(false);
    } catch {
      alert('URL invalide. Veuillez entrer une URL valide.');
    }
  };

  const updateProperty = (property, value) => {
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      onUpdate({
        [parent]: {
          ...block[parent],
          [child]: value
        }
      });
    } else {
      onUpdate({
        content: {
          ...block.content,
          [property]: value
        }
      });
    }
  };

  const getAlignment = () => {
    return block.styles?.alignment || 'center';
  };

  const getWidth = () => {
    return block.styles?.width || 'medium';
  };

  const getAlignmentClasses = () => {
    const alignMap = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end'
    };
    return alignMap[getAlignment()] || 'justify-center';
  };

  const getWidthClasses = () => {
    const widthMap = {
      small: 'max-w-sm',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      full: 'max-w-full'
    };
    return widthMap[getWidth()] || 'max-w-2xl';
  };

  const removeImage = () => {
    onUpdate({
      content: {
        src: '',
        alt: '',
        caption: '',
        title: ''
      },
      metadata: {}
    });
    setImageError(false);
  };

  const hasImage = block.content.src;

  return (
    <div className="relative group">
      {/* Floating toolbar */}
      {showToolbar && isSelected && hasImage && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1 z-30"
        >
          {/* Alignment controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateProperty('styles.alignment', 'left')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'left' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Aligner à gauche"
            >
              ↰
            </button>
            <button
              onClick={() => updateProperty('styles.alignment', 'center')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'center' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Centrer"
            >
              ≡
            </button>
            <button
              onClick={() => updateProperty('styles.alignment', 'right')}
              className={`p-1.5 text-xs rounded ${
                getAlignment() === 'right' ? 'bg-cyner-blue' : 'hover:bg-gray-700'
              }`}
              title="Aligner à droite"
            >
              ↱
            </button>
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Width controls */}
          <div className="flex items-center space-x-1">
            {['small', 'medium', 'large', 'full'].map((size) => (
              <button
                key={size}
                onClick={() => updateProperty('styles.width', size)}
                className={`px-2 py-1 text-xs rounded ${
                  getWidth() === size ? 'bg-cyner-blue' : 'hover:bg-gray-700'
                }`}
                title={`Taille ${size}`}
              >
                {size.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Style options */}
          <button
            onClick={() => updateProperty('styles.border', !block.styles?.border)}
            className={`p-1.5 text-xs rounded ${
              block.styles?.border ? 'bg-cyner-blue' : 'hover:bg-gray-700'
            }`}
            title="Bordure"
          >
            ⬜
          </button>
          <button
            onClick={() => updateProperty('styles.rounded', !block.styles?.rounded)}
            className={`p-1.5 text-xs rounded ${
              block.styles?.rounded ? 'bg-cyner-blue' : 'hover:bg-gray-700'
            }`}
            title="Coins arrondis"
          >
            ◉
          </button>

          <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {/* Replace image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-gray-700 rounded text-xs"
            title="Remplacer l'image"
          >
            <ArrowPathIcon className="h-3 w-3" />
          </button>

          {/* Remove image */}
          <button
            onClick={removeImage}
            className="p-1.5 hover:bg-red-600 rounded text-xs"
            title="Supprimer l'image"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        className={`
          w-full p-4 border-2 border-transparent rounded-md transition-all duration-200 cursor-pointer
          ${isSelected 
            ? 'border-cyner-blue bg-blue-50' 
            : 'hover:border-gray-200 hover:bg-gray-50'
          }
        `}
        onClick={handleClick}
        onBlur={handleBlur}
        tabIndex={0}
      >
        {hasImage ? (
          /* Image display */
          <div className={`flex ${getAlignmentClasses()}`}>
            <div className={`${getWidthClasses()} w-full`}>
              <div
                className={`relative ${
                  block.styles?.border ? 'border-2 border-gray-300' : ''
                } ${
                  block.styles?.rounded ? 'rounded-lg overflow-hidden' : ''
                }`}
              >
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8">
                          <svg className="animate-spin h-8 w-8 text-cyner-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <span className="text-sm font-medium">Upload {uploadProgress}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <img
                  src={block.content.src}
                  alt={block.content.alt || ''}
                  title={block.content.title || ''}
                  className="w-full h-auto"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />

                {imageError && (
                  <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                    <div className="text-center text-red-600">
                      <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Erreur de chargement</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <input
                type="text"
                placeholder="Légende de l'image (optionnel)..."
                value={block.content.caption || ''}
                onChange={(e) => updateProperty('caption', e.target.value)}
                className="w-full mt-2 text-center text-sm text-gray-600 italic border-none focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Alt text (accessibility) */}
              <input
                type="text"
                placeholder="Texte alternatif (accessibilité)..."
                value={block.content.alt || ''}
                onChange={(e) => updateProperty('alt', e.target.value)}
                className="w-full mt-1 text-center text-xs text-gray-500 border-none focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ) : (
          /* Upload area */
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragging 
                ? 'border-cyner-blue bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ajouter une image
            </h3>
            <p className="text-gray-500 mb-4">
              Glissez-déposez une image ici ou cliquez pour sélectionner
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center px-4 py-2 bg-cyner-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Choisir un fichier
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                URL d'image
              </button>
            </div>

            {showUrlInput && (
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                    if (e.key === 'Escape') setShowUrlInput(false);
                  }}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUrlSubmit();
                  }}
                  className="px-3 py-2 bg-cyner-blue text-white rounded-md hover:bg-blue-700"
                >
                  OK
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlInput(false);
                    setUrlInput('');
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageBlock;