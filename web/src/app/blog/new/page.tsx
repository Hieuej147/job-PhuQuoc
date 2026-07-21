"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { BlogEditor } from '@/components/blog/BlogEditor';
import { PostMetadataForm } from '@/components/blog/PostMetadataForm';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { useBlogEditorForm } from "@/features/blog/use-blog-editor-form";

export default function NewBlogPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { state, patchState, categories, saving, save } = useBlogEditorForm();

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#071a2b]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#071a2b] px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Bạn chưa đăng nhập</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Vui lòng đăng nhập để bắt đầu viết bài.</p>
        <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => router.push('/auth/login?redirect=/blog/new')}>
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071a2b] py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 dark:bg-[#0b1b2b]/70 backdrop-blur border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 font-body">Góc viết lách</span>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight font-body">Viết bài mới</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 gap-1.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => save('DRAFT')}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Lưu nháp</span>
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 font-medium shadow-md shadow-cyan-600/10 hover:shadow-lg hover:shadow-cyan-600/20 active:scale-95 transition-all"
              onClick={() => save('PUBLISHED')}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Đăng bài</span>
            </Button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1.5 bg-white dark:bg-[#0b1b2b] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tiêu đề bài viết trong Editor</label>
              <input
                type="text"
                placeholder="Nhập tiêu đề hiển thị trong bài viết..."
                value={state.title}
                onChange={(e) => patchState({ title: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 py-1"
              />
            </div>
            
            <BlogEditor
              value={state.content}
              onChange={(content) => patchState({ content })}
              placeholder="Bắt đầu nhập nội dung bài viết của bạn tại đây..."
            />
          </div>

          {/* Right Column: Sidebar Metadata Form */}
          <div className="lg:col-span-1">
            <PostMetadataForm
              title={state.title}
              setTitle={(title) => patchState({ title })}
              slug={state.slug}
              setSlug={(slug) => patchState({ slug })}
              excerpt={state.excerpt}
              setExcerpt={(excerpt) => patchState({ excerpt })}
              coverImage={state.coverImage}
              setCoverImage={(coverImage) => patchState({ coverImage })}
              status={state.status}
              setStatus={(status) => patchState({ status })}
              categoryId={state.categoryId}
              setCategoryId={(categoryId) => patchState({ categoryId })}
              categories={categories}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
