### 1. Sự khác biệt về Bảng và Trường dữ liệu (DB cũ bạn gửi vs DB mới trong máy)

Tin vui là **không có bất kỳ bảng (table) hay trường dữ liệu (column) nào bị mất đi hoặc khác biệt về tên gọi**. Cả 2 phiên bản có số lượng bảng và các trường bên trong y hệt nhau. 

Chỉ có sự khác biệt về **cách Prisma định nghĩa mối quan hệ** và kiểu dữ liệu đặc biệt:

*   **Bảng `user` (Trường `companies`):**
    *   **DB cũ:** `companies Company[]` (Định nghĩa mảng: 1 user có nhiều công ty).
    *   **DB mới:** `companies Company?` (Định nghĩa Object: 1 user có 1 công ty).
*   **Bảng `JobEmbedding` (Trường `embedding`):**
    *   **DB cũ:** `Unsupported("vector(768)")`
    *   **DB mới:** `Unsupported("vector")` (Cú pháp được Prisma làm gọn).
*   **Các cấu hình khoá ngoại (`onDelete`):**
    *   **DB cũ:** Khai báo rõ chữ `onDelete: SetNull` hoặc `onDelete: Restrict` ở nhiều bảng.
    *   **DB mới:** Prisma đã tự động ẩn các chữ này đi vì trong SQL đó là hành vi mặc định, giúp code gọn hơn.

---

### 2. Dùng DB MỚI (hiện tại trong dự án) thì các file/chức năng khác có bị ảnh hưởng (lỗi) không?

**Trả lời: KHÔNG HỀ BỊ LỖI. Ngược lại, hệ thống bắt buộc phải dùng DB MỚI này thì mới chạy được.**

**Lý do:**
Toàn bộ source code hiện tại của bạn (từ Backend API, Service cho đến giao diện Frontend) **đều đã được viết để đồng bộ 100% với file DB mới này**. 

*   **Ở Backend:** Các file như `companies.service.ts`, `jobs.service.ts` đang gọi lệnh `findUnique({ where: { ownerId } })`. Lệnh này chỉ chạy thành công khi DB là DB MỚI (quy định 1-1).
*   **Ở Frontend:** Giao diện quản lý của nhà tuyển dụng (`/employer/company`) đang được thiết kế để nạp và hiển thị **một công ty duy nhất** thuộc về họ. Nó mong đợi dữ liệu trả về từ DB mới là 1 Object thay vì 1 Array (mảng).

👉 **Kết luận:** File DB mới (`schema.prisma` hiện đang nằm trong code của bạn) chính là trái tim đang giữ cho mọi file khác hoạt động trơn tru. Bạn hoàn toàn không cần lo lắng về việc nó làm hỏng các chức năng khác!





Dưới đây là danh sách chi tiết **từng dòng code đã được thay đổi** (từ bản DB cũ của bạn sang bản DB mới đang chạy trong máy), lược bỏ đi những thay đổi chỉ mang tính chất sắp xếp thứ tự:

### 1. Bảng `user`
Đổi từ quan hệ 1-Nhiều sang 1-1 đối với công ty.
```diff
model user {
  // ...
- companies      Company[]
+ companies      Company?
}
```

### 2. Bảng `Company`
User chủ sở hữu trở thành trường bắt buộc (không được phép null). Lược bỏ chữ `onDelete: SetNull` vì đây là mặc định của Prisma.
```diff
model Company {
  // ...
- owner          user?        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
+ owner          user         @relation(fields: [ownerId], references: [id], onDelete: Cascade)

- ward           AddressWard? @relation(fields: [wardId], references: [id], onDelete: SetNull)
+ ward           AddressWard? @relation(fields: [wardId], references: [id])
}
```

### 3. Bảng `Job`
Lược bỏ `onDelete: Restrict` và `onDelete: SetNull` (do Prisma tự động áp dụng các hành vi mặc định này cho PostgreSQL để code gọn hơn).
```diff
model Job {
  // ...
- category       JobCategory  @relation(fields: [categoryId], references: [id], onDelete: Restrict)
+ category       JobCategory  @relation(fields: [categoryId], references: [id])

- ward           AddressWard? @relation(fields: [wardId], references: [id], onDelete: SetNull)
+ ward           AddressWard? @relation(fields: [wardId], references: [id])
}
```

### 4. Bảng `JobEmbedding`
Bỏ giới hạn số chiều `(768)` của kiểu vector.
```diff
model JobEmbedding {
  // ...
- embedding      Unsupported("vector(768)")
+ embedding      Unsupported("vector")
}
```

### 5. Bảng `JobApplication`
Tương tự, lược bỏ chữ `onDelete: SetNull`.
```diff
model JobApplication {
  // ...
- resume         CandidateResume? @relation(fields: [resumeId], references: [id], onDelete: SetNull)
+ resume         CandidateResume? @relation(fields: [resumeId], references: [id])
}
```

