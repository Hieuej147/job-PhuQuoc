"use client";

import { useEffect, useState, useRef } from "react";
import type { Area } from "react-easy-crop";
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
import BasicInfo from "@/components/candidate/profile/BasicInfo";
import Avatar from "@/components/candidate/profile/Avatar";
import ExperienceComponent from "@/components/candidate/profile/Experience";
import EducationComponent from "@/components/candidate/profile/Education";
import SocialsComponent from "@/components/candidate/profile/Socials";
import Summary from "@/components/candidate/profile/Summary";
import Checklist from "@/components/candidate/profile/CheckList";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { createCroppedImageFile, isSupportedImage } from "@/components/media/image-crop";
import { getProfileResume, saveProfileResume, uploadCandidateAvatar } from "@/features/candidate-profile/api";
import type { Education, Experience } from "@/features/candidate-profile/types";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Loading & Saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropUrl, setAvatarCropUrl] = useState("");
  const [avatarCropName, setAvatarCropName] = useState("");
  const [avatarCropType, setAvatarCropType] = useState("");
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedArea, setAvatarCroppedArea] = useState<Area | null>(null);
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

  // Handle saving profile changes
  const handleSave = async (overrideData?: Record<string, any>, options?: { silent?: boolean }): Promise<boolean> => {
    const showToast = !options?.silent && !overrideData;
    const isSilent = Boolean(options?.silent);
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
    if (!isSilent && activeSection === "experience" && hasAnyExp && missingExp.length > 0) {
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
    if (!isSilent && activeSection === "education" && hasAnyEdu && missingEdu.length > 0) {
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
      // Auto-save current active section inputs before switching
      await handleSave(undefined, { silent: true });
      setActiveSection(sectionId);
    }
  };

  // Upload Avatar handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File vượt quá giới hạn 5MB");
      e.target.value = "";
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
    e.target.value = "";
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
    socialLinks: { facebook, linkedin, github, website },
  });

  const checklist = [
    { ...profileCompletion.items.find((item) => item.id === "basic")!, icon: <User className="size-4" /> },
    { ...profileCompletion.items.find((item) => item.id === "avatar")!, icon: <Camera className="size-4" /> },
    { ...profileCompletion.items.find((item) => item.id === "experience")!, icon: <Briefcase className="size-4" /> },
    { ...profileCompletion.items.find((item) => item.id === "education")!, icon: <GraduationCap className="size-4" /> },
    { ...profileCompletion.items.find((item) => item.id === "summary")!, icon: <FileText className="size-4" /> },
    { ...profileCompletion.items.find((item) => item.id === "socials")!, icon: <Share2 className="size-4" /> },
  ];
  const completionPct = profileCompletion.completionPct;

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <ImageCropDialog
        open={avatarCropOpen}
        title="Căn chỉnh ảnh đại diện"
        description="Kéo ảnh để chọn vùng hiển thị avatar. Ảnh sẽ được crop vuông trước khi upload."
        aspect={1}
        cropShape="round"
        cropState={{
          imageUrl: avatarCropUrl,
          crop: avatarCrop,
          zoom: avatarZoom,
          onCropChange: setAvatarCrop,
          onZoomChange: setAvatarZoom,
          onCropComplete: (_croppedArea, areaPixels) => setAvatarCroppedArea(areaPixels),
        }}
        onCancel={handleAvatarCropCancel}
        onConfirm={handleAvatarCropConfirm}
      />
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
        <Checklist
          activeSection={activeSection}
          checklist={checklist}
          handleSectionChange={handleSectionChange}
          completionPct={completionPct}
        />

        {/* Right Column - Section Form Editor */}
        <Card className="lg:col-span-2 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
          <CardContent className="p-6">

            {/* Section: Basic Info */}
            <BasicInfo
              activeSection={activeSection}
              editing={editing}
              setEditing={setEditing}
              handleSave={handleSave}
              name={name}
              phone={phone}
              email={email}
              address={address}
              degree={degree}
              languages={languages}
              skills={skills}
              saving={saving}
              setName={setName}
              setPhone={setPhone}
              setAddress={setAddress}
              setDegree={setDegree}
              setLanguages={setLanguages}
              setSkills={setSkills}
            />

            {/* Section: Avatar */}
            <Avatar
              activeSection={activeSection}
              avatar={avatar}
              uploadingAvatar={uploadingAvatar}
              handleAvatarChange={handleAvatarChange}
              editing={editing}
              setEditing={setEditing}
            />

            {/* Section: Experience */}
            <ExperienceComponent
              activeSection={activeSection}
              editing={editing}
              setEditing={setEditing}
              experiences={experiences}
              newExp={newExp}
              setNewExp={setNewExp}
              addExperience={addExperience}
              removeExperience={removeExperience}
              handleSave={handleSave}
              saving={saving}
            />

            {/* Section: Education */}
            <EducationComponent
              activeSection={activeSection}
              editing={editing}
              setEditing={setEditing}
              educations={educations}
              newEdu={newEdu}
              setNewEdu={setNewEdu}
              addEducation={addEducation}
              removeEducation={removeEducation}
              handleSave={handleSave}
              saving={saving}
            />

            {/* Section: Summary */}
            <Summary
              activeSection={activeSection}
              summary={summary}
              setSummary={setSummary}
              editing={editing}
              setEditing={setEditing}
              handleSave={handleSave}
              saving={saving}
            />

            {/* Section: Socials */}
            <SocialsComponent
              activeSection={activeSection}
              editing={editing}
              setEditing={setEditing}
              handleSave={handleSave}
              facebook={facebook}
              linkedin={linkedin}
              github={github}
              website={website}
              saving={saving}
              setFacebook={setFacebook}
              setLinkedin={setLinkedin}
              setGithub={setGithub}
              setWebsite={setWebsite}
            />

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
