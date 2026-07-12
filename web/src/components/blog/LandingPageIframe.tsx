'use client';

import { useEffect, useRef, useState } from 'react';
import { sanitizePreviewCss } from '@/lib/html-safety';

interface LandingPageIframeProps {
    css: string;
    html: string;
    js: string;
    fullScreen?: boolean;
}
// nhúng landing page vào bài viết
export function LandingPageIframe({ css, html, js, fullScreen }: LandingPageIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(600);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        if (html.trim().startsWith('<!DOCTYPE html>') || html.includes('<html') || html.includes('<HTML')) {
            iframe.srcdoc = html;
        } else {
            iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif}${sanitizePreviewCss(css)}</style></head><body>${html}<script>function notifyH(){window.parent.postMessage({type:'pqjobs-h',h:document.body.scrollHeight},'*')}window.addEventListener('load',notifyH);new ResizeObserver(notifyH).observe(document.body);<\/script><script>${js}<\/script></body></html>`;
        }

        const onMsg = (e: MessageEvent) => {
            if (e.source !== iframe.contentWindow || e.data?.type !== 'pqjobs-h') return;
            const height = Number(e.data.h);
            if (Number.isFinite(height)) setIframeHeight(Math.min(Math.max(height + 20, 320), 12000));
        };
        window.addEventListener('message', onMsg);
        return () => window.removeEventListener('message', onMsg);
    }, [css, html, js]);

    if (fullScreen) {
        return (
            <iframe
                ref={iframeRef}
                className="w-full h-full border-0 block m-0 p-0"
                style={{ height: '100vh', width: '100vw' }}
                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                title="Landing Page"
            />
        );
    }

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            <iframe
                ref={iframeRef}
                className="w-full border-0 block"
                style={{ height: iframeHeight }}
                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                title="Landing Page"
            />
        </div>
    );
}
