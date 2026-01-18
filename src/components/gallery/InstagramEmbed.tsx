import { useEffect, useRef, useState } from 'react';
import { Loader2, Instagram } from 'lucide-react';

interface InstagramEmbedProps {
  url: string;
  className?: string;
}

// Track if the Instagram script is loaded
let instagramScriptLoaded = false;
let instagramScriptLoading = false;

export default function InstagramEmbed({ url, className }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadInstagramScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (instagramScriptLoaded) {
          resolve();
          return;
        }

        if (instagramScriptLoading) {
          // Wait for existing script to load
          const checkLoaded = setInterval(() => {
            if (instagramScriptLoaded) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 100);
          return;
        }

        instagramScriptLoading = true;
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          instagramScriptLoaded = true;
          instagramScriptLoading = false;
          resolve();
        };
        script.onerror = () => {
          instagramScriptLoading = false;
          reject(new Error('Failed to load Instagram embed script'));
        };
        document.body.appendChild(script);
      });
    };

    const initEmbed = async () => {
      try {
        await loadInstagramScript();
        
        // Process embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        
        setLoading(false);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };

    initEmbed();
  }, [url]);

  // Extract post ID from URL for the embed
  const getEmbedUrl = (inputUrl: string) => {
    // Clean the URL
    const cleanUrl = inputUrl.split('?')[0].replace(/\/$/, '');
    return cleanUrl + '/embed';
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <Instagram className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load Instagram content</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {loading && (
        <div className="flex items-center justify-center bg-muted rounded-lg p-8 min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading Instagram...</p>
          </div>
        </div>
      )}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: 'transparent',
          border: 0,
          borderRadius: '3px',
          margin: '0 auto',
          maxWidth: '100%',
          minWidth: '326px',
          padding: 0,
          width: '100%',
          display: loading ? 'none' : 'block',
        }}
      />
    </div>
  );
}

// Add types for Instagram embed
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
