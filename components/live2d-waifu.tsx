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
                if (document.getElementById('live2d')) {
                    setIsLoaded(true);
                    onLoad?.();
                    return;
                }

                const loadScript = (src: string): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
                        if (existingScript?.dataset.loaded === 'true') {
                            resolve();
                            return;
                        }
                        if (existingScript) {
                            existingScript.addEventListener('load', () => resolve(), { once: true });
                            existingScript.addEventListener(
                                'error',
                                () => reject(new Error(`Failed to load script: ${src}`)),
                                { once: true }
                            );
                            return;
                        }
                        const script = document.createElement('script');
                        script.src = src;
                        script.async = true;
                        script.onload = () => {
                            script.dataset.loaded = 'true';
                            resolve();
                        };
                        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                        document.head.appendChild(script);
                    });
                };

                await loadScript('https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/autoload.js');

                let attempts = 0;
                const maxAttempts = 80;
                const baseDelay = 100;

                const checkWidget = () => {
                    const canvas = document.getElementById('live2d');
                    const waifu = document.getElementById('waifu');
                    if (canvas && waifu) {
                        setIsLoaded(true);
                        onLoad?.();
                        return;
                    }

                    attempts++;
                    if (attempts < maxAttempts) {
                        retryTimeoutRef.current = setTimeout(checkWidget, baseDelay);
                    } else {
                        const loadError = new Error('Live2D widget failed to initialize.');
                        setError(loadError);
                        onError?.(loadError);
                    }
                };

                checkWidget();
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                onError?.(error);
            }
        };

        let startTimeout: ReturnType<typeof setTimeout> | null = null;
        const startAfterHydration = () => {
            startTimeout = setTimeout(initializeLive2D, 750);
        };

        if (document.readyState === 'complete') {
            startAfterHydration();
        } else {
            window.addEventListener('load', startAfterHydration, { once: true });
        }

        return () => {
            window.removeEventListener('load', startAfterHydration);
            if (startTimeout) clearTimeout(startTimeout);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, [onLoad, onError]);

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
        return null;
    }

    return null;
};

export default memo(Live2dWaifu, (prevProps, nextProps) => {
    return JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings);
});
