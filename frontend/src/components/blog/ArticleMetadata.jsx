import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogService, queryKeys } from '../../services/api';
import { ARTICLE_STATUS, getStatusLabel, getStatusColor } from '../../types/blogTypes';
import {
  XMarkIcon,
  TagIcon,
  FolderIcon,
  CalendarIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ArticleMetadata = ({ article, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState('seo');
  const [newTag, setNewTag] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  // Récupération des catégories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: blogService.getCategories
  });

  useEffect(() => {
    if (article.scheduledAt) {
      setScheduledDate(new Date(article.scheduledAt).toISOString().slice(0, 16));
    }
  }, [article.scheduledAt]);

  const updateSEO = (field, value) => {
    onUpdate({
      seo: {
        ...article.seo,
        [field]: value
      }
    });
  };

  const updateCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    onUpdate({
      category: category || null
    });
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    const existingTag = article.tags?.find(tag => 
      tag.name.toLowerCase() === newTag.trim().toLowerCase()
    );
    
    if (existingTag) {
      setNewTag('');
      return;
    }

    const newTagObj = {
      id: `temp-${Date.now()}`,
      name: newTag.trim(),
      slug: newTag.trim().toLowerCase().replace(/\s+/g, '-')
    };

    onUpdate({
      tags: [...(article.tags || []), newTagObj]
    });
    setNewTag('');
  };

  const removeTag = (tagId) => {
    onUpdate({
      tags: article.tags?.filter(tag => tag.id !== tagId) || []
    });
  };

  const handleScheduledDateChange = (e) => {
    const date = e.target.value;
    setScheduledDate(date);
    
    if (date) {
      onUpdate({
        scheduledAt: new Date(date).toISOString(),
        status: ARTICLE_STATUS.SCHEDULED
      });
    } else {
      onUpdate({
        scheduledAt: null,
        status: article.status === ARTICLE_STATUS.SCHEDULED ? ARTICLE_STATUS.DRAFT : article.status
      });
    }
  };

  const generateSlug = () => {
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    onUpdate({
      slug: slug
    });
  };

  const tabs = [
    { id: 'seo', label: 'SEO', icon: GlobeAltIcon },
    { id: 'organization', label: 'Organisation', icon: FolderIcon },
    { id: 'scheduling', label: 'Publication', icon: CalendarIcon },
    { id: 'stats', label: 'Statistiques', icon: EyeIcon }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Métadonnées</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyner-blue text-cyner-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="p-4 space-y-6">
            {/* URL Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l'article
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={article.slug || ''}
                  onChange={(e) => onUpdate({ slug: e.target.value })}
                  placeholder="url-de-l-article"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
                />
                <button
                  onClick={generateSlug}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title="Générer depuis le titre"
                >
                  Auto
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                cynergyiq.com/blog/{article.slug || 'url-de-l-article'}
              </p>
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre SEO
              </label>
              <input
                type="text"
                value={article.seo?.metaTitle || ''}
                onChange={(e) => updateSEO('metaTitle', e.target.value)}
                placeholder={article.title || 'Titre optimisé pour les moteurs de recherche'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(article.seo?.metaTitle || '').length}/60 caractères
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description SEO
              </label>
              <textarea
                value={article.seo?.metaDescription || ''}
                onChange={(e) => updateSEO('metaDescription', e.target.value)}
                placeholder={article.excerpt || 'Description qui apparaîtra dans les résultats de recherche'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(article.seo?.metaDescription || '').length}/160 caractères
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mots-clés SEO
              </label>
              <input
                type="text"
                value={(article.seo?.keywords || []).join(', ')}
                onChange={(e) => updateSEO('keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                placeholder="cybersécurité, technologie, innovation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Séparez les mots-clés par des virgules
              </p>
            </div>

            {/* Open Graph Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de partage (Open Graph)
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={article.seo?.ogImage || ''}
                  onChange={(e) => updateSEO('ogImage', e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
                />
                <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <PhotoIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              {article.seo?.ogImage && (
                <img
                  src={article.seo.ogImage}
                  alt="Aperçu Open Graph"
                  className="mt-2 w-full h-32 object-cover rounded-md border border-gray-200"
                />
              )}
            </div>
          </div>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && (
          <div className="p-4 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FolderIcon className="h-4 w-4 inline mr-1" />
                Catégorie
              </label>
              <select
                value={article.category?.id || ''}
                onChange={(e) => updateCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              
              {/* Existing tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-cyner-blue bg-opacity-10 text-cyner-blue"
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="ml-1 text-cyner-blue hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add new tag */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Ajouter un tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-cyner-blue text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auteur
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {article.author?.username || 'Auteur inconnu'}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(article.status)}-100 text-${getStatusColor(article.status)}-800`}>
                  {getStatusLabel(article.status)}
                </span>
                <span className="text-xs text-gray-500">
                  {article.status === ARTICLE_STATUS.DRAFT && 'Brouillon non publié'}
                  {article.status === ARTICLE_STATUS.IN_REVIEW && 'En attente de révision'}
                  {article.status === ARTICLE_STATUS.APPROVED && 'Approuvé pour publication'}
                  {article.status === ARTICLE_STATUS.PUBLISHED && 'Visible publiquement'}
                  {article.status === ARTICLE_STATUS.SCHEDULED && 'Publication programmée'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scheduling Tab */}
        {activeTab === 'scheduling' && (
          <div className="p-4 space-y-6">
            {/* Publication Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date de publication
              </label>
              
              {article.publishedAt ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                    Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                  Non publié
                </div>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Programmer la publication
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={handleScheduledDateChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent text-sm"
              />
              {article.scheduledAt && (
                <p className="text-xs text-gray-500 mt-1">
                  L'article sera publié automatiquement le {new Date(article.scheduledAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            {/* Creation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de création
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {new Date(article.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Last Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dernière modification
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {new Date(article.updatedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h3>
              <div className="space-y-2">
                {article.status === ARTICLE_STATUS.DRAFT && (
                  <button
                    onClick={() => onUpdate({ status: ARTICLE_STATUS.IN_REVIEW })}
                    className="w-full px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-md hover:bg-yellow-200 transition-colors"
                  >
                    Soumettre pour révision
                  </button>
                )}
                
                {article.status === ARTICLE_STATUS.APPROVED && (
                  <button
                    onClick={() => onUpdate({ 
                      status: ARTICLE_STATUS.PUBLISHED,
                      publishedAt: new Date().toISOString()
                    })}
                    className="w-full px-3 py-2 bg-green-100 text-green-800 text-sm rounded-md hover:bg-green-200 transition-colors"
                  >
                    Publier maintenant
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="p-4 space-y-6">
            {/* Read Time */}
            <div className="bg-gradient-to-r from-cyner-blue to-cyner-teal rounded-lg p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Temps de lecture</span>
              </div>
              <div className="text-2xl font-bold">
                {article.stats?.readTime || 1} min
              </div>
            </div>

            {/* Views */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <EyeIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Vues totales</span>
              </div>
              <div className="text-2xl font-bold">
                {article.stats?.views || 0}
              </div>
            </div>

            {/* Content Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Statistiques du contenu</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Blocs</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {article.blocks?.length || 0}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Images</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {article.blocks?.filter(block => block.type === 'image' && block.content.src).length || 0}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Mots</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {article.blocks?.reduce((count, block) => {
                      if (block.type === 'paragraph' || block.type === 'heading') {
                        return count + (block.content.text || '').split(' ').filter(w => w).length;
                      }
                      if (block.type === 'list') {
                        return count + (block.content.items || []).join(' ').split(' ').filter(w => w).length;
                      }
                      if (block.type === 'quote') {
                        return count + (block.content.text || '').split(' ').filter(w => w).length;
                      }
                      return count;
                    }, 0) || 0}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Caractères</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {article.blocks?.reduce((count, block) => {
                      if (block.type === 'paragraph' || block.type === 'heading') {
                        return count + (block.content.text || '').length;
                      }
                      if (block.type === 'list') {
                        return count + (block.content.items || []).join('').length;
                      }
                      if (block.type === 'quote') {
                        return count + (block.content.text || '').length;
                      }
                      return count;
                    }, 0) || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Score */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Score SEO</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Titre SEO</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.seo?.metaTitle ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {article.seo?.metaTitle ? 'OK' : 'Manquant'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Description SEO</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.seo?.metaDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {article.seo?.metaDescription ? 'OK' : 'Manquant'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mots-clés</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.seo?.keywords?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {article.seo?.keywords?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Image OG</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.seo?.ogImage ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {article.seo?.ogImage ? 'OK' : 'Optionnel'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleMetadata;