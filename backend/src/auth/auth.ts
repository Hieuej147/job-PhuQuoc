import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { jwt, emailOTP } from "better-auth/plugins";
import { redisStorage } from "@better-auth/redis-storage";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { resendClient } from "../common/email/email.service";
import { verifyOtpTemplate } from "./templates/verify-otp";
import { resetPasswordOtpTemplate } from "./templates/reset-password-otp";
import { inngest } from "../inngest/client";

const prisma = new PrismaClient();
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
    requireEmailVerification: process.env.NODE_ENV === "production",
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/auth/callback/google",
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
            ((user as Record<string, unknown>).role as string) || "CANDIDATE",
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

          // Only allow CANDIDATE and EMPLOYER during registration
          const allowedRoles = ["CANDIDATE", "EMPLOYER"];
          if (role && allowedRoles.includes(role)) {
            return {
              data: {
                ...user,
                role,
              },
            };
          }
          // Don't set role - will be set by after hook
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

          // Only reset role for OAuth users (no password = social login)
          // Email sign-ups should keep their selected role
          if (!user.role) {
            try {
              const account = await prisma.account.findFirst({
                where: { userId: user.id },
                select: { password: true },
              });
              // OAuth users have no password -> must select role later
              if (!account?.password) {
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
