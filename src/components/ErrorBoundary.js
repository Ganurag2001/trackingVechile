import React from 'react';

/**
 * Error Boundary Component for graceful error handling
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>⚠️ Something went wrong</h1>
            <p style={styles.message}>
              The application encountered an error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.stack}>
                  {this.state.error && this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 1rem 0',
    color: '#1e293b',
    fontSize: '1.5rem',
    fontWeight: '600'
  },
  message: {
    margin: '0 0 1.5rem 0',
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  },
  details: {
    marginBottom: '1.5rem',
    textAlign: 'left',
    background: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: '0.5rem'
  },
  stack: {
    margin: '0.5rem 0 0 0',
    padding: '0.75rem',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '0.75rem',
    overflow: 'auto',
    maxHeight: '300px',
    color: '#dc2626',
    fontFamily: 'Courier New, monospace'
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease'
  }
};

/**
 * Loading State Component
 */
export function LoadingState() {
  return (
    <div style={loadingStyles.container}>
      <div style={loadingStyles.spinner} />
      <p style={loadingStyles.text}>Loading fleet data...</p>
      <p style={loadingStyles.subtext}>This may take a moment for large datasets</p>
    </div>
  );
}

const loadingStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  text: {
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#1e293b',
    margin: '0'
  },
  subtext: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0.5rem 0 0 0'
  }
};

// Add keyframes for spinner animation
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerKeyframes;
  document.head.appendChild(style);
}
