'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';

interface Live2DModel {
    jsonPath: string;
    scale?: number;
    position?: 'left' | 'right';
    width?: number;
    height?: number;
    hOffset?: number;
    vOffset?: number;
}

interface Live2DSettings {
    model: Live2DModel;
    display?: {
        position?: 'left' | 'right';
        width?: number;
        height?: number;
        hOffset?: number;
        vOffset?: number;
    };
    mobile?: {
        show?: boolean;
        scale?: number;
    };
    react?: {
        opacityDefault?: number;
        opacityOnHover?: number;
    };
    tips?: {
        welcomeTips?: {
            text?: string;
            duration?: number;
        };
        copyTips?: {
            text?: string;
            duration?: number;
        };
        clickTips?: string[];
        idleTips?: {
            text?: string[];
            duration?: number;
        };
    };
    showToolMenu?: boolean;
    showHitAreaFrames?: boolean;
}

interface Live2dWaifuProps {
    settings?: Partial<Live2DSettings>;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

declare global {
    interface Window {
        L2Dwidget?: any;
        live2d_settings?: any;
    }
}

const Live2dWaifu: React.FC<Live2dWaifuProps> = ({
    settings = {},
    onLoad,
    onError
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const widgetRef = useRef<any>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Default settings
    const defaultSettings: Live2DSettings = useMemo(() => ({
        model: {
            jsonPath: 'https://cdn.jsdelivr.net/gh/xiaoski/live2d_models_collection/models/koharu/koharu.model.json',
            scale: 0.8,
            position: 'left',
            width: 150,
            height: 300,
            hOffset: 20,
            vOffset: 20
        },
        display: {
            position: 'left',
            width: 150,
            height: 300,
            hOffset: 20,
            vOffset: 20
        },
        mobile: {
            show: true,
            scale: 0.5
        },
        react: {
            opacityDefault: 0.7,
            opacityOnHover: 0.2
        },
        tips: {
            welcomeTips: {
                text: '',
                duration: 0
            },
            copyTips: {
                text: '',
                duration: 0
            },
            clickTips: [],
            idleTips: {
                text: [],
                duration: 0
            }
        },
        showToolMenu: false,
        showHitAreaFrames: false
    }), []);

    // Merge default settings with provided settings
    const mergedSettings = useMemo(() => ({
        ...defaultSettings,
        ...settings,
        model: {
            ...defaultSettings.model,
            ...settings.model
        },
        display: {
            ...defaultSettings.display,
            ...settings.display
        },
        mobile: {
            ...defaultSettings.mobile,
            ...settings.mobile
        },
        react: {
            ...defaultSettings.react,
            ...settings.react
        },
        tips: {
            ...defaultSettings.tips,
            ...settings.tips
        }
    }), [defaultSettings, settings]);

    // Retry function for manual retries
    const retryInitialization = () => {
        setIsRetrying(true);
        setError(null);

        // Clear any existing timeouts
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Reset state and trigger re-initialization
        setIsLoaded(false);
        widgetRef.current = null;

        // Small delay before retry
        setTimeout(() => {
            setIsRetrying(false);
        }, 500);
    };

    useEffect(() => {
        const initializeLive2D = async () => {
            try {
                // Check if widget is already loaded with multiple possible global variables
                const possibleGlobals = ['L2Dwidget', 'live2d', 'Live2D', 'L2D'];
                let existingWidget = null;

                for (const globalName of possibleGlobals) {
                    if (window[globalName as keyof Window]) {
                        existingWidget = window[globalName as keyof Window];
                        window.document.getElementById("live2d")?.setAttribute("class", "live2d-widget");
                        window.document.getElementById("waifu-tips")?.setAttribute("class", "hidetools");
                        break;
                    }
                }

                if (existingWidget && widgetRef.current) {
                    // Update existing widget settings
                    window.live2d_settings = mergedSettings;
                    widgetRef.current.updateSettings?.(mergedSettings);
                    setIsLoaded(true);
                    onLoad?.();
                    return;
                }

                // Set global settings
                window.live2d_settings = mergedSettings;

                // Load the Live2D widget script with better error handling
                const loadScript = (src: string): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        // Check if script is already loaded
                        const existingScript = document.querySelector(`script[src="${src}"]`);
                        if (existingScript) {
                            resolve();
                            return;
                        }

                        const script = document.createElement('script');
                        script.src = src;
                        script.async = true;
                        script.onload = () => {
                            resolve();
                        };
                        script.onerror = (event) => {
                            reject(new Error(`Failed to load script: ${src}`));
                        };
                        document.head.appendChild(script);
                    });
                };

                // Load the main Live2D widget script
                await loadScript('https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js');

                // Wait for widget to be available with improved detection
                let attempts = 0;
                const maxAttempts = 100; // 10 seconds max wait
                const baseDelay = 100; // Start with 100ms

                const checkWidget = () => {
                    // Check multiple possible global variables
                    for (const globalName of possibleGlobals) {
                        if (window[globalName as keyof Window]) {
                            widgetRef.current = window[globalName as keyof Window];

                            // Try to initialize the widget if it's a function
                            if (typeof widgetRef.current === 'function') {
                                try {
                                    widgetRef.current(mergedSettings);
                                } catch (initError) {
                                }
                            }

                            setIsLoaded(true);
                            onLoad?.();
                            return;
                        }
                    }

                    // Also check for common Live2D initialization patterns
                    if (window.live2d_settings && (window as any).loadlive2d) {
                        try {
                            (window as any).loadlive2d();
                            widgetRef.current = { settings: mergedSettings };
                            setIsLoaded(true);
                            onLoad?.();
                            return;
                        } catch (initError) {
                        }
                    }

                    attempts++;
                    if (attempts < maxAttempts) {
                        // Exponential backoff with jitter
                        const delay = baseDelay * Math.pow(1.2, attempts) + Math.random() * 50;
                        const timeoutId = setTimeout(checkWidget, Math.min(delay, 1000)); // Cap at 1 second
                        retryTimeoutRef.current = timeoutId;
                    } else {
                        // Try alternative initialization methods before giving up

                        // Try to manually initialize if possible
                        if ((window as any).initLive2D) {
                            try {
                                (window as any).initLive2D(mergedSettings);
                                widgetRef.current = { settings: mergedSettings };
                                setIsLoaded(true);
                                onLoad?.();
                                return;
                            } catch (fallbackError) {
                            }
                        }

                        throw new Error(`Live2D widget failed to load within timeout (${maxAttempts * baseDelay}ms). Please check your internet connection and try refreshing the page.`);
                    }
                };

                checkWidget();

            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error occurred');
                setError(error);
                onError?.(error);
            }
        };

        initializeLive2D();

        // Cleanup function
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (widgetRef.current && typeof widgetRef.current.destroy === 'function') {
                widgetRef.current.destroy();
            }
        };
    }, [mergedSettings, onLoad, onError, isRetrying]);

    // Show error message with retry button if initialization failed
    if (error && !isLoaded) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                maxWidth: '300px',
                border: '1px solid #ff6b6b',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                    Live2D Widget Error
                </div>
                <div style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.9 }}>
                    {error.message}
                </div>
                <button
                    onClick={retryInitialization}
                    disabled={isRetrying}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: isRetrying ? 'not-allowed' : 'pointer',
                        opacity: isRetrying ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                    }}
                >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            </div>
        );
    }

    // Don't render anything visible - the widget handles its own DOM manipulation
    return null;
};

// Memoize the component to prevent unnecessary re-renders
export default memo(Live2dWaifu, (prevProps, nextProps) => {
    // Custom comparison function to check if props have changed
    // Since settings is an object, we need to do a deep comparison
    return JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings);
});