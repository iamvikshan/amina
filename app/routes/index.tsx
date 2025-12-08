import type { Context } from 'hono';

export default function Home(c: Context) {
  return c.render(
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🚀 HonoX Infrastructure
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Phase 1: Infrastructure Foundation Complete
      </p>
      <div style={{ 
        marginTop: '2rem',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2>✅ Checklist</h2>
        <ul style={{ 
          listStyle: 'none',
          padding: 0,
          textAlign: 'left',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <li>✅ Project structure created</li>
          <li>✅ Dependencies installed (hono, honox, vite)</li>
          <li>✅ Configuration files set up</li>
          <li>✅ Bootstrap files created</li>
          <li>✅ Test route working</li>
        </ul>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <a href="/health" style={{ 
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Check Health Status
        </a>
      </div>
    </div>
  );
}
