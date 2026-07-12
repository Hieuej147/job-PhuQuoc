"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import {
  FileText, Search, Edit2, Trash2, Plus, Eye, Calendar,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteBlogPost, getMyBlogs } from '@/features/blog-management/api';

export function BlogManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;

  // Theme styling helpers based on role
  const isEmployer = role === 'EMPLOYER';

  // Theme styling classes mapping
  const btnClass = isEmployer
    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10 hover:shadow-amber-600/20'
    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/10 hover:shadow-cyan-600/20';

  const textClass = isEmployer ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400';
  const bgLightClass = isEmployer ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-cyan-50 dark:bg-cyan-950/20';

  // API State
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderBy, setOrderBy] = useState('newest');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Load user's blog posts
  const loadBlogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        orderBy: orderBy,
      });

      const actualData = await getMyBlogs(queryParams.toString());
      setBlogs(actualData.items || []);
      setTotal(actualData.total || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi kết nối với máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBlogs();
    }
  }, [user, page, debouncedSearch, orderBy]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteBlogPost(deleteTarget.id);
      toast.success('Đã xóa bài viết thành công!');
      // Reload list or shift pages if necessary
      if (blogs.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        loadBlogs();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Có lỗi xảy ra khi xóa bài viết.');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 font-sans">

      {/* Upper Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0b1b2b] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${bgLightClass} ${textClass}`}>
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Quản lý bài viết Blog
              <Sparkles className={`h-4.5 w-4.5 ${textClass} animate-pulse`} />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Tạo mới, biên tập và quản lý các bài viết cẩm nang công nghệ/kinh nghiệm nghề nghiệp của bạn.
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push('/blog/new')}
          className={`h-10 px-4 rounded-xl font-semibold gap-1.5 transition-all active:scale-95 ${btnClass}`}
        >
          <Plus className="h-4 w-4" />
          <span>Viết bài mới</span>
        </Button>
      </div>

      {/* Filter and List Section */}
      <div className="bg-white dark:bg-[#0b1b2b] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Search Bar header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-[#061421] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Sắp xếp:</span>
            <Select 
              value={orderBy} 
              onValueChange={setOrderBy}
            >
              <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-[#061421] border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-primary/20">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất (Ngày đăng)</SelectItem>
                <SelectItem value="oldest">Cũ nhất (Ngày đăng)</SelectItem>
                <SelectItem value="views">Lượt xem nhiều nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className={`h-8 w-8 animate-spin ${textClass}`} />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải danh sách bài viết...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center gap-3">
            <div className={`p-4 rounded-full ${bgLightClass} ${textClass}`}>
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-2">Chưa có bài viết nào</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {debouncedSearch
                ? 'Không tìm thấy bài viết nào khớp với từ khóa tìm kiếm của bạn.'
                : 'Bạn chưa tạo bài viết blog nào. Hãy chia sẻ bài viết đầu tiên của bạn ngay hôm nay!'}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={() => router.push('/blog/new')}
                className={`mt-2 font-semibold px-5 rounded-xl ${btnClass}`}
              >
                Tạo bài viết đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {blogs.map((blog) => {
              const formattedDate = new Date(blog.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              return (
                <div key={blog.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">

                  {/* Blog Meta Detail */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative w-20 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                      {blog.thumbnail ? (
                        <img
                          src={blog.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Link
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        className="font-bold text-slate-800 dark:text-white hover:text-primary hover:underline line-clamp-1 text-sm sm:text-base leading-snug"
                      >
                        {blog.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {blog.views || 0} lượt xem
                        </span>
                        {blog.category && (
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${bgLightClass} ${textClass}`}>
                            {blog.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center justify-end gap-3 flex-shrink-0">
                    {/* Status Badge */}
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${blog.isPublished
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800'
                      }`}>
                      {blog.isPublished ? 'Đã đăng' : 'Bản nháp'}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 border border-slate-200/60 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-[#061421]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md"
                        onClick={() => router.push(`/blog/${blog.slug}/edit`)}
                        title="Sửa bài viết"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-md"
                        onClick={() => setDeleteTarget(blog)}
                        disabled={deletingId === blog.id}
                        title="Xóa bài viết"
                      >
                        {deletingId === blog.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hiển thị {blogs.length} trên {total} bài viết
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8.5 w-8.5 rounded-lg border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 disabled:opacity-50"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8.5 w-8.5 rounded-lg border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 disabled:opacity-50"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài viết?</DialogTitle>
            <DialogDescription>
              Bài "{deleteTarget?.title}" sẽ bị xóa khỏi danh sách quản lý blog của bạn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={Boolean(deletingId)}>
              {deletingId ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Xóa bài viết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
