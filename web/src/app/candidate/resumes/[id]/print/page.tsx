import { redirect } from "next/navigation";

interface PrintResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintResumePage({ params }: PrintResumePageProps) {
  const { id } = await params;
  redirect(`/candidate/resumes/${id}`);
}
