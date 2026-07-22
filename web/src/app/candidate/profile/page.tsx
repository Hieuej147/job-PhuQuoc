"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Share2,
  Save,
  Camera,
  Pencil,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import BasicInfo from "@/components/candidate/profile/BasicInfo";
import Avatar from "@/components/candidate/profile/Avatar";
import ExperienceComponent from "@/components/candidate/profile/Experience";
import EducationComponent from "@/components/candidate/profile/Education";
import SocialsComponent from "@/components/candidate/profile/Socials";
import Summary from "@/components/candidate/profile/Summary";
import Checklist from "@/components/candidate/profile/CheckList";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { useCandidateProfileForm } from "@/features/candidate-profile/use-candidate-profile-form";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const profile = useCandidateProfileForm({ user, refresh });

  const checklist = [
    { ...profile.profileCompletion.items.find((item) => item.id === "basic")!, icon: <User className="size-4" /> },
    { ...profile.profileCompletion.items.find((item) => item.id === "avatar")!, icon: <Camera className="size-4" /> },
    { ...profile.profileCompletion.items.find((item) => item.id === "experience")!, icon: <Briefcase className="size-4" /> },
    { ...profile.profileCompletion.items.find((item) => item.id === "education")!, icon: <GraduationCap className="size-4" /> },
    { ...profile.profileCompletion.items.find((item) => item.id === "summary")!, icon: <FileText className="size-4" /> },
    { ...profile.profileCompletion.items.find((item) => item.id === "socials")!, icon: <Share2 className="size-4" /> },
  ];
  const completionPct = profile.profileCompletion.completionPct;

  if (profile.loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <ImageCropDialog
        open={profile.avatarCropOpen}
        title="Căn chỉnh ảnh đại diện"
        description="Kéo ảnh để chọn vùng hiển thị avatar. Ảnh sẽ được crop vuông trước khi upload."
        aspect={1}
        cropShape="round"
        cropState={{
          imageUrl: profile.avatarCropUrl,
          crop: profile.avatarCrop,
          zoom: profile.avatarZoom,
          onCropChange: profile.setAvatarCrop,
          onZoomChange: profile.setAvatarZoom,
          onCropComplete: (_croppedArea, areaPixels) => profile.setAvatarCroppedArea(areaPixels),
        }}
        onCancel={profile.handleAvatarCropCancel}
        onConfirm={profile.handleAvatarCropConfirm}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý và cập nhật thông tin hồ sơ gốc của bạn.</p>
        </div>
        <div className="flex gap-2">
          {!profile.editing ? (
            <Button onClick={() => profile.setEditing(true)} size="sm" variant="outline">
              <Pencil className="size-4 mr-1.5" />
              Sửa hồ sơ
            </Button>
          ) : (
            <>
              <Button onClick={() => profile.setEditing(false)} size="sm" variant="ghost">
                <X className="size-4 mr-1.5" />
                Hủy
              </Button>
              <Button onClick={async () => { const ok = await profile.handleSave(); if (ok) profile.setEditing(false); }} disabled={profile.saving} size="sm">
                <Save className="size-4 mr-1.5" />
                {profile.saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Checklist Completion */}
        <Checklist
          activeSection={profile.activeSection}
          checklist={checklist}
          handleSectionChange={profile.handleSectionChange}
          completionPct={completionPct}
        />

        {/* Right Column - Section Form Editor */}
        <Card className="lg:col-span-2 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
          <CardContent className="p-6">

            {/* Section: Basic Info */}
            <BasicInfo
              activeSection={profile.activeSection}
              editing={profile.editing}
              setEditing={profile.setEditing}
              handleSave={profile.handleSave}
              name={profile.name}
              phone={profile.phone}
              email={profile.email}
              address={profile.address}
              degree={profile.degree}
              languages={profile.languages}
              skills={profile.skills}
              saving={profile.saving}
              setName={profile.setName}
              setPhone={profile.setPhone}
              setAddress={profile.setAddress}
              setDegree={profile.setDegree}
              setLanguages={profile.setLanguages}
              setSkills={profile.setSkills}
            />

            {/* Section: Avatar */}
            <Avatar
              activeSection={profile.activeSection}
              avatar={profile.avatar}
              uploadingAvatar={profile.uploadingAvatar}
              handleAvatarChange={profile.handleAvatarChange}
              editing={profile.editing}
              setEditing={profile.setEditing}
            />

            {/* Section: Experience */}
            <ExperienceComponent
              activeSection={profile.activeSection}
              editing={profile.editing}
              setEditing={profile.setEditing}
              experiences={profile.experiences}
              newExp={profile.newExp}
              setNewExp={profile.setNewExp}
              addExperience={profile.addExperience}
              removeExperience={profile.removeExperience}
              handleSave={profile.handleSave}
              saving={profile.saving}
            />

            {/* Section: Education */}
            <EducationComponent
              activeSection={profile.activeSection}
              editing={profile.editing}
              setEditing={profile.setEditing}
              educations={profile.educations}
              newEdu={profile.newEdu}
              setNewEdu={profile.setNewEdu}
              addEducation={profile.addEducation}
              removeEducation={profile.removeEducation}
              handleSave={profile.handleSave}
              saving={profile.saving}
            />

            {/* Section: Summary */}
            <Summary
              activeSection={profile.activeSection}
              summary={profile.summary}
              setSummary={profile.setSummary}
              editing={profile.editing}
              setEditing={profile.setEditing}
              handleSave={profile.handleSave}
              saving={profile.saving}
            />

            {/* Section: Socials */}
            <SocialsComponent
              activeSection={profile.activeSection}
              editing={profile.editing}
              setEditing={profile.setEditing}
              handleSave={profile.handleSave}
              facebook={profile.facebook}
              linkedin={profile.linkedin}
              github={profile.github}
              website={profile.website}
              saving={profile.saving}
              setFacebook={profile.setFacebook}
              setLinkedin={profile.setLinkedin}
              setGithub={profile.setGithub}
              setWebsite={profile.setWebsite}
            />

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
