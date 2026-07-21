export function getMessageTextContent(message: unknown) {
    const content = (message as { content?: unknown } | null)?.content;

    if (typeof content === "string") return content.trim();
    if (content == null) return "";

    return JSON.stringify(content).trim();
}

export function findFirstUserMessageContent(messages: unknown[], startIndex = 0) {
    const firstUserMessage = messages
        .slice(startIndex)
        .find((message) => (message as { role?: unknown })?.role === "user");
    return getMessageTextContent(firstUserMessage);
}
