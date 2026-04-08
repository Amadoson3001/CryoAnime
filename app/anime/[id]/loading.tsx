import React from 'react'
import { PlayCircle } from 'lucide-react'

export default function Loading() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                flexDirection: 'column'
            }}
        >
            {/* Animated background elements */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '10%',
                        width: '50px',
                        height: '50px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%',
                        animation: 'float 3s ease-in-out infinite'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '70%',
                        right: '12%',
                        width: '35px',
                        height: '35px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '50%',
                        animation: 'float 4s ease-in-out infinite reverse'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '25%',
                        left: '25%',
                        width: '25px',
                        height: '25px',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        borderRadius: '50%',
                        animation: 'float 2.5s ease-in-out infinite'
                    }}
                />
            </div>

            {/* Main loading content */}
            <div
                style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    padding: '48px',
                    borderRadius: '24px',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                    animation: 'slideInUp 0.8s ease-out',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <PlayCircle size={48} style={{ color: '#10b981', animation: 'bounce 1.5s ease-in-out infinite' }} />
                </div>

                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '8px',
                    animation: 'fadeIn 1s ease-out'
                }}>
                    Loading Anime Details
                </h2>

                <p style={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                    animation: 'fadeIn 1s ease-out 0.2s both'
                }}>
                    Fetching detailed information and characters...
                </p>

                {/* Loading spinner */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '24px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(51, 65, 85, 0.3)',
                        borderTop: '3px solid #10b981',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>

                {/* Pulsing dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '20px'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s ease-in-out infinite'
                    }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s ease-in-out infinite 0.2s'
                    }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'pulse 1.4s ease-in-out infinite 0.4s'
                    }} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }

                @keyframes pulse {
                    0%, 80%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    40% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
            ` }} />
        </div>
    )
}
