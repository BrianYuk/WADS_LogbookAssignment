'use client';
// app/docs/page.tsx — Swagger UI documentation page

import { useEffect, useState } from 'react';

export default function DocsPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Swagger UI from CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js';
    script.onload = () => {
      // @ts-expect-error - SwaggerUIBundle loaded from CDN
      window.SwaggerUIBundle({
        url: '/api/docs/swagger.json',
        dom_id: '#swagger-ui',
        presets: [
          // @ts-expect-error
          window.SwaggerUIBundle.presets.apis,
          // @ts-expect-error
          window.SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: 'BaseLayout',
        deepLinking: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 3,
        docExpansion: 'list',
      });
      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '24px 32px',
        borderBottom: '3px solid #e94560',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          background: '#e94560',
          color: 'white',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          API v1.0
        </div>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: 700 }}>
            Claude Assignment Log Book — API Documentation
          </h1>
          <p style={{ color: '#a0aec0', margin: '4px 0 0', fontSize: '14px' }}>
            Interactive REST API explorer powered by Swagger UI
          </p>
        </div>
        <a
          href="/"
          style={{
            marginLeft: 'auto',
            color: '#e94560',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #e94560',
            padding: '6px 16px',
            borderRadius: '6px',
          }}
        >
          ← App
        </a>
      </div>
      {!loaded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          fontSize: '16px',
          color: '#666',
        }}>
          Loading Swagger UI...
        </div>
      )}
      <div id="swagger-ui" />
    </div>
  );
}
