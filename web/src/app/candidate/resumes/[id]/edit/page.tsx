"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SocialLink { platform: string; url: string; }
interface Education { school: string; degree: string; field: string; startYear: string; endYear: string; description?: string; }
interface Experience { company: string; position: string; startYear: string; endYear: string; description?: string; }
interface Project { name: string; position?: string; link?: string; description?: string; }

interface ResumeData {
  title: string;
  address: string;
  summary: string;
  skills: string;
  degree: string;
  languages: string;
  socialLinks: SocialLink[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

export default function EditResumePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ResumeData>({
    title: "", address: "", summary: "", skills: "", degree: "", languages: "",
    socialLinks: [], education: [], experience: [], projects: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/resumes/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const r = d.data?.data ?? d.data;
        if (r) {
          setData({
            title: r.title || "",
            address: r.address || "",
            summary: r.summary || "",
            skills: r.skills || "",
            degree: r.degree || "",
            languages: r.languages || "",
            socialLinks: r.socialLinks || [],
            education: r.education || [],
            experience: r.experience || [],
            projects: r.projects || [],
          });
        }
      })
      .catch(() => toast.error("Không thể tải CV"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field: keyof ResumeData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (section: "education" | "experience" | "projects" | "socialLinks", index: number, field: string, value: string) => {
    setData((prev) => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  const addItem = (section: "education" | "experience" | "projects" | "socialLinks") => {
    const defaults: Record<string, any> = {
      education: { school: "", degree: "", field: "", startYear: "", endYear: "", description: "" },
      experience: { company: "", position: "", startYear: "", endYear: "", description: "" },
      projects: { name: "", position: "", link: "", description: "" },
      socialLinks: { platform: "", url: "" },
    };
    setData((prev) => ({ ...prev, [section]: [...prev[section], defaults[section]] }));
  };

  const removeItem = (section: "education" | "experience" | "projects" | "socialLinks", index: number) => {
    setData((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Đã lưu CV");
      router.push(`/candidate/resumes/${id}`);
    } catch {
      toast.error("Lưu CV thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-1" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa CV</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-1" /> {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      {/* Basic Info */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tiêu đề CV</label>
            <Input value={data.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Hồ sơ của tôi" />
          </div>
          <div>
            <label className="text-sm font-medium">Bằng cấp / Vị trí</label>
            <Input value={data.degree} onChange={(e) => updateField("degree", e.target.value)} placeholder="Frontend Developer" />
          </div>
          <div>
            <label className="text-sm font-medium">Địa chỉ</label>
            <Input value={data.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Phú Quốc, Kiên Giang" />
          </div>
          <div>
            <label className="text-sm font-medium">Ngôn ngữ</label>
            <Input value={data.languages} onChange={(e) => updateField("languages", e.target.value)} placeholder="Tiếng Anh, Tiếng Việt" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Tóm tắt bản thân</label>
          <Textarea value={data.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder="Mô tả ngắn về bản thân..." rows={3} />
        </div>
        <div>
          <label className="text-sm font-medium">Kỹ năng</label>
          <Input value={data.skills} onChange={(e) => updateField("skills", e.target.value)} placeholder="React, TypeScript, Node.js" />
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Kinh nghiệm làm việc</h2>
          <Button variant="outline" size="sm" onClick={() => addItem("experience")}>
            <Plus className="size-4 mr-1" /> Thêm
          </Button>
        </div>
        {data.experience.map((exp, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Kinh nghiệm #{i + 1}</h3>
              <Button variant="ghost" size="sm" onClick={() => removeItem("experience", i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={exp.company} onChange={(e) => updateArrayItem("experience", i, "company", e.target.value)} placeholder="Công ty" />
              <Input value={exp.position} onChange={(e) => updateArrayItem("experience", i, "position", e.target.value)} placeholder="Vị trí" />
              <Input value={exp.startYear} onChange={(e) => updateArrayItem("experience", i, "startYear", e.target.value)} placeholder="Năm bắt đầu" />
              <Input value={exp.endYear} onChange={(e) => updateArrayItem("experience", i, "endYear", e.target.value)} placeholder="Năm kết thúc" />
            </div>
            <Textarea value={exp.description || ""} onChange={(e) => updateArrayItem("experience", i, "description", e.target.value)} placeholder="Mô tả công việc..." rows={2} />
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Học vấn</h2>
          <Button variant="outline" size="sm" onClick={() => addItem("education")}>
            <Plus className="size-4 mr-1" /> Thêm
          </Button>
        </div>
        {data.education.map((edu, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Học vấn #{i + 1}</h3>
              <Button variant="ghost" size="sm" onClick={() => removeItem("education", i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={edu.school} onChange={(e) => updateArrayItem("education", i, "school", e.target.value)} placeholder="Trường" />
              <Input value={edu.degree} onChange={(e) => updateArrayItem("education", i, "degree", e.target.value)} placeholder="Bằng cấp" />
              <Input value={edu.field} onChange={(e) => updateArrayItem("education", i, "field", e.target.value)} placeholder="Chuyên ngành" />
              <Input value={edu.startYear} onChange={(e) => updateArrayItem("education", i, "startYear", e.target.value)} placeholder="Năm bắt đầu" />
              <Input value={edu.endYear} onChange={(e) => updateArrayItem("education", i, "endYear", e.target.value)} placeholder="Năm kết thúc" />
            </div>
            <Textarea value={edu.description || ""} onChange={(e) => updateArrayItem("education", i, "description", e.target.value)} placeholder="Mô tả..." rows={2} />
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Dự án</h2>
          <Button variant="outline" size="sm" onClick={() => addItem("projects")}>
            <Plus className="size-4 mr-1" /> Thêm
          </Button>
        </div>
        {data.projects.map((proj, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Dự án #{i + 1}</h3>
              <Button variant="ghost" size="sm" onClick={() => removeItem("projects", i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={proj.name} onChange={(e) => updateArrayItem("projects", i, "name", e.target.value)} placeholder="Tên dự án" />
              <Input value={proj.position || ""} onChange={(e) => updateArrayItem("projects", i, "position", e.target.value)} placeholder="Vị trí" />
              <Input value={proj.link || ""} onChange={(e) => updateArrayItem("projects", i, "link", e.target.value)} placeholder="Link" />
            </div>
            <Textarea value={proj.description || ""} onChange={(e) => updateArrayItem("projects", i, "description", e.target.value)} placeholder="Mô tả dự án..." rows={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
