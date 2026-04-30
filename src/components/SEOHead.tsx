import { Helmet } from 'react-helmet-async';

interface ArticleMeta {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  image?: string;
  article?: ArticleMeta;
}

const defaultImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/UdwkCEk2EiSWYPhKv4CJnr1Kwnv1/social-images/social-1768133186526-587724352_18083114480082191_2923309409189761346_n.jpg";

const SEOHead = ({
  title = "Manomaya — Spiritual Quotes, Mindfulness & Inner Peace",
  description = "Discover daily spiritual quotes, mindfulness reflections, and meditation wisdom. A sacred space for inner peace, self-discovery, and spiritual awakening.",
  keywords = "spirituality, spiritual quotes, mindfulness, meditation, inner peace, self-discovery, spiritual awakening, zen quotes, wisdom, consciousness",
  canonicalUrl = "https://manomaya.lovable.app/",
  type = "website",
  image = defaultImage,
  article,
}: SEOHeadProps) => {
  const fullTitle = title.includes("Manomaya") ? title : `${title} | Manomaya`;
  const resolvedImage = image || defaultImage;

  const jsonLd =
    type === 'article' && article
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          description,
          image: resolvedImage,
          datePublished: article.publishedTime,
          dateModified: article.modifiedTime || article.publishedTime,
          author: {
            '@type': 'Person',
            name: article.author || 'manomaya',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Manomaya',
            logo: {
              '@type': 'ImageObject',
              url: 'https://manomaya.lovable.app/favicon.ico',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Manomaya',
          url: 'https://manomaya.lovable.app/',
          description,
        };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Manomaya" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />

      {/* Article meta */}
      {type === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* JSON-LD structured data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default SEOHead;
