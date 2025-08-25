import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Redirection si non connecté
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Navigation principale avec permissions
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/admin' || location.pathname === '/admin/dashboard',
      roles: ['admin', 'blogadmin', 'careeradmin', 'contentadmin']
    },
    {
      name: 'Blog',
      href: '/admin/blog',
      icon: DocumentTextIcon,
      current: location.pathname.startsWith('/admin/blog'),
      roles: ['admin', 'blogadmin'],
      children: [
        { name: 'Articles', href: '/admin/blog' },
        { name: 'Catégories', href: '/admin/blog/categories' },
        { name: 'Nouveau', href: '/admin/blog/new' },
      ]
    },
    {
      name: 'Carrières',
      href: '/admin/careers',
      icon: BriefcaseIcon,
      current: location.pathname.startsWith('/admin/careers'),
      roles: ['admin', 'careeradmin'],
      children: [
        { name: 'Offres d\'emploi', href: '/admin/careers/jobs' },
        { name: 'Candidatures', href: '/admin/careers/applications' },
        { name: 'Nouvelle offre', href: '/admin/careers/new' },
      ]
    },
    {
      name: 'Newsletter',
      href: '/admin/newsletter',
      icon: EnvelopeIcon,
      current: location.pathname.startsWith('/admin/newsletter'),
      roles: ['admin'],
      children: [
        { name: 'Abonnés', href: '/admin/newsletter/subscribers' },
        { name: 'Campagnes', href: '/admin/newsletter/campaigns' },
        { name: 'Nouvelle campagne', href: '/admin/newsletter/new' },
      ]
    },
    {
      name: 'Contenu',
      href: '/admin/content',
      icon: DocumentDuplicateIcon,
      current: location.pathname.startsWith('/admin/content'),
      roles: ['admin', 'contentadmin'],
      children: [
        { name: 'Pages', href: '/admin/content/pages' },
        { name: 'Médias', href: '/admin/content/media' },
      ]
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      current: location.pathname.startsWith('/admin/analytics'),
      roles: ['admin']
    },
    {
      name: 'Utilisateurs',
      href: '/admin/users',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/admin/users'),
      roles: ['admin']
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: CogIcon,
      current: location.pathname.startsWith('/admin/settings'),
      roles: ['admin']
    }
  ];

  // Filtrer la navigation selon les rôles
  const filteredNavigation = navigation.filter(item =>
    item.roles.some(role => hasRole(user?.roles, role))
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={filteredNavigation} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={filteredNavigation} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyner-teal"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Search bar */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyner-teal focus:border-transparent sm:text-sm"
                  placeholder="Rechercher..."
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <BellIcon className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-3 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-cyner-teal p-2 hover:bg-gray-50"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-500" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <Link
                      to="/admin/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mon profil
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Voir le site
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Déconnexion</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Composant Sidebar séparé
const SidebarContent = ({ navigation }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyner-blue to-cyner-teal rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-bold text-cyner-blue">CynergyIQ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>CynergyIQ Admin</p>
          <p>v2.0.0</p>
        </div>
      </div>
    </div>
  );
};

// Composant NavItem pour gérer les sous-menus
const NavItem = ({ item }) => {
  const [expanded, setExpanded] = useState(item.current);
  const location = useLocation(); // ← AJOUT pour détecter la page active

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.current
            ? 'text-cyner-blue bg-blue-50'
            : 'text-gray-700 hover:text-cyner-blue hover:bg-gray-50'
            }`}
        >
          <div className="flex items-center">
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {expanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.name}
                to={child.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ml-8 transition-colors ${location.pathname === child.href
                  ? 'text-cyner-blue bg-blue-50'
                  : 'text-gray-600 hover:text-cyner-blue hover:bg-gray-50'
                  }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.current
        ? 'text-cyner-blue bg-blue-50'
        : 'text-gray-700 hover:text-cyner-blue hover:bg-gray-50'
        }`}
    >
      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
      {item.name}
    </Link>
  );
};

export default AdminLayout;