"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { BlogEditor } from '@/components/blog/BlogEditor';
import { PostMetadataForm } from '@/components/blog/PostMetadataForm';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewBlogPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState<any>({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });

  const [saving, setSaving] = useState(false);

  // Load categories list
  useEffect(() => {
    fetch('/api/v1/blog-categories')
      .then(res => res.json())
      .then(payload => {
        const data = Array.isArray(payload.data?.items)
          ? payload.data.items
          : Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload)
              ? payload
              : [];
        setCategories(data);
      })
      .catch(err => {
        console.error('Lỗi khi tải danh mục:', err);
      });
  }, []);

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

  const handleSave = async (forcedStatus?: 'DRAFT' | 'PUBLISHED') => {
    const finalStatus = forcedStatus || status;

    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bài viết!');
      return;
    }

    if (!slug.trim()) {
      toast.error('Vui lòng nhập slug bài viết!');
      return;
    }

    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục bài viết!');
      return;
    }

    setSaving(true);
    const blogData = {
      title,
      slug,
      excerpt,
      thumbnail: coverImage, // Map coverImage to backend's thumbnail
      content,
      type: 'NORMAL',
      categoryId: categoryId || undefined,
      isPublished: finalStatus === 'PUBLISHED', // Map DRAFT/PUBLISHED status to isPublished boolean
    };

    try {
      const response = await fetch('/api/v1/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || 'Lỗi khi lưu bài viết');
      }

      const saved = body.data || body;
      toast.success(finalStatus === 'PUBLISHED' ? 'Đã đăng bài viết thành công!' : 'Đã lưu nháp bài viết!');
      router.push(saved.slug ? `/blog/${saved.slug}` : '/blog');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu bài viết.');
    } finally {
      setSaving(false);
    }
  };

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
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Lưu nháp</span>
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 font-medium shadow-md shadow-cyan-600/10 hover:shadow-lg hover:shadow-cyan-600/20 active:scale-95 transition-all"
              onClick={() => handleSave('PUBLISHED')}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 py-1"
              />
            </div>
            
            <BlogEditor
              value={content}
              onChange={setContent}
              placeholder="Bắt đầu nhập nội dung bài viết của bạn tại đây..."
            />
          </div>

          {/* Right Column: Sidebar Metadata Form */}
          <div className="lg:col-span-1">
            <PostMetadataForm
              title={title}
              setTitle={setTitle}
              slug={slug}
              setSlug={setSlug}
              excerpt={excerpt}
              setExcerpt={setExcerpt}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              status={status}
              setStatus={setStatus}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              categories={categories}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
