"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";
import { invalidateThreadHistory } from "./api";
import { findFirstUserMessageContent } from "./message-content";

export function useAiThreadActivityTracker({
    agentId,
    threadId,
    onTouch,
    onGenerateTitle,
}: {
    agentId: string;
    threadId: string;
    onTouch: (id: string) => void;
    onGenerateTitle: (id: string, firstMessage: string) => void;
}) {
    const { agent } = useAgent({ agentId });
    const titledThreads = useRef<Set<string>>(new Set());
    const lastMessageSnapshotRef = useRef<{ threadId: string; count: number } | null>(null);
    const baselineMessageCountRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        baselineMessageCountRef.current.set(threadId, agent.messages?.length ?? 0);
        lastMessageSnapshotRef.current = { threadId, count: agent.messages?.length ?? 0 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);

    useEffect(() => {
        const messages = agent.messages ?? [];
        const previousBaseline = baselineMessageCountRef.current.get(threadId);
        const baseline =
            previousBaseline === undefined || messages.length < previousBaseline
                ? messages.length
                : previousBaseline;

        if (previousBaseline === undefined || messages.length < previousBaseline) {
            baselineMessageCountRef.current.set(threadId, baseline);
        }

        if (messages.length <= baseline) return;
        if (
            lastMessageSnapshotRef.current?.threadId === threadId &&
            lastMessageSnapshotRef.current.count === messages.length
        ) {
            return;
        }

        lastMessageSnapshotRef.current = { threadId, count: messages.length };
        invalidateThreadHistory(threadId);
        onTouch(threadId);

        const firstMessage = findFirstUserMessageContent(messages, baseline);
        if (firstMessage && !titledThreads.current.has(threadId)) {
            titledThreads.current.add(threadId);
            onGenerateTitle(threadId, firstMessage);
        }
    }, [agent.messages, onGenerateTitle, onTouch, threadId]);
}
