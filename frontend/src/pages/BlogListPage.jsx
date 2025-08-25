import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService, queryKeys } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ARTICLE_STATUS, getStatusColor, getStatusLabel } from '../types/blogTypes';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const BlogListPage = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Récupération des articles
  const { data: articles, isLoading } = useQuery({
    queryKey: queryKeys.articles({
      search: searchTerm,
      status: statusFilter,
      sortBy,
      sortOrder,
      _refresh: statusFilter // Force le refresh quand statusFilter change
    }),
    queryFn: () => blogService.getArticles({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy,
      sortOrder
    }),
    refetchInterval: 30000, // Refresh toutes les 30 secondes
    enabled: true  // ← AJOUTER cette ligne
  });

  //useEffect(() => {
  //queryClient.refetchQueries({ 
 //   queryKey: queryKeys.articles({
 //     search: searchTerm,
  //    status: statusFilter !== 'all' ? statusFilter : undefined,
//      sortBy,
//      sortOrder
//    })
//  });
//}, [statusFilter, searchTerm, sortBy, sortOrder, queryClient]);



  // Mutation pour supprimer un article
  const deleteArticleMutation = useMutation({
    mutationFn: blogService.deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles() });
    }
  });

  // Mutation pour changer le statut
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }) => blogService.updateArticle(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles() });
    }
  });

  const handleDelete = async (id, title) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${title}" ?`)) {
      deleteArticleMutation.mutate(id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    changeStatusMutation.mutate({ id, status: newStatus });
  };

  const canEdit = (article) => {
    // Admin peut tout éditer, blogadmin peut éditer ses propres articles
    return hasRole(user?.roles, 'admin') ||
      (hasRole(user?.roles, 'blogadmin') && article.author.id === user.id);
  };

  const canDelete = (article) => {
    // Seul admin peut supprimer ou blogadmin ses propres brouillons
    return hasRole(user?.roles, 'admin') ||
      (hasRole(user?.roles, 'blogadmin') &&
        article.author.id === user.id &&
        article.status === ARTICLE_STATUS.DRAFT);
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case ARTICLE_STATUS.DRAFT:
        return ARTICLE_STATUS.IN_REVIEW;
      case ARTICLE_STATUS.IN_REVIEW:
        return hasRole(user?.roles, 'admin') ? ARTICLE_STATUS.APPROVED : null;
      case ARTICLE_STATUS.APPROVED:
        return hasRole(user?.roles, 'admin') ? ARTICLE_STATUS.PUBLISHED : null;
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return null;

    switch (nextStatus) {
      case ARTICLE_STATUS.IN_REVIEW:
        return 'Soumettre pour révision';
      case ARTICLE_STATUS.APPROVED:
        return 'Approuver';
      case ARTICLE_STATUS.PUBLISHED:
        return 'Publier';
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Blog</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos articles, catégories et publications
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/blog/new"
            className="inline-flex items-center px-4 py-2 bg-cyner-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel article
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value={ARTICLE_STATUS.DRAFT}>Brouillons</option>
              <option value={ARTICLE_STATUS.IN_REVIEW}>En révision</option>
              <option value={ARTICLE_STATUS.APPROVED}>Approuvés</option>
              <option value={ARTICLE_STATUS.PUBLISHED}>Publiés</option>
              <option value={ARTICLE_STATUS.SCHEDULED}>Programmés</option>
            </select>
          </div>

          {/* Tri */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="updatedAt-desc">Modifié récemment</option>
              <option value="createdAt-desc">Créé récemment</option>
              <option value="title-asc">Titre A-Z</option>
              <option value="publishedAt-desc">Publié récemment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-24 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : articles?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun article trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par créer votre premier article.'
              }
            </p>
            <Link
              to="/admin/blog/new"
              className="inline-flex items-center px-4 py-2 bg-cyner-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Créer un article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {articles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {article.title || 'Sans titre'}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(article.status)}-100 text-${getStatusColor(article.status)}-800`}>
                        {getStatusLabel(article.status)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.excerpt || 'Aucun extrait disponible'}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>Par {article.author.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Modifié {formatDate(article.updatedAt)}</span>
                      </div>
                      {article.publishedAt && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Publié {formatDate(article.publishedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{article.stats.views} vues</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Preview */}
                    <Link
                      to={`/admin/blog/preview/${article.id}`}
                      className="p-2 text-gray-500 hover:text-cyner-blue hover:bg-gray-100 rounded-md transition-colors"
                      title="Prévisualiser"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>

                    {/* Edit */}
                    {canEdit(article) && (
                      <Link
                        to={`/admin/blog/edit/${article.id}`}
                        className="p-2 text-gray-500 hover:text-cyner-blue hover:bg-gray-100 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                    )}

                    {/* Change Status */}
                    {getNextStatus(article.status) && (
                      <button
                        onClick={() => handleStatusChange(article.id, getNextStatus(article.status))}
                        disabled={changeStatusMutation.isPending}
                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
                        title={getNextStatusLabel(article.status)}
                      >
                        {getNextStatusLabel(article.status)}
                      </button>
                    )}

                    {/* Delete */}
                    {canDelete(article) && (
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
                        disabled={deleteArticleMutation.isPending}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;