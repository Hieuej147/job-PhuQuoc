import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { jwt, emailOTP } from "better-auth/plugins";
import { redisStorage } from "@better-auth/redis-storage";
import { Redis } from "ioredis";
import { resendClient } from "../common/email/resend.client";
import { verifyOtpTemplate } from "./templates/verify-otp";
import { resetPasswordOtpTemplate } from "./templates/reset-password-otp";
import { inngest } from "../inngest/client";
import { createPrismaClient } from "../prisma/prisma-client.factory";

const prisma = createPrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3001",
    "http://localhost:3000",
  ],

  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: process.env.NODE_ENV === "production",
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.FRONTEND_URL || "http://localhost:3001"}/api/auth/callback/google`,
    },
  },

  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role:
            ((user as Record<string, unknown>).role as string) || null,
        }),
        expirationTime: "24h",
      },
    }),
    emailOTP({
      disableSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
        if (type === "email-verification") {
          await resendClient.emails.send({
            from,
            to: email,
            subject: "Xác nhận email - Phú Quốc Jobs",
            html: verifyOtpTemplate(otp),
          });
        } else if (type === "forget-password") {
          await resendClient.emails.send({
            from,
            to: email,
            subject: "Đặt lại mật khẩu - Phú Quốc Jobs",
            html: resetPasswordOtpTemplate(otp),
          });
        }
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
    }),
  ],

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
        defaultValue: null,
        input: true,
      },
      phone: {
        type: "string" as const,
        required: false,
      },
      isActive: {
        type: "boolean" as const,
        defaultValue: true,
        input: false,
      },
      isLocked: {
        type: "boolean" as const,
        defaultValue: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const ctxBody = (ctx as Record<string, unknown>).body as
            | Record<string, unknown>
            | undefined;
          const role = ctxBody?.role as string | undefined;
          const password = ctxBody?.password as string | undefined;

          // Email/password registration
          if (password) {
            // Kiểm tra email trùng
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
            if (existingUser) {
              // Email đã tồn tại → reject
              throw new Error("Email already exists");
            }
            const allowedRoles = ["CANDIDATE", "EMPLOYER"];
            if (!role || !allowedRoles.includes(role)) {
              throw new Error("Role is required");
            }
            return { data: { ...user, role } };
          }

          // OAuth: link vào user cũ nếu email trùng
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (existingUser) {
            return { data: existingUser };
          }
          return { data: user };
        },
        after: async (user) => {
          // Send welcome notification via Inngest
          try {
            await inngest.send({
              name: "user.registered",
              data: {
                userId: user.id,
                email: user.email,
                name: user.name,
              },
            });
          } catch (e) {
            // Ignore if inngest not available
          }

          // Chỉ reset role cho user MỚI tạo qua OAuth (không phải linked account)
          if (!user.role) {
            try {
              // Kiểm tra xem có phải user mới tạo qua OAuth không
              // Nếu có credential account → user đã tồn tại trước đó (linked)
              const credentialAccount = await prisma.account.findFirst({
                where: {
                  userId: user.id,
                  providerId: "credential",
                },
              });

              // Không có credential account → OAuth user mới → set role = null
              // Có credential account → user đã tồn tại, giữ nguyên role
              if (!credentialAccount) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { role: null },
                });
              }
            } catch (e) {
              // Ignore if prisma not available
            }
          }
        },
      },
    },
  },

  secondaryStorage: redisStorage({
    client: redis,
    keyPrefix: "better-auth:",
  }),

  advanced: {
    database: {
      generateId: () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createId } = require("@paralleldrive/cuid2");
        return createId();
      },
    },
  },
});