### 6. Bảng `BlogPost`
Lược bỏ chữ `onDelete: SetNull`.
```diff
model BlogPost {
  // ...
- category       BlogCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
+ category       BlogCategory? @relation(fields: [categoryId], references: [id])
}
```

### 7. Bảng `Payment`
Lược bỏ chữ `onDelete: Restrict`.
```diff
model Payment {
  // ...
- package        PricingPackage @relation(fields: [packageId], references: [id], onDelete: Restrict)
+ package        PricingPackage @relation(fields: [packageId], references: [id])
}
```

***

**Tóm tắt lý do của các thay đổi:**
1. Sửa lỗi logic trầm trọng (Mục 1 & 2): Giúp Backend và Database hiểu đúng rằng đây là hệ thống "1 chủ sở hữu - 1 công ty".
2. Làm gọn code (Mục 3, 5, 6, 7): Các cài đặt `onDelete` thừa được xoá đi vì thư viện Prisma đã tự động xử lý ngầm những phần đó.
3. Tương thích (Mục 4): Sửa lại cú pháp vector để phù hợp hơn với phiên bản extension của PostgreSQL hiện tại.








generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  extensions = [vector]
}

model user {
  id             String            @id @default(cuid())
  name           String
  email          String            @unique
  emailVerified  Boolean           @default(false)
  image          String?
  role           Role?
  phone          String?
  isActive       Boolean           @default(true)
  isLocked       Boolean           @default(false)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  imagePublicId  String?
  accounts       account[]
  blogs          BlogPost[]
  resumes        CandidateResume[]
  companies      Company?
  applications   JobApplication[]
  notifications  Notification[]
  payments       Payment[]
  templates      ResumeTemplate[]
  savedCompanies SavedCompany[]
  savedJobs      SavedJob[]
  sessions       session[]
}

model account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  user      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@index([userId])
}

model session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
}

model jwks {
  id         String    @id @default(cuid())
  publicKey  String
  privateKey String
  createdAt  DateTime  @default(now())
  expiresAt  DateTime?
}

model AddressProvince {
  id        String            @id @default(cuid())
  name      String
  slug      String            @unique
  districts AddressDistrict[]

  @@map("address_province")
}

model AddressDistrict {
  id         String          @id @default(cuid())
  name       String
  slug       String
  provinceId String
  province   AddressProvince @relation(fields: [provinceId], references: [id], onDelete: Cascade)
  wards      AddressWard[]

  @@index([provinceId])
  @@map("address_district")
}

model AddressWard {
  id         String          @id @default(cuid())
  name       String
  slug       String
  districtId String
  district   AddressDistrict @relation(fields: [districtId], references: [id], onDelete: Cascade)
  companies  Company[]
  jobs       Job[]

  @@index([districtId])
  @@map("address_ward")
}

model JobCategory {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  icon      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  jobs      Job[]

  @@map("job_category")
}

model Company {
  id             String         @id @default(cuid())
  name           String
  slug           String         @unique
  logo           String?
  website        String?
  description    String?
  wardId         String?
  addressDetail  String?
  size           CompanySize?
  industry       String?
  ownerId        String         @unique
  isApproved     Boolean        @default(false)
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  logoPublicId   String?
  owner          user           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ward           AddressWard?   @relation(fields: [wardId], references: [id])
  jobs           Job[]
  savedCompanies SavedCompany[]

  @@index([ownerId])
  @@index([wardId])
  @@map("company")
}

model Job {
  id            String           @id @default(cuid())
  title         String
  slug          String           @unique
  description   String
  benefits      String?
  requirements  String?
  quantity      Int              @default(1)
  salaryMin     Int?
  salaryMax     Int?
  wardId        String?
  addressDetail String?
  type          JobType          @default(FULL_TIME)
  experience    ExperienceLevel?
  level         JobLevel?
  status        JobStatus        @default(DRAFT)
  deadline      DateTime?
  categoryId    String
  companyId     String
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  category      JobCategory      @relation(fields: [categoryId], references: [id])
  company       Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  ward          AddressWard?     @relation(fields: [wardId], references: [id])
  applications  JobApplication[]
  embedding     JobEmbedding?
  payments      Payment[]
  savedJobs     SavedJob[]

  @@index([categoryId])
  @@index([companyId])
  @@index([status])
  @@index([wardId])
  @@map("job")
}

model JobEmbedding {
  id        String                @id @default(cuid())
  jobId     String                @unique
  embedding Unsupported("vector")
  job       Job                   @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@map("job_embedding")
}

