"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import type { ChatThread } from "./api";

interface ThreadSidebarProps {
    threads: ChatThread[];
    isLoading: boolean;
    activeThreadId: string | undefined;
    onSelectThread: (id: string) => void;
    onNewThread: () => void;
    isCreatingThread?: boolean;
    onRenameThread: (id: string, title: string) => void;
    onDeleteThread: (id: string) => void;
}

export function ThreadSidebar({
    threads,
    isLoading,
    activeThreadId,
    onSelectThread,
    onNewThread,
    isCreatingThread,
    onRenameThread,
    onDeleteThread,
}: ThreadSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startEdit = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const saveEdit = (id: string) => {
        if (editTitle.trim()) {
            onRenameThread(id, editTitle.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-muted/30">
            <div className="p-3">
                <button
                    onClick={onNewThread}
                    disabled={isCreatingThread}
                    className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Plus size={16} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {isLoading && <p className="px-2 text-sm text-muted-foreground">Đang tải...</p>}

                {threads.map((thread) => (
                    <div
                        key={thread.id}
                        className={`group mb-1 flex items-center gap-1 rounded-lg px-2 py-2 text-sm cursor-pointer ${activeThreadId === thread.id ? "bg-accent" : "hover:bg-accent/50"
                            }`}
                        onClick={() => editingId !== thread.id && onSelectThread(thread.id)}
                    >
                        {editingId === thread.id ? (
                            <>
                                <input
                                    autoFocus
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && saveEdit(thread.id)}
                                    className="flex-1 rounded border bg-background px-1 py-0.5 text-sm outline-none"
                                />
                                <button onClick={(e) => { e.stopPropagation(); saveEdit(thread.id); }}>
                                    <Check size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1 truncate">{thread.title}</span>
                                <button
                                    className="hidden group-hover:block"
                                    onClick={(e) => { e.stopPropagation(); startEdit(thread.id, thread.title); }}
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    className="hidden group-hover:block text-destructive"
                                    onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}