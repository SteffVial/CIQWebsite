import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  CloudIcon,
  CpuChipIcon,
  CodeBracketIcon,
  CheckIcon,
  ArrowRightIcon,
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  // Services data
  const services = [
    {
      title: 'Cybersécurité',
      description: 'Protection complète de vos données et systèmes contre les menaces digitales.',
      icon: ShieldCheckIcon,
      features: ['Audit de sécurité', 'Monitoring 24/7', 'Formation équipes', 'Conformité RGPD'],
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Cloud Computing',
      description: 'Migration et optimisation de votre infrastructure vers le cloud.',
      icon: CloudIcon,
      features: ['Migration AWS/Azure', 'Architecture cloud', 'DevOps', 'Scaling automatique'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Intelligence Artificielle',
      description: 'Solutions IA personnalisées pour automatiser vos processus métier.',
      icon: CpuChipIcon,
      features: ['Machine Learning', 'Analyse prédictive', 'Chatbots', 'Vision par ordinateur'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Développement Web',
      description: 'Applications web modernes et performantes adaptées à vos besoins.',
      icon: CodeBracketIcon,
      features: ['React/Next.js', 'API REST', 'E-commerce', 'Progressive Web Apps'],
      color: 'from-green-500 to-green-600'
    }
  ];

  // Stats data
  const stats = [
    { name: 'Projets réalisés', value: '150+' },
    { name: 'Clients satisfaits', value: '98%' },
    { name: 'Années d\'expérience', value: '10+' },
    { name: 'Experts techniques', value: '25+' }
  ];

  // Testimonials data
  const testimonials = [
    {
      content: "CynergyIQ a transformé notre infrastructure IT. Leur expertise en cybersécurité nous a permis de sécuriser nos données clients de manière exemplaire.",
      author: "Marie Dubois",
      role: "CTO, TechCorp",
      rating: 5
    },
    {
      content: "La migration vers le cloud a été un succès total. L'équipe est professionnelle et les délais ont été respectés.",
      author: "Jean Martin",
      role: "Directeur IT, StartupXYZ",
      rating: 5
    },
    {
      content: "Leur solution IA a automatisé 80% de nos processus. Un ROI impressionnant dès les premiers mois.",
      author: "Sophie Leroy",
      role: "CEO, InnovaCorp",
      rating: 5
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyner-blue via-blue-700 to-cyner-teal min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Votre partenaire
                <span className="block text-cyan-300">technologique</span>
                de confiance
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Expertise en cybersécurité, cloud computing et intelligence artificielle 
                pour propulser votre entreprise vers le futur digital.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-cyner-teal text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors shadow-lg"
                >
                  Démarrer un projet
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyner-blue transition-colors"
                >
                  Nos services
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center space-x-8 text-blue-100">
                <div className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-cyan-300" />
                  <span>Équipe certifiée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-cyan-300" />
                  <span>Support 24/7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-cyan-300" />
                  <span>ROI garanti</span>
                </div>
              </div>
            </div>

            {/* Right content - Video/Image placeholder */}
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <div className="aspect-video bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <PlayIcon className="h-16 w-16 text-white opacity-80" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Découvrez notre approche
                </h3>
                <p className="text-blue-100">
                  Regardez comment nous accompagnons nos clients dans leur transformation digitale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-4xl font-bold text-cyner-blue mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nos expertises au service de votre croissance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des solutions technologiques innovantes pour répondre aux défis de votre entreprise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                <div className={`h-2 bg-gradient-to-r ${service.color}`}></div>
                <div className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center px-8 py-3 bg-cyner-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir tous nos services
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les témoignages de ceux qui nous font confiance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6">
                  "{testimonial.content}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyner-blue to-cyner-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à transformer votre entreprise ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Contactez-nous dès aujourd'hui pour une consultation gratuite et découvrez 
            comment nos solutions peuvent propulser votre croissance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-cyner-blue font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Demander un devis gratuit
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyner-blue transition-colors"
            >
              En savoir plus sur nous
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;