model JobApplication {
  id           String            @id @default(cuid())
  userId       String
  jobId        String
  cvUrl        String?
  resumeId     String?
  coverLetter  String?
  status       ApplicationStatus @default(PENDING)
  isBookmarked Boolean           @default(false)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  job          Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  resume       CandidateResume?  @relation(fields: [resumeId], references: [id])
  user         user              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@index([userId])
  @@index([jobId])
  @@map("job_application")
}

model CandidateResume {
  id             String           @id @default(cuid())
  userId         String
  title          String           @default("Hồ sơ của tôi")
  address        String?
  summary        String?
  socialLinks    Json?
  education      Json?
  experience     Json?
  projects       Json?
  skills         String?
  degree         String?
  languages      String?
  isDefault      Boolean          @default(false)
  templateId     String
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  avatar         String?
  avatarPublicId String?
  email          String?
  isProfile      Boolean          @default(false)
  name           String?
  phone          String?
  template       ResumeTemplate   @relation(fields: [templateId], references: [id], onDelete: Cascade)
  user           user             @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications   JobApplication[]

  @@index([userId])
  @@map("candidate_resume")
}

model ResumeTemplate {
  id          String            @id @default(cuid())
  name        String
  description String?
  previewUrl  String?
  isPublic    Boolean           @default(false)
  userId      String?
  isActive    Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  resumes     CandidateResume[]
  user        user?             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([isPublic, isActive])
  @@index([userId])
  @@map("resume_template")
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  content   String
  refId     String?
  refType   String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  dedupeKey String?
  expiresAt DateTime?
  readAt    DateTime?
  user      user             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, dedupeKey])
  @@index([userId, createdAt])
  @@index([userId, isRead, createdAt])
  @@index([expiresAt])
  @@index([refType, refId])
  @@map("notification")
}

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  createdAt DateTime @default(now())
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@map("saved_job")
}

model SavedCompany {
  id        String   @id @default(cuid())
  userId    String
  companyId String
  createdAt DateTime @default(now())
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
  @@map("saved_company")
}

model BlogPost {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  type           BlogType      @default(NORMAL)
  content        String?
  landingContent Json?
  thumbnail      String?
  excerpt        String?
  categoryId     String?
  authorId       String
  views          Int           @default(0)
  isPublished    Boolean       @default(false)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  author         user          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category       BlogCategory? @relation(fields: [categoryId], references: [id])

  @@index([authorId])
  @@index([categoryId])
  @@map("blog_post")
}

model BlogCategory {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  createdAt DateTime   @default(now())
  blogs     BlogPost[]

  @@map("blog_category")
}

model PricingPackage {
  id        String    @id @default(cuid())
  name      String
  days      Int
  price     Int
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  payments  Payment[]

  @@map("pricing_package")
}

model Payment {
  id          String         @id @default(cuid())
  userId      String
  jobId       String
  packageId   String
  amount      Int
  status      PaymentStatus  @default(PENDING)
  gateway     String         @default("mock")
  gatewayRef  String?
  createdAt   DateTime       @default(now())
  completedAt DateTime?
  job         Job            @relation(fields: [jobId], references: [id], onDelete: Cascade)
  package     PricingPackage @relation(fields: [packageId], references: [id])
  user        user           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([jobId])
  @@index([gatewayRef])
  @@map("payment")
}

model AuditLog {
  id         String   @id @default(cuid())
  action     String
  entityType String?
  entityId   String?
  actorId    String?
  oldValue   String?
  newValue   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([action])
  @@index([entityType, entityId])
  @@index([actorId])
  @@map("audit_log")
}

enum Role {
  CANDIDATE
  EMPLOYER
  ADMIN
}

enum CompanySize {
  SIZE_1_50
  SIZE_51_200
  SIZE_201_500
  SIZE_500_PLUS
}

enum JobType {
  FULL_TIME
  PART_TIME
  REMOTE
  CONTRACT
  INTERNSHIP
  FREELANCE
}

enum ExperienceLevel {
  NO_EXPERIENCE
  UNDER_1_YEAR
  ONE_TO_THREE_YEARS
  THREE_TO_FIVE_YEARS
  OVER_FIVE_YEARS
}

enum JobLevel {
  INTERN
  FRESHER
  JUNIOR
  MID
  SENIOR
  LEAD
  MANAGER
  DIRECTOR
}

enum JobStatus {
  DRAFT
  PENDING
  ACTIVE
  CLOSED
}

enum ApplicationStatus {
  PENDING
  REVIEWING
  ACCEPTED
  REJECTED
}

enum NotificationType {
  APPLICATION_RECEIVED
  APPLICATION_ACCEPTED
  APPLICATION_REJECTED
  JOB_APPROVED
  COMPANY_APPROVED
  JOB_DEADLINE
  SYSTEM
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum BlogType {
  NORMAL
  LANDING_PAGE
}









