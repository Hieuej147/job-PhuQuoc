'use client';

import { useEffect, useRef, useState } from 'react';

export function InteractiveTOC({ headings }: { headings: string[] }) {
    const handleScroll = (index: number) => {
        const h2Elements = document.querySelectorAll('.prose h2');
        if (h2Elements[index]) {
            const element = h2Elements[index];
            const yOffset = -80; 
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleScrollToBottom = () => {
        const article = document.querySelector('article');
        if (article) {
            const y = article.getBoundingClientRect().bottom + window.pageYOffset - 300;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <span className="text-[#0891b2] font-semibold">📋</span> Mục lục
            </h3>
            <ul className="space-y-3 text-[13px] text-slate-600">
                {headings.map((heading, i) => (
                    <li 
                        key={i} 
                        onClick={() => handleScroll(i)}
                        className="hover:text-[#0891b2] cursor-pointer transition-colors leading-snug flex gap-2 group/item"
                    >
                        <span className="text-[#0891b2] font-semibold group-hover/item:translate-x-0.5 transition-transform">{i + 1}.</span>
                        <span className="group-hover/item:translate-x-0.5 transition-transform">{heading}</span>
                    </li>
                ))}
                <li 
                    onClick={handleScrollToBottom}
                    className="hover:text-[#0891b2] cursor-pointer transition-colors border-t border-slate-100 pt-3 mt-3 text-slate-500 font-medium"
                >
                    Tổng kết
                </li>
            </ul>
        </div>
    );
}

export function LandingPageIframe({ css, html, js }: { css: string; html: string; js: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(600);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif}${css}</style></head><body>${html}<script>function notifyH(){window.parent.postMessage({type:'pqjobs-h',h:document.body.scrollHeight},'*')}window.addEventListener('load',notifyH);new ResizeObserver(notifyH).observe(document.body);<\/script><script>${js}<\/script></body></html>`;

        const onMsg = (e: MessageEvent) => {
            if (e.data?.type === 'pqjobs-h') setIframeHeight(e.data.h + 20);
        };
        window.addEventListener('message', onMsg);
        return () => window.removeEventListener('message', onMsg);
    }, [css, html, js]);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            <iframe ref={iframeRef} sandbox="allow-scripts" className="w-full border-0 block" style={{ height: iframeHeight }} title="Landing Page" />
        </div>
    );
}
