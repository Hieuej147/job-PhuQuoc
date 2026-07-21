"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import type { Area, Point } from "react-easy-crop";
import { toast } from "sonner";

import { createCroppedImageFile, isSupportedImage } from "@/components/media/image-crop";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { getProfileResume, saveProfileResume, uploadCandidateAvatar } from "./api";
import type { Education, Experience } from "./types";
import {
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  getMissingEducationFields,
  getMissingExperienceFields,
} from "./form-helpers";

interface CandidateProfileUser {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UseCandidateProfileFormOptions {
  user: CandidateProfileUser | null | undefined;
  refresh: () => Promise<unknown> | unknown;
}

export function useCandidateProfileForm({ user, refresh }: UseCandidateProfileFormOptions) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropUrl, setAvatarCropUrl] = useState("");
  const [avatarCropName, setAvatarCropName] = useState("");
  const [avatarCropType, setAvatarCropType] = useState("");
  const [avatarCrop, setAvatarCrop] = useState<Point>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedArea, setAvatarCroppedArea] = useState<Area | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [address, setAddress] = useState("");
  const [degree, setDegree] = useState("");
  const [languages, setLanguages] = useState("");
  const [skills, setSkills] = useState("");
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [newExp, setNewExp] = useState<Experience>(EMPTY_EXPERIENCE);
  const [newEdu, setNewEdu] = useState<Education>(EMPTY_EDUCATION);

  useEffect(() => {
    return () => {
      if (avatarCropUrl) URL.revokeObjectURL(avatarCropUrl);
    };
  }, [avatarCropUrl]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const p = await getProfileResume();
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

  const buildSocialLinks = () => ({
    facebook,
    linkedin,
    github,
    website,
  });

  const handleSave = async (overrideData?: Record<string, any>, options?: { silent?: boolean }): Promise<boolean> => {
    const showToast = !options?.silent && !overrideData;
    const isSilent = Boolean(options?.silent);
    setSaving(true);

    const missingExp = getMissingExperienceFields(newExp);
    const hasAnyExp = missingExp.length < 5;
    let currentExperiences = [...experiences];
    if (!isSilent && activeSection === "experience" && hasAnyExp && missingExp.length > 0) {
      toast.error(`Còn thiếu: ${missingExp.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (missingExp.length === 0) {
      currentExperiences = [...currentExperiences, newExp];
      setExperiences(currentExperiences);
      setNewExp(EMPTY_EXPERIENCE);
    }

    const missingEdu = getMissingEducationFields(newEdu);
    const hasAnyEdu = missingEdu.length < 5;
    let currentEducations = [...educations];
    if (!isSilent && activeSection === "education" && hasAnyEdu && missingEdu.length > 0) {
      toast.error(`Còn thiếu: ${missingEdu.join(", ")}.`);
      setSaving(false);
      return false;
    }
    if (missingEdu.length === 0) {
      currentEducations = [...currentEducations, newEdu];
      setEducations(currentEducations);
      setNewEdu(EMPTY_EDUCATION);
    }

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
      socialLinks: buildSocialLinks(),
      ...overrideData,
    };

    try {
      await saveProfileResume(saveData);
      await refresh();
      if (showToast) {
        toast.success("Lưu thông tin hồ sơ thành công!");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Lỗi kết nối khi lưu hồ sơ.");
      return false;
    } finally {
      setSaving(false);
    }
    return true;
  };

  const handleSectionChange = async (sectionId: string) => {
    if (activeSection !== sectionId) {
      await handleSave(undefined, { silent: true });
      setActiveSection(sectionId);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File vượt quá giới hạn 5MB");
      event.target.value = "";
      return;
    }

    if (avatarCropUrl) URL.revokeObjectURL(avatarCropUrl);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedArea(null);
    setAvatarCropName(file.name);
    setAvatarCropType(file.type);
    setAvatarCropUrl(URL.createObjectURL(file));
    setAvatarCropOpen(true);
    event.target.value = "";
  };

  const handleAvatarCropCancel = () => {
    setAvatarCropOpen(false);
    if (avatarCropUrl) {
      URL.revokeObjectURL(avatarCropUrl);
      setAvatarCropUrl("");
    }
  };

  const handleAvatarCropConfirm = async () => {
    if (!avatarCropUrl || !avatarCroppedArea) return;

    setUploadingAvatar(true);
    try {
      const croppedFile = await createCroppedImageFile(
        avatarCropUrl,
        avatarCroppedArea,
        avatarCropName || "candidate-avatar.webp",
        avatarCropType || "image/webp",
        { width: 500, height: 500 },
      );
      const avatarUrl = await uploadCandidateAvatar(croppedFile);
      setAvatar(avatarUrl);
      await refresh();
      toast.success("Cập nhật ảnh đại diện thành công!");
      handleAvatarCropCancel();
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Lỗi kết nối khi tải ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addExperience = () => {
    const missing = getMissingExperienceFields(newExp);
    if (missing.length > 0) {
      toast.error(`Còn thiếu: ${missing.join(", ")}.`);
      return;
    }
    setExperiences((current) => [...current, newExp]);
    setNewExp(EMPTY_EXPERIENCE);
  };

  const removeExperience = (index: number) => {
    setExperiences((current) => current.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    const missing = getMissingEducationFields(newEdu);
    if (missing.length > 0) {
      toast.error(`Còn thiếu: ${missing.join(", ")}.`);
      return;
    }
    setEducations((current) => [...current, newEdu]);
    setNewEdu(EMPTY_EDUCATION);
  };

  const removeEducation = (index: number) => {
    setEducations((current) => current.filter((_, i) => i !== index));
  };

  const profileCompletion = computeProfileCompletion({
    name,
    phone,
    email,
    address,
    degree,
    languages,
    skills,
    avatar,
    experience: experiences,
    education: educations,
    summary,
    socialLinks: buildSocialLinks(),
  });

  return {
    loading,
    saving,
    uploadingAvatar,
    avatarCropOpen,
    avatarCropUrl,
    avatarCrop,
    avatarZoom,
    setAvatarCrop,
    setAvatarZoom,
    setAvatarCroppedArea,
    editing,
    setEditing,
    activeSection,
    name,
    phone,
    email,
    avatar,
    address,
    degree,
    languages,
    skills,
    summary,
    experiences,
    educations,
    facebook,
    linkedin,
    github,
    website,
    newExp,
    newEdu,
    setName,
    setPhone,
    setAddress,
    setDegree,
    setLanguages,
    setSkills,
    setSummary,
    setFacebook,
    setLinkedin,
    setGithub,
    setWebsite,
    setNewExp,
    setNewEdu,
    handleSave,
    handleSectionChange,
    handleAvatarChange,
    handleAvatarCropCancel,
    handleAvatarCropConfirm,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    profileCompletion,
  };
}
