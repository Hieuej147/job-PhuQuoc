"use client";

import { Check, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";
import { RichContent } from "@/components/ui/rich-content";
import type { ThreadHistoryMessage } from "./api";

export function WelcomeBubble({ text }: { text: string }) {
    return (
        <div className="flex h-full min-h-[600px] w-full flex-col items-center justify-center gap-2 px-10 py-10 text-center">
            <p className="whitespace-pre-line text-xl font-medium leading-relaxed text-foreground">
                {text}
            </p>
        </div>
    );
}

export function HistoryBubble({ message }: { message: ThreadHistoryMessage }) {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be blocked by the browser; no user-visible action needed.
        }
    };

    return (
        <div className={`group my-2 flex flex-col px-4 ${isUser ? "items-end" : "items-start"}`}>
            <div
                className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${isUser
                    ? "whitespace-pre-wrap bg-[#005a71] text-white"
                    : "border border-[#e1efff] bg-white text-foreground dark:border-[#1E5F74] dark:bg-[#0d2d42]"
                    }`}
            >
                {isUser ? (
                    message.content
                ) : (
                    <RichContent
                        markdown={message.content}
                        className="prose-sm prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0"
                    />
                )}
            </div>
            <button
                onClick={handleCopy}
                className="mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Đã sao chép" : "Sao chép"}
            </button>
        </div>
    );
}

export function ToolCallHistoryCard({ message }: { message: ThreadHistoryMessage }) {
    let hasError = false;
    try {
        const parsed = JSON.parse(message.content);
        hasError = Boolean(parsed?.error);
    } catch {
        // Raw non-JSON tool output is still renderable.
    }

    return (
        <div className="my-2 px-4">
            <details className="group rounded-xl border border-[#e1efff] bg-white px-4 py-2.5 text-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                        <span
                            className={`size-2 shrink-0 rounded-full ${hasError ? "bg-red-500" : "bg-emerald-500"}`}
                        />
                        <span className="truncate font-mono text-xs font-semibold text-foreground">
                            {message.toolName}
                        </span>
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasError
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                            }`}
                    >
                        {hasError ? "Error" : "Done"}
                    </span>
                </summary>
                <div className="mt-2 space-y-2 border-t border-[#e1efff] pt-2 text-xs dark:border-[#1E5F74]">
                    {message.toolArgs !== undefined && (
                        <div>
                            <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                                Arguments
                            </p>
                            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
                                {JSON.stringify(message.toolArgs ?? {}, null, 2)}
                            </pre>
                        </div>
                    )}
                    <div>
                        <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                            Result
                        </p>
                        <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
                            {message.content}
                        </pre>
                    </div>
                </div>
            </details>
        </div>
    );
}
