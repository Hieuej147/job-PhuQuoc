"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createBlogPost,
  EMPTY_BLOG_EDITOR_DOC,
  fetchBlogBySlug,
  fetchBlogCategories,
  updateBlogPost,
} from "./api";
import type { BlogCategoryOption, BlogEditorState, BlogPostStatus } from "./types";

const INITIAL_STATE: BlogEditorState = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  status: "DRAFT",
  categoryId: "",
  content: EMPTY_BLOG_EDITOR_DOC,
};

function validateBlogState(state: BlogEditorState) {
  if (!state.title.trim()) return "Vui lòng nhập tên bài viết!";
  if (!state.slug.trim()) return "Vui lòng nhập slug bài viết!";
  if (!state.categoryId) return "Vui lòng chọn danh mục bài viết!";
  return null;
}

export function useBlogEditorForm(options: { slug?: string } = {}) {
  const router = useRouter();
  const [state, setState] = useState<BlogEditorState>(INITIAL_STATE);
  const [categories, setCategories] = useState<BlogCategoryOption[]>([]);
  const [loading, setLoading] = useState(Boolean(options.slug));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patchState = useCallback((patch: Partial<BlogEditorState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    fetchBlogCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Lỗi khi tải danh mục:", err);
      });
  }, []);

  useEffect(() => {
    if (!options.slug) return;
    let active = true;
    setLoading(true);
    fetchBlogBySlug(options.slug)
      .then((post) => {
        if (active) setState(post);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải bài viết");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [options.slug]);

  const save = async (forcedStatus?: BlogPostStatus) => {
    const finalStatus = forcedStatus || state.status;
    const validationError = validateBlogState(state);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (options.slug && !state.id) {
      toast.error("Không tìm thấy ID bài viết hợp lệ. Vui lòng tải lại trang!");
      return;
    }

    setSaving(true);
    try {
      const saved = state.id
        ? await updateBlogPost(state.id, state, finalStatus)
        : await createBlogPost(state, finalStatus);
      toast.success(
        state.id
          ? finalStatus === "PUBLISHED"
            ? "Đã cập nhật và đăng bài viết!"
            : "Đã lưu nháp bài viết!"
          : finalStatus === "PUBLISHED"
            ? "Đã đăng bài viết thành công!"
            : "Đã lưu nháp bài viết!",
      );
      if (saved.slug) {
        router.push(
          finalStatus === "PUBLISHED"
            ? `/blog/${saved.slug}`
            : `/blog/${saved.slug}/edit`,
        );
      } else {
        router.push("/blog");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu bài viết.");
    } finally {
      setSaving(false);
    }
  };

  return {
    state,
    patchState,
    categories,
    loading,
    error,
    saving,
    save,
  };
}
