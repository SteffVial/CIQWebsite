import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, queryKeys } from '../services/api';
import {
  DocumentTextIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  // Récupération des stats du dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: dashboardService.getStats,
    refetchInterval: 5 * 60 * 1000, // Refresh toutes les 5 minutes
  });

  // Récupération des activités récentes
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: queryKeys.activity(10),
    queryFn: () => dashboardService.getRecentActivity(10),
    refetchInterval: 2 * 60 * 1000, // Refresh toutes les 2 minutes
  });

  // Stats par défaut si pas de données
  const defaultStats = {
    totalArticles: 0,
    totalJobs: 0,
    totalSubscribers: 0,
    totalViews: 0,
    articlesThisMonth: 0,
    jobsThisMonth: 0,
    subscribersThisMonth: 0,
    viewsThisMonth: 0
  };

  const dashboardStats = stats || defaultStats;

  // Configuration des cards statistiques
  const statCards = [
    {
      title: 'Articles de blog',
      value: dashboardStats.totalArticles,
      change: `+${dashboardStats.articlesThisMonth} ce mois`,
      icon: DocumentTextIcon,
      color: 'blue',
      trend: 'up'
    },
    {
      title: 'Offres d\'emploi',
      value: dashboardStats.totalJobs,
      change: `+${dashboardStats.jobsThisMonth} ce mois`,
      icon: BriefcaseIcon,
      color: 'green',
      trend: 'up'
    },
    {
      title: 'Abonnés newsletter',
      value: dashboardStats.totalSubscribers,
      change: `+${dashboardStats.subscribersThisMonth} ce mois`,
      icon: EnvelopeIcon,
      color: 'purple',
      trend: 'up'
    },
    {
      title: 'Vues totales',
      value: dashboardStats.totalViews,
      change: `+${dashboardStats.viewsThisMonth} ce mois`,
      icon: EyeIcon,
      color: 'orange',
      trend: 'up'
    }
  ];

  // Activités par défaut si pas de données
  const defaultActivities = [
    {
      id: 1,
      type: 'blog',
      action: 'Article publié',
      title: 'Les tendances cybersécurité 2025',
      user: 'Admin',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: 'job',
      action: 'Nouvelle offre',
      title: 'Développeur Full Stack',
      user: 'HR Manager',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'newsletter',
      action: 'Campagne envoyée',
      title: 'Newsletter mensuelle',
      user: 'Marketing',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const recentActivities = activities || defaultActivities;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'blog': return DocumentTextIcon;
      case 'job': return BriefcaseIcon;
      case 'newsletter': return EnvelopeIcon;
      default: return ClockIcon;
    }
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Vue d'ensemble de votre administration CynergyIQ
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            <span>Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    formatNumber(card.value)
                  )}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">{card.change}</span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${getColorClass(card.color)} rounded-lg flex items-center justify-center`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                Activités récentes
              </h2>
            </div>
            <div className="p-6">
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ActivityIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}: {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Par {activity.user} • {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {!activitiesLoading && recentActivities.length === 0 && (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Actions rapides</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-cyner-blue" />
                <span className="text-sm font-medium text-gray-900">Nouvel article</span>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <BriefcaseIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Nouvelle offre d'emploi</span>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Envoyer newsletter</span>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">Gérer utilisateurs</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">État du système</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Serveur web</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Opérationnel
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de données</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Opérationnel
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Opérationnel
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CDN</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;