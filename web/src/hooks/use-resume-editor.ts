"use client";

import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "@/lib/api-client";

interface SocialLink {
  platform: string;
  url: string;
}

interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  GPA?: string;
  description?: string;
}

interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description?: string;
}

interface Project {
  name: string;
  position?: string;
  link?: string;
  description?: string;
}

export interface ResumeData {
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
  templateId: string;
  isDefault: boolean;
}

const defaultData: ResumeData = {
  title: "Hồ sơ của tôi",
  address: "",
  summary: "",
  skills: "",
  degree: "",
  languages: "",
  socialLinks: [],
  education: [],
  experience: [],
  projects: [],
  templateId: "",
  isDefault: false,
};

export function useResumeEditor(templateId?: string) {
  const [data, setData] = useState<ResumeData>({
    ...defaultData,
    templateId: templateId || "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Update single field
  const updateField = useCallback((field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Update nested field (e.g., "experience.0.position")
  const updateNestedField = useCallback(
    (section: string, index: number, field: string, value: string) => {
      setData((prev) => {
        const arr = [...(prev[section as keyof ResumeData] as any[])];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, [section]: arr };
      });
    },
    []
  );

  // Add item to array section
  const addItem = useCallback(
    (section: string, item: any) => {
      setData((prev) => ({
        ...prev,
        [section]: [...(prev[section as keyof ResumeData] as any[]), item],
      }));
    },
    []
  );

  // Remove item from array section
  const removeItem = useCallback((section: string, index: number) => {
    setData((prev) => ({
      ...prev,
      [section]: (prev[section as keyof ResumeData] as any[]).filter(
        (_, i) => i !== index
      ),
    }));
  }, []);

  // Handle field click from template (parse field name)
  const handleFieldClick = useCallback(
    (field: string, value: string) => {
      if (field.includes(".")) {
        // Nested field: experience.0.position
        const parts = field.split(".");
        if (parts.length === 3) {
          const [section, index, fieldName] = parts;
          updateNestedField(section, parseInt(index), fieldName, value);
        }
      } else {
        // Simple field
        updateField(field, value);
      }
    },
    [updateField, updateNestedField]
  );

  // Save to API
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const url = resumeId
        ? `/api/v1/resumes/${resumeId}`
        : "/api/v1/resumes";
      const method = resumeId ? "PATCH" : "POST";

      const body = {
        title: data.title,
        address: data.address,
        summary: data.summary,
        skills: data.skills,
        degree: data.degree,
        languages: data.languages,
        templateId: data.templateId,
        isDefault: data.isDefault,
        socialLinks: data.socialLinks,
        education: data.education,
        experience: data.experience,
        projects: data.projects,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.data?.id) {
          setResumeId(result.data.id);
        }
        return result.data;
      }
      throw new Error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [data, resumeId]);

  // Load resume from API
  const loadResume = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/resumes/${id}`), {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const resume = result.data;
        setData({
          title: resume.title || "",
          address: resume.address || "",
          summary: resume.summary || "",
          skills: resume.skills || "",
          degree: resume.degree || "",
          languages: resume.languages || "",
          socialLinks: resume.socialLinks || [],
          education: resume.education || [],
          experience: resume.experience || [],
          projects: resume.projects || [],
          templateId: resume.templateId || "",
          isDefault: resume.isDefault || false,
        });
        setResumeId(resume.id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    setData,
    updateField,
    updateNestedField,
    addItem,
    removeItem,
    handleFieldClick,
    save,
    loadResume,
    saving,
    loading,
    resumeId,
  };
}
