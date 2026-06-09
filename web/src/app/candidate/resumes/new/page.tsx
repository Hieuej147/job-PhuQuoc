"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { TemplateRenderer } from "@/components/cv/template-renderer";
import { useResumeEditor } from "@/hooks/use-resume-editor";

interface Template {
  id: string;
  name: string;
  description: string | null;
  htmlTemplate: string;
  cssTemplate: string;
}

function CvBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const {
    data,
    updateField,
    updateNestedField,
    addItem,
    removeItem,
    handleFieldClick,
    save,
    saving,
  } = useResumeEditor(templateId || undefined);

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  // Load template
  useEffect(() => {
    if (!templateId) {
      router.push("/candidate/resumes/templates");
      return;
    }

    fetch(`/api/v1/resumes/templates/${templateId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setTemplate(d.data?.data ?? d.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [templateId, router]);

  // Render template with data
  useEffect(() => {
    if (!template) return;

    console.log("Rendering template:", template.id, template);

    const renderTemplate = async () => {
      try {
        const res = await fetch("/api/v1/resumes/render-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            templateId: template.id,
            data: {
              name: "Nguyễn Văn A", // Placeholder for preview
              email: "email@example.com",
              phone: "0909123456",
              address: data.address,
              degree: data.degree,
              summary: data.summary,
              skills: data.skills,
              languages: data.languages,
              education: data.education,
              experience: data.experience,
              projects: data.projects,
            },
            mode: editMode ? "edit" : "view",
          }),
        });

        if (res.ok) {
          const result = await res.json();
          setRenderedHtml(result.data?.data?.html ?? result.data?.html ?? "");
        }
      } catch (error) {
        console.error("Failed to render template:", error);
      }
    };

    renderTemplate();
  }, [template, data, editMode]);

  const handleFieldClickFromTemplate = useCallback(
    (field: string, value: string) => {
      setActiveField(field);
      handleFieldClick(field, value);
    },
    [handleFieldClick]
  );

  const handleSave = async () => {
    const result = await save();
    if (result) {
      router.push("/candidate/resumes");
    }
  };

  const getFieldValue = (field: string): string => {
    if (field.includes(".")) {
      const parts = field.split(".");
      if (parts.length === 3) {
        const [section, index, fieldName] = parts;
        const arr = data[section as keyof typeof data] as any[];
        if (arr && arr[parseInt(index)]) {
          return arr[parseInt(index)][fieldName] || "";
        }
      }
    }
    return (data as any)[field] || "";
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: "Họ và tên",
      email: "Email",
      phone: "Số điện thoại",
      address: "Địa chỉ",
      degree: "Bằng cấp",
      summary: "Tóm tắt",
      skills: "Kỹ năng",
      languages: "Ngôn ngữ",
    };

    if (field.includes(".")) {
      const parts = field.split(".");
      if (parts.length === 3) {
        const [section, , fieldName] = parts;
        const sectionLabels: Record<string, string> = {
          education: "Học vấn",
          experience: "Kinh nghiệm",
          projects: "Dự án",
        };
        const fieldLabels: Record<string, string> = {
          school: "Trường",
          degree: "Bằng cấp",
          field: "Chuyên ngành",
          startYear: "Năm bắt đầu",
          endYear: "Năm kết thúc",
          GPA: "GPA",
          description: "Mô tả",
          company: "Công ty",
          position: "Vị trí",
          name: "Tên",
          link: "Link",
        };
        return `${sectionLabels[section] || section} - ${fieldLabels[fieldName] || fieldName}`;
      }
    }

    return labels[field] || field;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <p>Không tìm thấy template</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="size-4 mr-1" /> Quay lại
            </Button>
            <h1 className="text-lg font-semibold">Chỉnh sửa CV</h1>
            <Badge variant="outline">{template.name}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? (
                <>
                  <Eye className="size-4 mr-1" /> Xem trước
                </>
              ) : (
                <>
                  <EyeOff className="size-4 mr-1" /> Chỉnh sửa
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Spinner className="size-4 mr-1.5" />
              ) : (
                <Save className="size-4 mr-1.5" />
              )}
              {saving ? "Đang lưu..." : "Lưu CV"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Template Preview (Editable) */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <TemplateRenderer
              html={renderedHtml}
              editMode={editMode}
              onFieldClick={handleFieldClickFromTemplate}
              className="min-h-[1100px]"
            />
          </div>
        </div>

        {/* Edit Panel (hiện khi click field) */}
        {editMode && activeField && (
          <div className="w-80 shrink-0">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {getFieldLabel(activeField)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveField(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeField === "summary" ||
                activeField.includes("description") ? (
                  <Textarea
                    value={getFieldValue(activeField)}
                    onChange={(e) => {
                      if (activeField.includes(".")) {
                        const parts = activeField.split(".");
                        if (parts.length === 3) {
                          updateNestedField(
                            parts[0],
                            parseInt(parts[1]),
                            parts[2],
                            e.target.value
                          );
                        }
                      } else {
                        updateField(activeField, e.target.value);
                      }
                    }}
                    rows={6}
                    placeholder={`Nhập ${getFieldLabel(activeField).toLowerCase()}...`}
                  />
                ) : (
                  <Input
                    value={getFieldValue(activeField)}
                    onChange={(e) => {
                      if (activeField.includes(".")) {
                        const parts = activeField.split(".");
                        if (parts.length === 3) {
                          updateNestedField(
                            parts[0],
                            parseInt(parts[1]),
                            parts[2],
                            e.target.value
                          );
                        }
                      } else {
                        updateField(activeField, e.target.value);
                      }
                    }}
                    placeholder={`Nhập ${getFieldLabel(activeField).toLowerCase()}...`}
                  />
                )}
              </CardContent>
            </Card>

            {/* Quick Add Sections */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Thêm mục</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    addItem("experience", {
                      company: "",
                      position: "",
                      startYear: "",
                      endYear: "",
                      description: "",
                    })
                  }
                >
                  <Plus className="size-4 mr-1" /> Thêm kinh nghiệm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    addItem("education", {
                      school: "",
                      degree: "",
                      field: "",
                      startYear: "",
                      endYear: "",
                      GPA: "",
                      description: "",
                    })
                  }
                >
                  <Plus className="size-4 mr-1" /> Thêm học vấn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    addItem("projects", {
                      name: "",
                      position: "",
                      link: "",
                      description: "",
                    })
                  }
                >
                  <Plus className="size-4 mr-1" /> Thêm dự án
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Help text */}
      {editMode && !activeField && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg">
          Click vào bất kỳ trường nào trên CV để chỉnh sửa
        </div>
      )}
    </div>
  );
}


export default function CvBuilderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
      <CvBuilderContent />
    </Suspense>
  );
}
