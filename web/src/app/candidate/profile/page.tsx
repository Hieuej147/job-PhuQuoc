"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { 
  User, Mail, Phone, MapPin, Award, Languages, 
  Briefcase, GraduationCap, FileText, Share2, 
  Save, CheckCircle2, Circle, Upload, Plus, Trash2, Camera, Pencil, X
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Loading & Saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);

  // Active section to edit
  const [activeSection, setActiveSection] = useState<string>("basic");

  // Profile data states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [address, setAddress] = useState("");
  const [degree, setDegree] = useState("");
  const [languages, setLanguages] = useState("");
  const [skills, setSkills] = useState("");
  const [summary, setSummary] = useState("");
  
  // Array types (Experiences & Educations)
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  
  // Social Links
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");

  // Temp item builders
  const [newExp, setNewExp] = useState<Experience>({ company: "", position: "", startYear: "", endYear: "", description: "" });
  const [newEdu, setNewEdu] = useState<Education>({ school: "", degree: "", field: "", startYear: "", endYear: "" });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/resumes/profile", { credentials: "include" });
        if (res.ok) {
          const payload = await res.json();
          const p = payload?.data?.data || payload?.data || {};
          
          setName(p.name || user?.name || "");
          setPhone(p.phone || user?.phone || "");
          setEmail(p.email || user?.email || "");
          setAvatar(p.avatar || user?.image || "");
          setAddress(p.address || "");
          setDegree(p.degree || "");
          setLanguages(p.languages || "");
          setSkills(p.skills || "");
          setSummary(p.summary || "");
          
          setExperiences(Array.isArray(p.experience) ? p.experience : []);
          setEducations(Array.isArray(p.education) ? p.education : []);
          
          const socials = p.socialLinks || {};
          setFacebook(socials.facebook || "");
          setLinkedin(socials.linkedin || "");
          setGithub(socials.github || "");
          setWebsite(socials.website || "");
          
          setHasLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user && !hasLoaded) {
      fetchProfile();
    }
  }, [user, hasLoaded]);

  // Handle saving profile changes
  const handleSave = async (overrideData?: Record<string, any>, options?: { silent?: boolean }): Promise<boolean> => {
    const showToast = !options?.silent && !overrideData;
    setSaving(true);
    
    // Helper to get missing experience fields
    const getMissingExpFields = () => {
      const missing: string[] = [];
      if (!newExp.company) missing.push("Tên công ty");
      if (!newExp.position) missing.push("Chức danh");
      if (!newExp.startYear) missing.push("Năm bắt đầu");
      if (!newExp.endYear) missing.push("Năm kết thúc");
      if (!newExp.description) missing.push("Mô tả công việc");
      return missing;
    };
    const missingExp = getMissingExpFields();
    const hasAnyExp = missingExp.length < 5; // at least 1 field filled
    let currentExperiences = [...experiences];
    if (!options?.silent && activeSection === "experience" && experiences.length === 0 && missingExp.length > 0) {
      toast.error(`Còn thiếu: ${missingExp.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (!options?.silent && activeSection === "experience" && hasAnyExp && missingExp.length > 0) {
      toast.error(`Còn thiếu: ${missingExp.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (missingExp.length === 0) {
      currentExperiences.push(newExp);
      setExperiences(currentExperiences);
      setNewExp({ company: "", position: "", startYear: "", endYear: "", description: "" });
    }

    // Helper to get missing education fields
    const getMissingEduFields = () => {
      const missing: string[] = [];
      if (!newEdu.school) missing.push("Tên trường");
      if (!newEdu.degree) missing.push("Bằng cấp");
      if (!newEdu.field) missing.push("Ngành học");
      if (!newEdu.startYear) missing.push("Năm bắt đầu");
      if (!newEdu.endYear) missing.push("Năm kết thúc");
      return missing;
    };
    const missingEdu = getMissingEduFields();
    const hasAnyEdu = missingEdu.length < 5;
    let currentEducations = [...educations];
    if (!options?.silent && activeSection === "education" && educations.length === 0 && missingEdu.length > 0) {
      toast.error(`Còn thiếu: ${missingEdu.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (!options?.silent && activeSection === "education" && hasAnyEdu && missingEdu.length > 0) {
      toast.error(`Còn thiếu: ${missingEdu.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (missingEdu.length === 0) {
      currentEducations.push(newEdu);
      setEducations(currentEducations);
      setNewEdu({ school: "", degree: "", field: "", startYear: "", endYear: "" });
    }

    const socialLinks = {
      facebook,
      linkedin,
      github,
      website
    };

    const saveData = {
      name,
      phone,
      email,
      avatar,
      address,
      degree,
      languages,
      skills,
      summary,
      experience: currentExperiences,
      education: currentEducations,
      socialLinks,
      ...overrideData
    };

    try {
      const res = await fetch("/api/v1/resumes/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(saveData),
      });

      if (res.ok) {
        // Refresh auth user state
        const authRes = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (authRes.ok) {
          const authPayload = await authRes.json();
          const updatedUser = authPayload?.data?.user || authPayload?.user || null;
          if (updatedUser) {
            setUser(updatedUser);
          }
        }
        if (showToast) {
          toast.success("Lưu thông tin hồ sơ thành công!");
        }
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || "Lỗi khi lưu thông tin.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Lỗi kết nối khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
    return true;
  };

  const handleSectionChange = async (sectionId: string) => {
    if (activeSection !== sectionId) {
      // Auto-save current active section inputs before switching
      await handleSave(undefined, { silent: true });
      setActiveSection(sectionId);
    }
  };

  // Upload Avatar handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/v1/upload/candidate-avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const avatarUrl = result?.data?.avatar ?? result?.avatar;
        if (avatarUrl) {
          setAvatar(avatarUrl);
          await handleSave({ avatar: avatarUrl });
        }
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || "Lỗi khi upload ảnh.");
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Lỗi kết nối khi tải ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Array item builders
  const addExperience = () => {
    const missing: string[] = [];
    if (!newExp.company) missing.push("Tên công ty");
    if (!newExp.position) missing.push("Chức danh");
    if (!newExp.startYear) missing.push("Năm bắt đầu");
    if (!newExp.endYear) missing.push("Năm kết thúc");
    if (!newExp.description) missing.push("Mô tả công việc");
    if (missing.length > 0) {
      toast.error(`Còn thiếu: ${missing.join(", ")}.`);
      return;
    }
    const updated = [...experiences, newExp];
    setExperiences(updated);
    setNewExp({ company: "", position: "", startYear: "", endYear: "", description: "" });
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    setExperiences(updated);
  };

  const addEducation = () => {
    const missing: string[] = [];
    if (!newEdu.school) missing.push("Tên trường");
    if (!newEdu.degree) missing.push("Bằng cấp");
    if (!newEdu.field) missing.push("Ngành học");
    if (!newEdu.startYear) missing.push("Năm bắt đầu");
    if (!newEdu.endYear) missing.push("Năm kết thúc");
    if (missing.length > 0) {
      toast.error(`Còn thiếu: ${missing.join(", ")}.`);
      return;
    }
    const updated = [...educations, newEdu];
    setEducations(updated);
    setNewEdu({ school: "", degree: "", field: "", startYear: "", endYear: "" });
  };

  const removeEducation = (index: number) => {
    const updated = educations.filter((_, i) => i !== index);
    setEducations(updated);
  };

  // Define all trackable input fields per section
  const sectionFields: Record<string, { filled: boolean }[]> = {
    basic: [
      { filled: Boolean(name) },
      { filled: Boolean(phone) },
      { filled: Boolean(email) },
      { filled: Boolean(address) },
      { filled: Boolean(degree) },
      { filled: Boolean(languages) },
      { filled: Boolean(skills) },
    ],
    avatar: [
      { filled: Boolean(avatar) },
    ],
    experience: [
      { filled: experiences.length > 0 },
    ],
    education: [
      { filled: educations.length > 0 },
    ],
    summary: [
      { filled: Boolean(summary) },
    ],
    socials: [
      { filled: Boolean(facebook) },
      { filled: Boolean(linkedin) },
      { filled: Boolean(github) },
      { filled: Boolean(website) },
    ],
  };

  // Total filled inputs / total inputs → percentage
  const allFields = Object.values(sectionFields).flat();
  const totalFields = allFields.length;
  const filledFields = allFields.filter((f) => f.filled).length;
  const completionPct = Math.round((filledFields / totalFields) * 100);

  // A section is "done" only when ALL its inputs are filled
  const isSectionDone = (sectionId: string) => {
    const fields = sectionFields[sectionId];
    if (!fields || fields.length === 0) return false;
    return fields.every((f) => f.filled);
  };

  const checklist = [
    { id: "basic", label: "Thông tin cơ bản (tên, email, SĐT)", done: isSectionDone("basic"), icon: <User className="size-4" /> },
    { id: "avatar", label: "Ảnh đại diện", done: isSectionDone("avatar"), icon: <Camera className="size-4" /> },
    { id: "experience", label: "Kinh nghiệm làm việc", done: isSectionDone("experience"), icon: <Briefcase className="size-4" /> },
    { id: "education", label: "Học vấn & bằng cấp", done: isSectionDone("education"), icon: <GraduationCap className="size-4" /> },
    { id: "summary", label: "Tóm tắt bản thân (resume summary)", done: isSectionDone("summary"), icon: <FileText className="size-4" /> },
    { id: "socials", label: "Liên kết mạng xã hội", done: isSectionDone("socials"), icon: <Share2 className="size-4" /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý và cập nhật thông tin hồ sơ gốc của bạn.</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm" variant="outline">
              <Pencil className="size-4 mr-1.5" />
              Sửa hồ sơ
            </Button>
          ) : (
            <>
              <Button onClick={() => setEditing(false)} size="sm" variant="ghost">
                <X className="size-4 mr-1.5" />
                Hủy
              </Button>
              <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                <Save className="size-4 mr-1.5" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Checklist Completion */}
        <Card className="lg:col-span-1 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)] h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">Hoàn thiện hồ sơ</CardTitle>
            <CardDescription className="text-xs">Đạt 100% để hiển thị hồ sơ cá nhân đầy đủ và chuyên nghiệp nhất.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-[#94A3B8] text-xs">Tổng thể</span>
                <span className="font-bold text-[#005a71] dark:text-[#67E8F9]">{completionPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1efff] dark:bg-[#1E5F74]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#005a71] to-[#0e7490] transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex items-center gap-3 w-full text-left p-2 rounded-xl transition border ${
                    activeSection === item.id 
                      ? "border-[#005a71]/30 bg-[#005a71]/5 dark:bg-[#67E8F9]/10 text-slate-900 dark:text-cyan-400 font-semibold" 
                      : "border-transparent text-gray-500 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {item.done ? (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="size-3.5 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1E5F74]/30">
                      <Circle className="size-3.5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs truncate flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Section Form Editor */}
        <Card className="lg:col-span-2 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
          <CardContent className="p-6">
            
            {/* Section: Basic Info */}
            {activeSection === "basic" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <User className="size-5 text-[#005a71]" />
                  Thông tin cơ bản
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Họ và tên</label>
                    {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{name || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Số điện thoại</label>
                    {editing ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{phone || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email liên hệ</label>
                    <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] opacity-60">{email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Địa chỉ</label>
                    {editing ? (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" placeholder="Phú Quốc, Kiên Giang" />
                      </div>
                    ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{address || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Học vị / Học hàm</label>
                    {editing ? (
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input value={degree} onChange={(e) => setDegree(e.target.value)} className="pl-10" placeholder="Cử nhân CNTT" />
                      </div>
                    ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{degree || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ngôn ngữ</label>
                    {editing ? (
                      <div className="relative">
                        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input value={languages} onChange={(e) => setLanguages(e.target.value)} className="pl-10" placeholder="Tiếng Việt, Tiếng Anh" />
                      </div>
                    ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{languages || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Kỹ năng (phân cách bằng dấu phẩy)</label>
                    {editing ? <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Next.js, Prisma" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{skills || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                </div>
                {editing && (
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                      <Save className="size-4 mr-1.5" />
                      {saving ? "Đang lưu..." : "Lưu thông tin cơ bản"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Section: Avatar */}
            {activeSection === "avatar" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <Camera className="size-5 text-[#005a71]" />
                  Ảnh đại diện
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="relative size-32 rounded-full overflow-hidden border-2 border-cyan-500 shadow-lg bg-slate-100 flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <User className="size-16 text-slate-400" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Spinner size="sm" className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {editing && (
                    <>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={uploadingAvatar}
                        />
                        <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar}>
                          <Upload className="size-4 mr-1.5" />
                          {uploadingAvatar ? "Đang tải ảnh..." : "Chọn ảnh từ máy tính"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Chấp nhận JPG, PNG, WEBP. Tối đa 5MB.</p>
                    </>
                  )}
                  {!editing && !avatar && <p className="text-xs text-muted-foreground italic">Chưa có ảnh đại diện</p>}
                </div>
              </div>
            )}

            {/* Section: Experience */}
            {activeSection === "experience" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <Briefcase className="size-5 text-[#005a71]" />
                  Kinh nghiệm làm việc
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>

                {/* List of existing experiences */}
                <div className="space-y-3">
                  {experiences.map((exp, index) => (
                    <div key={index} className="flex justify-between items-start p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-[#E0F2FE]">{exp.position}</p>
                        <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{exp.company}</p>
                        <p className="text-[10px] text-muted-foreground">{exp.startYear} – {exp.endYear || "Hiện tại"}</p>
                        {exp.description && <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 whitespace-pre-wrap">{exp.description}</p>}
                      </div>
                      {editing && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 size-8" onClick={() => removeExperience(index)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {experiences.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-6">Chưa có kinh nghiệm nào được ghi nhận.</p>
                  )}
                </div>

                {/* Add new experience form - only in editing mode */}
                {editing && (
                  <>
                    <div className="p-4 rounded-xl border border-dashed space-y-3">
                      <p className="text-xs font-bold text-[#005a71] dark:text-[#67E8F9]">+ Thêm kinh nghiệm mới</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Tên công ty *</label>
                          <Input value={newExp.company} onChange={(e) => setNewExp({...newExp, company: e.target.value})} placeholder="FPT Software" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Chức danh / Vị trí *</label>
                          <Input value={newExp.position} onChange={(e) => setNewExp({...newExp, position: e.target.value})} placeholder="Frontend Engineer" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm bắt đầu *</label>
                          <Input value={newExp.startYear} onChange={(e) => setNewExp({...newExp, startYear: e.target.value})} placeholder="2021" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm kết thúc *</label>
                          <Input value={newExp.endYear} onChange={(e) => setNewExp({...newExp, endYear: e.target.value})} placeholder="2023" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Mô tả công việc *</label>
                          <Textarea value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} placeholder="Xây dựng giao diện web, tối ưu hóa CSS..." rows={3} />
                        </div>
                      </div>
                      <Button type="button" size="sm" onClick={addExperience}>
                        <Plus className="size-4 mr-1" /> Thêm vào danh sách
                      </Button>
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-4">
                      <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                        <Save className="size-4 mr-1.5" />
                        {saving ? "Đang lưu..." : "Lưu kinh nghiệm làm việc"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Section: Education */}
            {activeSection === "education" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <GraduationCap className="size-5 text-[#005a71]" />
                  Học vấn & bằng cấp
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>

                {/* List of existing educations */}
                <div className="space-y-3">
                  {educations.map((edu, index) => (
                    <div key={index} className="flex justify-between items-start p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-[#E0F2FE]">{edu.school}</p>
                        <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{edu.degree} – {edu.field}</p>
                        <p className="text-[10px] text-muted-foreground">{edu.startYear} – {edu.endYear || "Hiện tại"}</p>
                      </div>
                      {editing && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 size-8" onClick={() => removeEducation(index)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {educations.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-6">Chưa có học vấn nào được ghi nhận.</p>
                  )}
                </div>

                {/* Add new education form - only in editing mode */}
                {editing && (
                  <>
                    <div className="p-4 rounded-xl border border-dashed space-y-3">
                      <p className="text-xs font-bold text-[#005a71] dark:text-[#67E8F9]">+ Thêm học vấn mới</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Tên trường *</label>
                          <Input value={newEdu.school} onChange={(e) => setNewEdu({...newEdu, school: e.target.value})} placeholder="Đại học Công nghệ thông tin" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Bằng cấp *</label>
                          <Input value={newEdu.degree} onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})} placeholder="Cử nhân" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Ngành học / Chuyên ngành *</label>
                          <Input value={newEdu.field} onChange={(e) => setNewEdu({...newEdu, field: e.target.value})} placeholder="Kỹ thuật phần mềm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm bắt đầu *</label>
                          <Input value={newEdu.startYear} onChange={(e) => setNewEdu({...newEdu, startYear: e.target.value})} placeholder="2018" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm kết thúc *</label>
                          <Input value={newEdu.endYear} onChange={(e) => setNewEdu({...newEdu, endYear: e.target.value})} placeholder="2022" />
                        </div>
                      </div>
                      <Button type="button" size="sm" onClick={addEducation}>
                        <Plus className="size-4 mr-1" /> Thêm vào danh sách
                      </Button>
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-4">
                      <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                        <Save className="size-4 mr-1.5" />
                        {saving ? "Đang lưu..." : "Lưu học vấn & bằng cấp"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Section: Summary */}
            {activeSection === "summary" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <FileText className="size-5 text-[#005a71]" />
                  Tóm tắt bản thân
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tóm tắt nghề nghiệp (giới thiệu bản thân và mục tiêu)</label>
                  {editing ? (
                    <Textarea 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)} 
                      placeholder="Tôi là một Frontend Developer có 2 năm kinh nghiệm thiết kế UI/UX..." 
                      rows={8} 
                    />
                  ) : (
                    <div className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[100px] whitespace-pre-wrap">
                      {summary || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                    </div>
                  )}
                </div>
                {editing && (
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                      <Save className="size-4 mr-1.5" />
                      {saving ? "Đang lưu..." : "Lưu tóm tắt bản thân"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Section: Socials */}
            {activeSection === "socials" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                  <Share2 className="size-5 text-[#005a71]" />
                  Liên kết mạng xã hội
                  {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Facebook</label>
                    {editing ? <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{facebook || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">LinkedIn</label>
                    {editing ? <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{linkedin || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">GitHub</label>
                    {editing ? <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{github || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Website cá nhân / Blog</label>
                    {editing ? <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mywebsite.com" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{website || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                  </div>
                </div>
                {editing && (
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                      <Save className="size-4 mr-1.5" />
                      {saving ? "Đang lưu..." : "Lưu liên kết mạng xã hội"}
                    </Button>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
