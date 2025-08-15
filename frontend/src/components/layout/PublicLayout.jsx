import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation principale
  const navigation = [
    { name: 'Accueil', href: '/', current: location.pathname === '/' },
    { name: 'Services', href: '/services', current: location.pathname === '/services' },
    { name: 'À propos', href: '/about', current: location.pathname === '/about' },
    { name: 'Blog', href: '/blog', current: location.pathname.startsWith('/blog') },
    { name: 'Carrières', href: '/careers', current: location.pathname.startsWith('/careers') },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ];

  // Navigation footer
  const footerNavigation = {
    services: [
      { name: 'Cybersécurité', href: '/services/cybersecurity' },
      { name: 'Cloud Computing', href: '/services/cloud' },
      { name: 'Intelligence Artificielle', href: '/services/ai' },
      { name: 'Développement Web', href: '/services/web-development' },
    ],
    company: [
      { name: 'À propos', href: '/about' },
      { name: 'Notre équipe', href: '/team' },
      { name: 'Carrières', href: '/careers' },
      { name: 'Actualités', href: '/blog' },
    ],
    support: [
      { name: 'Contact', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Support technique', href: '/support' },
      { name: 'Documentation', href: '/docs' },
    ],
    legal: [
      { name: 'Politique de confidentialité', href: '/privacy' },
      { name: 'Conditions d\'utilisation', href: '/terms' },
      { name: 'Mentions légales', href: '/legal' },
    ],
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-2xl font-bold text-cyner-blue hover:text-cyner-teal transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyner-blue to-cyner-teal rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span>CynergyIQ</span>
              </Link>
            </div>

            {/* Navigation desktop */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'text-cyner-blue bg-blue-50'
                      : 'text-gray-700 hover:text-cyner-blue hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* CTA Button */}
              <Link
                to="/contact"
                className="ml-4 px-6 py-2 bg-cyner-teal text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
              >
                Devis gratuit
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-700 hover:text-cyner-blue hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Ouvrir le menu principal</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      item.current
                        ? 'text-cyner-blue bg-blue-50'
                        : 'text-gray-700 hover:text-cyner-blue hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/contact"
                  className="block px-3 py-2 mt-4 bg-cyner-teal text-white text-base font-medium rounded-lg hover:bg-teal-600 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Devis gratuit
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer content */}
          <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyner-blue to-cyner-teal rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-2xl font-bold">CynergyIQ</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Votre partenaire technologique de confiance pour la transformation digitale. 
                Expertise en cybersécurité, cloud computing et intelligence artificielle.
              </p>
              
              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-cyner-teal" />
                  <span className="text-gray-300">contact@cynergyiq.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-cyner-teal" />
                  <span className="text-gray-300">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-cyner-teal" />
                  <span className="text-gray-300">Montréal, QC, Canada</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Services
              </h3>
              <ul className="space-y-3">
                {footerNavigation.services.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-300 hover:text-cyner-teal transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Entreprise
              </h3>
              <ul className="space-y-3">
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-300 hover:text-cyner-teal transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                {footerNavigation.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-300 hover:text-cyner-teal transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter subscription */}
          <div className="border-t border-gray-800 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Restez informé de nos actualités
                </h3>
                <p className="text-gray-300 text-sm">
                  Recevez les dernières nouvelles et conseils tech directement dans votre boîte mail.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row max-w-md">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg sm:rounded-r-none rounded-r-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyner-teal focus:border-transparent"
                />
                <button className="px-6 py-2 bg-cyner-teal text-white font-medium rounded-r-lg sm:rounded-l-none rounded-l-lg hover:bg-teal-600 transition-colors whitespace-nowrap mt-2 sm:mt-0">
                  S'abonner
                </button>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4 lg:mb-0">
                <p className="text-gray-400 text-sm">
                  © {currentYear} CynergyIQ. Tous droits réservés.
                </p>
                <div className="flex space-x-6">
                  {footerNavigation.legal.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-gray-400 hover:text-cyner-teal transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Social links */}
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-cyner-teal transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-cyner-teal transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-cyner-teal transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;