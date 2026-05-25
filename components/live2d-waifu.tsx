'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';

interface Live2DSettings {
    model: {
        jsonPath: string;
        scale?: number;
        position?: 'left' | 'right';
        width?: number;
        height?: number;
        hOffset?: number;
        vOffset?: number;
    };
    display?: {
        position?: 'left' | 'right';
        width?: number;
        height?: number;
        hOffset?: number;
        vOffset?: number;
    };
    mobile?: { show?: boolean; scale?: number };
    react?: { opacityDefault?: number; opacityOnHover?: number };
    tips?: {
        welcomeTips?: { text?: string; duration?: number };
        copyTips?: { text?: string; duration?: number };
        clickTips?: string[];
        idleTips?: { text?: string[]; duration?: number };
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
        live2d?: any;
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
    const quotes = useMemo(() => [
        "Welcome to CryoAnime, Senpai! I'm here to help you discover the absolute best anime using the magical Jikan API! ❄️✨",
        "Did you know? You can see when your favorite shows air live on our 'Schedule' page! No more missed episodes! 🗓️",
        "Feeling a bit laggy? Turn on 'Potato Mode' in the settings! It makes things super speedy, just like me! 🥔💨",
        "Looking for family-friendly browsing? Toggle the Shield Icon in the header! Safety first! 🛡️",
        "CryoAnime is beautifully designed with glassmorphism and Tailwind by Mtechsin! Truly a work of art, right? (＾▽＾)",
        "Search suggestions will pop up as soon as you type 2 characters in the search bar! Try searching for your favorite! 🔍",
        "Hey! Don't just click on me, go watch some anime! Or... do you like poking me more? (⁄ ⁄•⁄-⁄•⁄ ⁄)",
        "Are you watching anime without me? That's a crime, Senpai! Baka! ＞︿＜",
        "My favorite anime? Obviously the one where the main character is incredibly handsome... just like you, Senpai! (✿◡‿◡)",
        "If you search for 'Waifu', will I show up first? You should try it in the search bar! *wink wink* 😉",
        "My smart caching makes me faster than my CPU processing your good looks! 💻❤️",
        "Don't sit too long staring at the screen! Stand up, stretch, and get some water. I want my Senpai healthy! ( •̀_•́ )"
    ], []);

    const clickQuotes = useMemo(() => [
        "Kyaaa! That tickles, Senpai! (*/ω＼*)",
        "Please don't poke me there... unless you're buying me snacks! 🍩",
        "Hey! Keep your cursor behaved, or I'll recommend you a 100-episode tear-jerker! ＞﹏＜",
        "Ouch! If you keep clicking, I'm going to hide! Just kidding, I love hanging out with you. (•◡•)/",
        "Focus, Senpai! We have an anime list to finish! 😤",
        "Is this what they call 'user engagement'? I feel very engaged! (✿◕‿◕)"
    ], []);

    const activeTextRef = useRef(quotes[0]);

    const defaultSettings: Live2DSettings = useMemo(() => ({
        model: {
            jsonPath: 'https://cdn.jsdelivr.net/gh/xiaoski/live2d_models_collection/models/koharu/koharu.model.json',
            scale: 0.8,
            position: 'right',
            width: 150,
            height: 300,
            hOffset: 20,
            vOffset: 20
        },
        display: {
            position: 'right',
            width: 150,
            height: 300,
            hOffset: 20,
            vOffset: 20
        },
        mobile: { show: true, scale: 0.5 },
        react: { opacityDefault: 0.7, opacityOnHover: 0.2 },
        tips: {
            welcomeTips: { text: ' ', duration: 1 },
            copyTips: { text: ' ', duration: 1 },
            clickTips: [' '],
            idleTips: { text: [' '], duration: 1 }
        },
        showToolMenu: true,
        showHitAreaFrames: false
    }), []);

    const mergedSettings = useMemo(() => ({
        ...defaultSettings,
        ...settings,
        model: { ...defaultSettings.model, ...settings.model },
        display: { ...defaultSettings.display, ...settings.display },
        mobile: { ...defaultSettings.mobile, ...settings.mobile },
        react: { ...defaultSettings.react, ...settings.react },
        tips: { ...defaultSettings.tips, ...settings.tips }
    }), [defaultSettings, settings]);

    const retryInitialization = () => {
        setIsRetrying(true);
        setError(null);
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        setIsLoaded(false);
        widgetRef.current = null;
        setTimeout(() => setIsRetrying(false), 500);
    };

    // Cycle through general quotes periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            activeTextRef.current = quotes[randomIndex];
            
            const tips = document.getElementById('waifu-tips');
            if (tips) {
                tips.textContent = activeTextRef.current;
                tips.style.transform = 'translateY(-12px) scale(1.05)';
                setTimeout(() => {
                    tips.style.transform = 'translateY(-12px) scale(1)';
                }, 300);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [quotes]);

    useEffect(() => {
        const initializeLive2D = async () => {
            try {
                const possibleGlobals = ['L2Dwidget', 'live2d', 'Live2D', 'L2D'];
                let existingWidget = null;

                for (const globalName of possibleGlobals) {
                    if (window[globalName as keyof Window]) {
                        existingWidget = window[globalName as keyof Window];
                        break;
                    }
                }

                if (existingWidget && widgetRef.current) {
                    window.live2d_settings = mergedSettings;
                    widgetRef.current.updateSettings?.(mergedSettings);
                    setIsLoaded(true);
                    onLoad?.();
                    return;
                }

                window.live2d_settings = mergedSettings;

                const loadScript = (src: string): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        const existingScript = document.querySelector(`script[src="${src}"]`);
                        if (existingScript) { resolve(); return; }
                        const script = document.createElement('script');
                        script.src = src;
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                        document.head.appendChild(script);
                    });
                };

                await loadScript('https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js');

                let attempts = 0;
                const maxAttempts = 100;
                const baseDelay = 100;

                const checkWidget = () => {
                    for (const globalName of possibleGlobals) {
                        if (window[globalName as keyof Window]) {
                            widgetRef.current = window[globalName as keyof Window];
                            if (typeof widgetRef.current === 'function') {
                                try { widgetRef.current(mergedSettings); } catch {}
                            }
                            setIsLoaded(true);
                            onLoad?.();
                            return;
                        }
                    }

                    if (window.live2d_settings && (window as any).loadlive2d) {
                        try {
                            (window as any).loadlive2d();
                            widgetRef.current = { settings: mergedSettings };
                            setIsLoaded(true);
                            onLoad?.();
                            return;
                        } catch {}
                    }

                    attempts++;
                    if (attempts < maxAttempts) {
                        const delay = baseDelay * Math.pow(1.2, attempts) + Math.random() * 50;
                        retryTimeoutRef.current = setTimeout(checkWidget, Math.min(delay, 1000));
                    } else {
                        if ((window as any).initLive2D) {
                            try {
                                (window as any).initLive2D(mergedSettings);
                                widgetRef.current = { settings: mergedSettings };
                                setIsLoaded(true);
                                onLoad?.();
                                return;
                            } catch {}
                        }
                        throw new Error(`Live2D widget failed to load.`);
                    }
                };

                checkWidget();
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                onError?.(error);
            }
        };

