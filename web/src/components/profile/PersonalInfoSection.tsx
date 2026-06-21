"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Trash2, Lock, Save, Camera } from "lucide-react";
import { toast } from "sonner";

interface PersonalInfoSectionProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
  resume: {
    address: string;
    degree: string;
    languages: string;
    summary: string;
  } | null;
  onSave: (data: {
    name: string;
    phone: string;
    image: string | null;
    address: string;
    degree: string;
    languages: string;
    summary: string;
  }) => Promise<void>;
  saving: boolean;
}

export function PersonalInfoSection({ user, resume, onSave, saving }: PersonalInfoSectionProps) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [image, setImage] = useState<string | null>(user.image || null);
  
  const [address, setAddress] = useState(resume?.address || "");
  const [degree, setDegree] = useState(resume?.degree || "Đại học");
  const [languages, setLanguages] = useState(resume?.languages || "");
  const [summary, setSummary] = useState(resume?.summary || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name || "");
    setPhone(user.phone || "");
    setImage(user.image || null);
  }, [user]);

  useEffect(() => {
    if (resume) {
      setAddress(resume.address || "");
      setDegree(resume.degree || "Đại học");
      setLanguages(resume.languages || "");
      setSummary(resume.summary || "");
    }
  }, [resume]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh vượt quá dung lượng 5MB cho phép");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveClick = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    try {
      await onSave({
        name,
        phone,
        image,
        address,
        degree,
        languages,
        summary,
      });
    } catch (error) {
      toast.error("Lỗi khi lưu thông tin");
    }
  };

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "NT";

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Ảnh & thông tin cơ bản</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Cập nhật ảnh đại diện và thông tin liên hệ của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
          <div className="relative size-24 shrink-0">
            {image ? (
              <img
                src={image}
                alt={name}
                className="size-24 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/20">
                {initials}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full cursor-pointer shadow-lg transition-colors">
              <Camera className="size-4" />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="font-semibold text-base">Ảnh đại diện</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              JPG, PNG tối đa 5MB. Ảnh rõ mặt, chuyên nghiệp sẽ tăng cơ hội được chú ý.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 border-border hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4 mr-1.5" /> Tải ảnh lên
              </Button>
              {image && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 px-3"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Họ và tên <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên"
              className="bg-transparent border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                value={user.email}
                disabled
                className="bg-muted border-border pr-10 opacity-70 cursor-not-allowed"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Email không thể thay đổi sau khi đăng ký</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Số điện thoại</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="bg-transparent border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Địa chỉ hiển thị trên CV</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: Dương Đông, Phú Quốc"
              className="bg-transparent border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Trình độ học vấn cao nhất</label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            >
              <option value="Trung học">Trung học</option>
              <option value="Trung cấp">Trung cấp</option>
              <option value="Cao đẳng">Cao đẳng</option>
              <option value="Đại học">Đại học</option>
              <option value="Sau đại học">Sau đại học</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Ngôn ngữ</label>
            <Input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="Ví dụ: Tiếng Việt (bản ngữ), Tiếng Anh (B2)"
              className="bg-transparent border-border"
            />
          </div>
        </div>

        {/* Summary Textarea */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Tóm tắt bản thân (Resume summary – hiển thị đầu CV)
          </label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Giới thiệu ngắn gọn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp..."
            className="min-h-[120px] bg-transparent border-border"
            maxLength={500}
          />
          <div className="text-right text-xs text-muted-foreground">
            {summary.length} / 500 ký tự
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveClick}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 h-10 flex items-center gap-2"
          >
            <Save className="size-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
