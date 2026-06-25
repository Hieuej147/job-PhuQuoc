// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FILE HEADER & CHANGELOG — HuynhhThanh
// ─────────────────────────────────────────────────────────────────────────────
// ==============================================================================
//  File    : web/src/components/ui/RichTextEditor.tsx
//  Module  : components/ui
//  Tóm tắt : Wrapper component cho react-quill để tránh lỗi SSR
//  Tác giả : HuynhhThanh
//  Tạo lúc : 2026-06-25 11:00 (UTC+7)
//  Encode  : UTF-8
//  Version : 1.0.0
//  Lịch sử :
//  - [2026-06-25 11:00] v1.0.0 : Tạo mới
// ------------------------------------------------------------------------------
//  Changelog — lần thay đổi gần nhất
// ------------------------------------------------------------------------------
//  | Trường          | Nội dung                                                |
//  |-----------------|----------------------------------------------------------|
//  | **Người sửa**   | HuynhhThanh                                   |
//  | **Loại**        | Tạo mới                                                  |
//  | **Mức độ**      | S (1 file)                                               |
//  | **Version**     | `v0.0.0 → v1.0.0`                                        |
//  | **PR / Issue**  | Không                                                    |
//  | **Reviewer**    | HuynhhThanh · ✅ Approved                                |
//  | **Tóm tắt**     | Tạo RichTextEditor component dựa trên react-quill        |
//  | **Phụ thuộc**   | `react-quill`                                            |
//  | **Skill/Tool**  | Không                                                    |
//  | **Chi tiết**    | - Tạo component bọc `react-quill` bằng `next/dynamic`    |
//  |                 |   với tuỳ chọn `ssr: false` để tránh lỗi document is     |
//  |                 |   not defined trên Server side của Next.js               |
//  |                 | - Hỗ trợ Tailwind dark mode                              |
//  | **Ảnh hưởng**   | Không                                                    |
//  | **Test / CI**   | ✅ Build thành công                                        |
//  | **Trạng thái**  | ✅ Hoàn thành                                              |
// ==============================================================================
"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="bg-white dark:bg-[#0d2d42] rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-48 mb-12"
      />
    </div>
  );
}
