import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService, queryKeys } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ARTICLE_STATUS, 
  BLOCK_TYPES, 
  createBlock, 
  createEmptyArticle,
  validateArticle,
  calculateReadTime
} from '../types/blogTypes';
import {
  PlusIcon,
  EyeIcon,
  CloudArrowUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

// Import des composants de blocs
import BlockEditor from '../components/blog/BlockEditor';
import ArticlePreview from '../components/blog/ArticlePreview';
import ArticleMetadata from '../components/blog/ArticleMetadata';

const BlogEditorPage = () => {
  const { id } = useParams(); // ID de l'article (undefined pour nouveau)
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isEditing = Boolean(id);
  
  // États locaux
  const [article, setArticle] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // Chargement de l'article existant
  const { data: loadedArticle, isLoading } = useQuery({
    queryKey: queryKeys.article(id),
    queryFn: () => blogService.getArticle(id),
    enabled: isEditing,
    onSuccess: (data) => {
      setArticle(data);
    }
  });

  // Initialisation pour nouvel article
  useEffect(() => {
    if (!isEditing && !article) {
      setArticle(createEmptyArticle(user));
    }
  }, [isEditing, article, user]);

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: (articleData) => {
      if (isEditing) {
        return blogService.updateArticle(id, articleData);
      } else {
        return blogService.createArticle(articleData);
      }
    },
    onSuccess: (data) => {
      setHasUnsavedChanges(false);
      setAutoSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles() });
      
      // Rediriger vers l'édition si c'était une création
      if (!isEditing) {
        navigate(`/admin/blog/edit/${data.id}`, { replace: true });
      }
    },
    onError: () => {
      setAutoSaveStatus('error');
    }
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (articleData) => {
      if (isEditing) {
        return blogService.autoSaveArticle(id, articleData);
      }
      return Promise.resolve(); // Pas d'auto-save pour nouveaux articles
    },
    onSuccess: () => {
      setAutoSaveStatus('saved');
    },
    onError: () => {
      setAutoSaveStatus('error');
    }
  });

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    if (!article || !hasUnsavedChanges || !isEditing) return;

    const autoSaveInterval = setInterval(() => {
      setAutoSaveStatus('saving');
      autoSaveMutation.mutate(article);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [article, hasUnsavedChanges, isEditing, autoSaveMutation]);

  // Gestion des changements d'article
  const updateArticle = useCallback((updates) => {
    setArticle(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
    setHasUnsavedChanges(true);
    setAutoSaveStatus('pending');
  }, []);

  // Gestion des blocs
  const updateBlocks = useCallback((newBlocks) => {
    const processedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index
    }));
    
    updateArticle({
      blocks: processedBlocks,
      stats: {
        ...article?.stats,
        readTime: calculateReadTime(processedBlocks)
      }
    });
  }, [updateArticle, article?.stats]);

  const addBlock = useCallback((type, afterIndex = -1) => {
    if (!article) return;
    
    const newBlock = createBlock(type, {}, 0);
    const newBlocks = [...article.blocks];
    
    if (afterIndex >= 0) {
      newBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  }, [article, updateBlocks]);

  const deleteBlock = useCallback((blockId) => {
    if (!article) return;
    
    const newBlocks = article.blocks.filter(block => block.id !== blockId);
    updateBlocks(newBlocks);
    
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [article, updateBlocks, selectedBlockId]);

  const duplicateBlock = useCallback((blockId) => {
    if (!article) return;
    
    const blockIndex = article.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return;
    
    const originalBlock = article.blocks[blockIndex];
    const duplicatedBlock = {
      ...originalBlock,
      id: crypto.randomUUID()
    };
    
    const newBlocks = [...article.blocks];
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    
    updateBlocks(newBlocks);
    setSelectedBlockId(duplicatedBlock.id);
  }, [article, updateBlocks]);

  // Sauvegarde manuelle
  const handleSave = async () => {
    if (!article || !validateArticle(article)) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }
    
    saveMutation.mutate(article);
  };

  // Changer le statut
  const handleStatusChange = (newStatus) => {
    updateArticle({ status: newStatus });
    handleSave();
  };

  // Prévenir la perte de données
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyner-blue"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Impossible de charger l'article
        </h3>
        <Link
          to="/admin/blog"
          className="text-cyner-blue hover:text-cyner-teal"
        >
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/blog"
                className="p-2 text-gray-500 hover:text-cyner-blue rounded-md transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {autoSaveStatus === 'saving' && 'Sauvegarde...'}
                    {autoSaveStatus === 'saved' && 'Sauvegardé'}
                    {autoSaveStatus === 'error' && 'Erreur de sauvegarde'}
                    {autoSaveStatus === 'pending' && hasUnsavedChanges && 'Modifications non sauvegardées'}
                  </span>
                  {article.stats?.readTime && (
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {article.stats.readTime} min de lecture
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Preview toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-md transition-colors ${
                  showPreview 
                    ? 'bg-cyner-blue text-white' 
                    : 'text-gray-500 hover:text-cyner-blue hover:bg-gray-100'
                }`}
              >
                <EyeIcon className="h-5 w-5" />
              </button>

              {/* Metadata toggle */}
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={`p-2 rounded-md transition-colors ${
                  showMetadata 
                    ? 'bg-cyner-blue text-white' 
                    : 'text-gray-500 hover:text-cyner-blue hover:bg-gray-100'
                }`}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || !hasUnsavedChanges}
                className="inline-flex items-center px-4 py-2 bg-cyner-blue text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>

              {/* Status actions */}
              {article.status === ARTICLE_STATUS.DRAFT && (
                <button
                  onClick={() => handleStatusChange(ARTICLE_STATUS.IN_REVIEW)}
                  className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Soumettre pour révision
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Editor column */}
          <div className={`transition-all duration-300 ${
            showPreview ? 'w-1/2' : 'w-full max-w-4xl mx-auto'
          }`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Article title */}
              <div className="p-6 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Titre de l'article..."
                  value={article.title}
                  onChange={(e) => updateArticle({ title: e.target.value })}
                  className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none focus:outline-none focus:ring-0 p-0"
                />
                <textarea
                  placeholder="Extrait de l'article (optionnel)..."
                  value={article.excerpt}
                  onChange={(e) => updateArticle({ excerpt: e.target.value })}
                  rows={2}
                  className="w-full mt-4 text-gray-600 placeholder-gray-400 border-none focus:outline-none focus:ring-0 p-0 resize-none"
                />
              </div>

              {/* Block editor */}
              <div className="p-6">
                <BlockEditor
                  blocks={article.blocks}
                  onBlocksChange={updateBlocks}
                  onAddBlock={addBlock}
                  onDeleteBlock={deleteBlock}
                  onDuplicateBlock={duplicateBlock}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                />
              </div>

              {/* Add block button */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => addBlock(BLOCK_TYPES.PARAGRAPH)}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-cyner-blue hover:border-cyner-blue transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter un bloc
                </button>
              </div>
            </div>
          </div>

          {/* Preview column */}
          {showPreview && (
            <div className="w-1/2">
              <div className="sticky top-24">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Aperçu</h3>
                  </div>
                  <div className="p-6 max-h-screen overflow-y-auto">
                    <ArticlePreview article={article} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata sidebar */}
      {showMetadata && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-gray-200 z-50">
          <ArticleMetadata
            article={article}
            onUpdate={updateArticle}
            onClose={() => setShowMetadata(false)}
          />
        </div>
      )}
    </div>
  );
};

export default BlogEditorPage;