"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { uploadPostImage } from '@/features/blog/upload-post-image';
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper to convert Vietnamese accents and spaces to slug format
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

interface MetadataFormProps {
  title: string;
  setTitle: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  excerpt: string;
  setExcerpt: (val: string) => void;
  coverImage: string;
  setCoverImage: (val: string) => void;
  status: 'DRAFT' | 'PUBLISHED';
  setStatus: (val: 'DRAFT' | 'PUBLISHED') => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  categories: { id: string; name: string }[];
  isEdit?: boolean;
}

export function PostMetadataForm({
  title,
  setTitle,
  slug,
  setSlug,
  excerpt,
  setExcerpt,
  coverImage,
  setCoverImage,
  status,
  setStatus,
  categoryId,
  setCategoryId,
  categories,
  isEdit = false,
}: MetadataFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Khi edit, giữ nguyên slug hiện tại để không làm đổi URL của bài đã lưu
  // chỉ vì title được hydrate hoặc chỉnh sửa. Trang tạo mới vẫn tự sinh slug.
  const [isSlugManual, setIsSlugManual] = useState(isEdit);

  // Sync title with slug automatically unless user edited slug manually
  useEffect(() => {
    if (isSlugManual || !title) return;

    const nextSlug = slugify(title);
    // `setSlug` được truyền inline từ page nên đổi identity mỗi render. Guard
    // giá trị trước khi set để effect không tạo vòng lặp update vô hạn.
    if (slug !== nextSlug) setSlug(nextSlug);
  }, [title, slug, isSlugManual, setSlug]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một file ảnh hợp lệ!');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadPostImage(file);
      setCoverImage(imageUrl);
      toast.success('Upload ảnh bìa thành công!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload ảnh bìa.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeCoverImage = () => {
    setCoverImage('');
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0b1b2b]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <span>Thông tin cơ bản & SEO</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Cover Image Upload Area */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Ảnh bìa bài viết</Label>
            {coverImage ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 group bg-slate-50 dark:bg-slate-900/50">
                <img 
                  src={coverImage} 
                  alt="Ảnh bìa bài viết" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg opacity-90 hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
                  title="Xóa ảnh bìa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/20 hover:border-cyan-500/50 dark:hover:border-cyan-400/30 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse font-medium">
                      Đang upload ảnh bìa...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/20 transition-all mb-3 text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Tải lên ảnh bìa hoặc kéo thả
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Hỗ trợ định dạng JPG, PNG hoặc WEBP tối đa 5MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="post-title" className="text-slate-700 dark:text-slate-300 font-medium">Tên bài viết (Title)</Label>
            <Input
              id="post-title"
              placeholder="Nhập tiêu đề hấp dẫn để SEO và hiển thị..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus-visible:ring-cyan-500/50 rounded-lg"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="post-slug" className="text-slate-700 dark:text-slate-300 font-medium">Slug (Đường dẫn tĩnh)</Label>
            <Input
              id="post-slug"
              placeholder="duong-dan-bai-viet-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
              }}
              className="bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus-visible:ring-cyan-500/50 rounded-lg font-mono text-xs"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <Label htmlFor="post-excerpt" className="text-slate-700 dark:text-slate-300 font-medium">Mô tả ngắn (Excerpt)</Label>
            <Textarea
              id="post-excerpt"
              placeholder="Tóm tắt ngắn gọn nội dung chính của bài viết (hiển thị trên trang tìm kiếm)..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus-visible:ring-cyan-500/50 rounded-lg min-h-[90px] resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="post-category" className="text-slate-700 dark:text-slate-300 font-medium">Danh mục bài viết *</Label>
            <Select 
              value={categoryId} 
              onValueChange={setCategoryId}
            >
              <SelectTrigger id="post-category" className="bg-transparent border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-cyan-500/50">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="focus:bg-cyan-500/10 focus:text-cyan-700">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Status - Only shown when editing and read-only */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">Trạng thái bài đăng</Label>
              <div className="flex">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-800'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full mr-2 ${
                    status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  {status === 'PUBLISHED' ? 'Đã đăng bài (Published)' : 'Bản nháp (Draft)'}
                </span>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