        initializeLive2D();

        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (widgetRef.current && typeof widgetRef.current.destroy === 'function') {
                widgetRef.current.destroy();
            }
        };
    }, [mergedSettings, onLoad, onError, isRetrying]);

    useEffect(() => {
        const handleWaifuClick = (e: MouseEvent) => {
            e.stopPropagation();
            const randomIndex = Math.floor(Math.random() * clickQuotes.length);
            activeTextRef.current = clickQuotes[randomIndex];
            const tips = document.getElementById('waifu-tips');
            if (tips) {
                tips.textContent = activeTextRef.current;
                tips.style.transform = 'translateY(-12px) scale(1.1) rotate(2deg)';
                setTimeout(() => {
                    tips.style.transform = 'translateY(-12px) scale(1) rotate(0deg)';
                }, 300);
            }
        };

        const applyWidgetOverrides = () => {
            const waifu = document.getElementById('waifu');
            const tips = document.getElementById('waifu-tips');
            const toggle = document.getElementById('waifu-toggle');
            const tool = document.getElementById('waifu-tool');

            if (waifu) {
                if (waifu.style.left !== 'auto') waifu.style.left = 'auto';
                if (waifu.style.right !== '20px') waifu.style.right = '20px';

                const canvas = document.getElementById('live2d') || waifu;
                if (!canvas.getAttribute('data-has-click-listener')) {
                    canvas.addEventListener('click', handleWaifuClick as any);
                    canvas.setAttribute('data-has-click-listener', 'true');
                }
            }

            if (tips) {
                if (tips.textContent !== activeTextRef.current) {
                    tips.textContent = activeTextRef.current;
                }
                if (tips.style.left !== 'auto') tips.style.left = 'auto';
                if (tips.style.right !== '20px') tips.style.right = '20px';
            }

            if (toggle) {
                if (toggle.style.left !== 'auto') toggle.style.left = 'auto';
                if (toggle.style.right !== '0px') toggle.style.right = '0';
            }

            if (tool) {
                if (tool.style.left !== '-10px') tool.style.left = '-10px';
                if (tool.style.right !== 'auto') tool.style.right = 'auto';
            }
        };

        applyWidgetOverrides();
        const observer = new MutationObserver(applyWidgetOverrides);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        return () => observer.disconnect();
    }, [clickQuotes]);

    if (error && !isLoaded) {
        return (
            <div style={{
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white',
                padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
                maxWidth: '300px', border: '1px solid #ff6b6b',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Live2D Widget Error</div>
                <div style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.9 }}>{error.message}</div>
                <button
                    onClick={retryInitialization}
                    disabled={isRetrying}
                    style={{
                        backgroundColor: '#3b82f6', color: 'white', border: 'none',
                        padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
                        cursor: isRetrying ? 'not-allowed' : 'pointer',
                        opacity: isRetrying ? 0.6 : 1, transition: 'opacity 0.2s'
                    }}
                >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            </div>
        );
    }

    return null;
};

export default memo(Live2dWaifu, (prevProps, nextProps) => {
    return JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings);
});
