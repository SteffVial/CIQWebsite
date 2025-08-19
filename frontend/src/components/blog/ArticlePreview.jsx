import React from 'react';
import { BLOCK_TYPES, getStatusLabel, getStatusColor } from '../../types/blogTypes';
import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ArticlePreview = ({ article }) => {
  if (!article) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun article à prévisualiser</p>
      </div>
    );
  }

  // Rendu d'un bloc selon son type
  const renderBlock = (block) => {
    const commonClasses = "mb-6";

    switch (block.type) {
      case BLOCK_TYPES.PARAGRAPH:
        return (
          <div
            key={block.id}
            className={`${commonClasses} ${getTextAlign(block.styles?.alignment)} ${getFontSize(block.styles?.fontSize)}`}
            style={{ color: block.styles?.color }}
            dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
          />
        );

      case BLOCK_TYPES.HEADING:
        const HeadingTag = `h${block.content.level || 2}`;
        return (
          <HeadingTag
            key={block.id}
            className={`${commonClasses} ${getHeadingClasses(block.content.level)} ${getTextAlign(block.styles?.alignment)}`}
            style={{ color: block.styles?.color }}
            dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
          />
        );

      case BLOCK_TYPES.IMAGE:
        if (!block.content.src) return null;
        return (
          <div key={block.id} className={`${commonClasses} ${getImageAlignment(block.styles?.alignment)}`}>
            <div className={`${getImageWidth(block.styles?.width)} w-full`}>
              <div
                className={`
                  ${block.styles?.border ? 'border-2 border-gray-300' : ''}
                  ${block.styles?.rounded ? 'rounded-lg overflow-hidden' : ''}
                `}
              >
                <img
                  src={block.content.src}
                  alt={block.content.alt || ''}
                  title={block.content.title || ''}
                  className="w-full h-auto"
                />
              </div>
              {block.content.caption && (
                <p className="text-center text-sm text-gray-600 italic mt-2">
                  {block.content.caption}
                </p>
              )}
            </div>
          </div>
        );

      case BLOCK_TYPES.LIST:
        const ListTag = block.content.listType === 'numbered' ? 'ol' : 'ul';
        const listStyles = getListStyles(block);
        return (
          <ListTag
            key={block.id}
            className={`${commonClasses} ${listStyles.containerClasses}`}
            style={{ paddingLeft: `${1 + (block.styles?.indentation || 0) * 1.5}rem` }}
          >
            {(block.content.items || []).map((item, index) => (
              <li key={index} className={listStyles.itemClasses}>
                {item}
              </li>
            ))}
          </ListTag>
        );

      case BLOCK_TYPES.QUOTE:
        const quoteStyles = getQuoteStyles(block.styles?.style, block.styles?.alignment);
        return (
          <blockquote key={block.id} className={`${commonClasses} ${quoteStyles.container}`}>
            {block.styles?.style !== 'minimal' && (
              <div className={quoteStyles.quoteMark}>
                "
              </div>
            )}
            <div className={quoteStyles.quote}>
              {block.content.text}
            </div>
            {(block.content.author || block.content.source) && (
              <div className="mt-4">
                {block.content.author && (
                  <div className={quoteStyles.author}>
                    — {block.content.author}
                  </div>
                )}
                {block.content.source && (
                  <div className={quoteStyles.source}>
                    {block.content.url ? (
                      <a 
                        href={block.content.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-cyner-blue transition-colors"
                      >
                        {block.content.source}
                      </a>
                    ) : (
                      block.content.source
                    )}
                  </div>
                )}
              </div>
            )}
          </blockquote>
        );

      case BLOCK_TYPES.SEPARATOR:
        return (
          <div
            key={block.id}
            className={`${commonClasses} ${getSeparatorSpacing(block.styles?.spacing)} flex justify-center items-center`}
          >
            {renderSeparator(block)}
          </div>
        );

      default:
        return (
          <div key={block.id} className={`${commonClasses} p-4 bg-red-50 border border-red-200 rounded-lg`}>
            <p className="text-red-600">Type de bloc non reconnu: {block.type}</p>
          </div>
        );
    }
  };

  // Helper functions
  const getTextAlign = (alignment) => {
    const alignMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };
    return alignMap[alignment] || 'text-left';
  };

  const getFontSize = (fontSize) => {
    const sizeMap = {
      small: 'text-sm',
      normal: 'text-base',
      large: 'text-lg'
    };
    return sizeMap[fontSize] || 'text-base';
  };

  const getHeadingClasses = (level) => {
    const sizeClasses = {
      1: 'text-4xl md:text-5xl font-bold',
      2: 'text-3xl md:text-4xl font-bold',
      3: 'text-2xl md:text-3xl font-bold',
      4: 'text-xl md:text-2xl font-bold',
      5: 'text-lg md:text-xl font-bold',
      6: 'text-base md:text-lg font-bold'
    };
    return `${sizeClasses[level] || sizeClasses[2]} text-gray-900 leading-tight`;
  };

  const getImageAlignment = (alignment) => {
    const alignMap = {
      left: 'flex justify-start',
      center: 'flex justify-center',
      right: 'flex justify-end'
    };
    return alignMap[alignment] || 'flex justify-center';
  };

  const getImageWidth = (width) => {
    const widthMap = {
      small: 'max-w-sm',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      full: 'max-w-full'
    };
    return widthMap[width] || 'max-w-2xl';
  };

  const getListStyles = (block) => {
    const baseClasses = 'space-y-2';
    
    if (block.content.listType === 'numbered') {
      const numberStyle = block.styles?.numberStyle || 'decimal';
      const listStyleMap = {
        decimal: 'list-decimal',
        roman: 'list-roman',
        alpha: 'list-alpha'
      };
      return {
        containerClasses: `${baseClasses} ${listStyleMap[numberStyle] || 'list-decimal'} ml-6`,
        itemClasses: 'text-gray-700 leading-relaxed'
      };
    } else {
      const bulletStyle = block.styles?.bulletStyle || 'disc';
      const listStyleMap = {
        disc: 'list-disc',
        circle: 'list-circle', 
        square: 'list-square'
      };
      return {
        containerClasses: `${baseClasses} ${listStyleMap[bulletStyle] || 'list-disc'} ml-6`,
        itemClasses: 'text-gray-700 leading-relaxed'
      };
    }
  };

  const getQuoteStyles = (style = 'classic', alignment = 'left') => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };

    const baseAlignment = alignmentClasses[alignment] || 'text-left';

    switch (style) {
      case 'classic':
        return {
          container: `bg-gray-50 border-l-4 border-cyner-blue pl-6 pr-4 py-4 ${baseAlignment}`,
          quote: 'text-lg text-gray-700 font-medium italic leading-relaxed',
          author: 'text-sm text-gray-600 font-semibold',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-4xl text-cyner-blue opacity-50 font-serif mb-2'
        };
      case 'modern':
        return {
          container: `bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${baseAlignment}`,
          quote: 'text-xl text-gray-800 font-light leading-relaxed',
          author: 'text-base text-cyner-blue font-semibold',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-5xl text-cyner-teal opacity-30 font-serif mb-2'
        };
      case 'minimal':
        return {
          container: `py-4 ${baseAlignment}`,
          quote: 'text-lg text-gray-700 leading-relaxed',
          author: 'text-sm text-gray-600 font-medium',
          source: 'text-xs text-gray-500',
          quoteMark: ''
        };
      default:
        return {
          container: `bg-gray-50 border-l-4 border-cyner-blue pl-6 pr-4 py-4 ${baseAlignment}`,
          quote: 'text-lg text-gray-700 font-medium italic leading-relaxed',
          author: 'text-sm text-gray-600 font-semibold',
          source: 'text-sm text-gray-500',
          quoteMark: 'text-4xl text-cyner-blue opacity-50 font-serif mb-2'
        };
    }
  };

  const getSeparatorSpacing = (spacing) => {
    const spacingMap = {
      small: 'py-2',
      medium: 'py-4',
      large: 'py-8'
    };
    return spacingMap[spacing] || 'py-4';
  };

  const renderSeparator = (block) => {
    const style = block.styles?.style || 'line';
    const thickness = block.styles?.thickness || 'medium';

    const thicknessClasses = {
      thin: 'h-px',
      medium: 'h-0.5',
      thick: 'h-1'
    };

    switch (style) {
      case 'line':
        return <div className={`w-full bg-gray-300 ${thicknessClasses[thickness]}`} />;
      case 'dots':
        return (
          <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3].map((dot) => (
              <div key={dot} className="w-2 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        );
      case 'stars':
        return (
          <div className="flex justify-center items-center space-x-3">
            {[1, 2, 3].map((star) => (
              <span key={star} className="text-lg text-gray-300">★</span>
            ))}
          </div>
        );
      case 'wave':
        return (
          <svg width="100" height="20" viewBox="0 0 100 20" className="text-gray-300">
            <path
              d="M0,10 Q25,0 50,10 T100,10"
              stroke="currentColor"
              strokeWidth={thickness === 'thin' ? '1' : thickness === 'thick' ? '3' : '2'}
              fill="none"
            />
          </svg>
        );
      default:
        return <div className={`w-full bg-gray-300 ${thicknessClasses[thickness]}`} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <article className="max-w-none">
      {/* Article header */}
      <header className="mb-8 pb-6 border-b border-gray-200">
        {/* Status badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(article.status)}-100 text-${getStatusColor(article.status)}-800`}>
            {getStatusLabel(article.status)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          {article.title || 'Sans titre'}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            {article.excerpt}
          </p>
        )}

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {/* Author */}
          <div className="flex items-center space-x-1">
            <UserIcon className="h-4 w-4" />
            <span>Par {article.author?.username || 'Auteur inconnu'}</span>
          </div>

          {/* Dates */}
          {article.publishedAt ? (
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Publié le {formatDate(article.publishedAt)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Créé le {formatDate(article.createdAt)}</span>
            </div>
          )}

          {/* Read time */}
          {article.stats?.readTime && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{article.stats.readTime} min de lecture</span>
            </div>
          )}

          {/* Views */}
          {article.stats?.views > 0 && (
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{article.stats.views} vues</span>
            </div>
          )}
        </div>

        {/* Category and tags */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {/* Category */}
          {article.category && (
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-cyner-blue">
                {article.category.name}
              </span>
            </div>
          )}

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Article content */}
      <div className="prose max-w-none">
        {article.blocks?.length > 0 ? (
          article.blocks
            .sort((a, b) => a.order - b.order)
            .map(renderBlock)
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun contenu à afficher</p>
          </div>
        )}
      </div>

      {/* Article footer */}
      <footer className="mt-12 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p>
            Dernière modification le {formatDate(article.updatedAt)}
            {article.updatedAt !== article.createdAt && (
              <span> • Créé le {formatDate(article.createdAt)}</span>
            )}
          </p>
        </div>
      </footer>
    </article>
  );
};

export default ArticlePreview;