// phục lục tự động

'use client';

interface InteractiveTOCProps {
    headings: string[];
}

export function InteractiveTOC({ headings }: InteractiveTOCProps) {
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