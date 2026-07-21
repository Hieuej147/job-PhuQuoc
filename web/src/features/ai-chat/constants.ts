import type { ChatAgentType } from "./api";

export type AiAgentId = "candidate" | "recruiter";

export const AI_AGENT_ID_TO_TYPE: Record<AiAgentId, ChatAgentType> = {
  candidate: "CANDIDATE",
  recruiter: "RECRUITER",
};

export const FULL_PAGE_AI_ROUTE: Record<AiAgentId, string> = {
  candidate: "/candidate/dashboard",
  recruiter: "/employer/dashboard",
};

export const AI_AGENT_META: Record<AiAgentId, { title: string; welcome: string; fullPageHref: string }> = {
  candidate: {
    title: "Career Co-worker",
    welcome:
      "Xin chào! Mình là Career Co-worker — hỏi mình về việc làm, CV hay hồ sơ ứng tuyển bất cứ lúc nào nhé.",
    fullPageHref: "/candidate/dashboard?tab=ai",
  },
  recruiter: {
    title: "Recruiter Co-worker",
    welcome:
      "Xin chào! Mình có thể hỗ trợ bạn xem ứng viên, tạo tin tuyển dụng hoặc soạn email nhanh.",
    fullPageHref: "/employer/dashboard?tab=ai",
  },
};

export const AI_AGENT_SUGGESTIONS: Record<AiAgentId, { title: string; message: string }[]> = {
  candidate: [
    {
      title: "Tìm việc phù hợp",
      message: "Giúp tôi tìm việc làm phù hợp với kỹ năng và kinh nghiệm của tôi.",
    },
    {
      title: "Tạo CV mới",
      message: "Tôi muốn tạo một CV mới, bạn hướng dẫn tôi nhé.",
    },
    {
      title: "Xem CV của tôi",
      message: "Cho tôi xem danh sách CV tôi đã tạo.",
    },
    {
      title: "Tư vấn định hướng nghề nghiệp",
      message: "Dựa vào hồ sơ hiện tại, tôi nên làm gì tiếp theo để cải thiện cơ hội việc làm?",
    },
  ],
  recruiter: [
    {
      title: "Xem ứng viên mới",
      message: "Cho tôi xem danh sách ứng viên vừa ứng tuyển vào các tin đang tuyển.",
    },
    {
      title: "Đăng tin tuyển dụng",
      message: "Tôi muốn đăng một tin tuyển dụng mới, bạn hướng dẫn tôi nhé.",
    },
    {
      title: "Xếp hạng ứng viên",
      message: "Giúp tôi xếp hạng ứng viên cho vị trí đang tuyển theo mức độ phù hợp.",
    },
    {
      title: "Soạn email mời phỏng vấn",
      message: "Soạn giúp tôi một email mời ứng viên phỏng vấn.",
    },
  ],
};
