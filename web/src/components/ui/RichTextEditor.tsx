"use client";

import { Editor, useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Button } from '@/components/ui/button';
import { Bold, Eraser, Heading2, Heading3, Italic, List, ListOrdered, Redo2, Strikethrough, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MarkdownRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type MarkdownStorage = {
  storage: {
    markdown?: {
      getMarkdown: () => string;
    };
  };
};

// Plugin tiptap-markdown có storage runtime nhưng type của Tiptap không khai báo sẵn.
// Helper này gom phần cast ở một chỗ để form luôn nhận/lưu Markdown thay vì HTML.
function getMarkdown(editor: Editor) {
  return (editor as Editor & MarkdownStorage).storage.markdown?.getMarkdown() ?? "";
}

// Giữ selection trong editor khi bấm toolbar.
// Nếu không prevent mousedown, browser có thể focus vào button trước khi command apply.
function keepSelection(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const refresh = () => setVersion((version) => version + 1);
    editor.on('selectionUpdate', refresh);
    editor.on('transaction', refresh);
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 p-1.5 bg-gray-50/50 dark:bg-slate-900/50 rounded-t-md">
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        type="button"
        title="In đậm"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        type="button"
        title="In nghiêng"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
        type="button"
        title="Gạch ngang"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        type="button"
        title="Tiêu đề 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        type="button"
        title="Tiêu đề 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
      
      <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        type="button"
        title="Danh sách dấu chấm"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        type="button"
        title="Danh sách số"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().undo().run();
        }}
        type="button"
        title="Hoàn tác"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().redo().run();
        }}
        type="button"
        title="Làm lại"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={keepSelection}
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().unsetAllMarks().clearNodes().run();
        }}
        type="button"
        title="Xóa định dạng"
      >
        <Eraser className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder }: MarkdownRichEditorProps) {
  const lastEmittedValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      // Job content lưu Markdown. Tắt transform paste/copy để thao tác giống Word hơn và tránh editor tự đổi text khi đang gõ dài.
      Markdown.configure({
        transformPastedText: false,
        transformCopiedText: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert sm:prose-base focus:outline-none min-h-[180px] max-h-[420px] overflow-y-auto p-4 max-w-none',
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain');
        const html = event.clipboardData?.getData('text/html');
        if (!text || !html) return false;
        if (!/class="?Mso|mso-|Microsoft|Word/i.test(html)) return false;
        event.preventDefault();
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      // Mỗi lần người dùng gõ/format, đẩy Markdown về parent form state.
      const markdown = getMarkdown(editor);
      lastEmittedValue.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && value !== lastEmittedValue.current) {
      // Sync value từ bên ngoài vào editor mà không emit update ngược lại,
      // tránh vòng lặp state và tránh ghi đè nội dung khi người dùng đang gõ.
      editor.commands.setContent(value, { emitUpdate: false });
      lastEmittedValue.current = value;
    }
  }, [value, editor]);

  return (
    <div className="bg-white dark:bg-[#0d2d42] rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="cursor-text" />
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
