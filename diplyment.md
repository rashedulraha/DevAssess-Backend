# 🚀 Node.js & TypeScript Vercel Deployment Guide (with Bun & TSUP)

এই গাইডটিতে **DevAssess Backend** (বা যেকোনো TypeScript, Express, Prisma ও Bun প্রজেক্ট) সহজে **TSUP** দিয়ে বান্ডেল করে **Vercel**-এ সার্ভারলেস (Serverless) ডিপ্লয় করার প্রতিটি ধাপ বিস্তারিত ও সহজ ভাষায় তুলে ধরা হলো।

---

## 📑 সূচিপত্র (Table of Contents)

1. [ধাপ ১: প্রজেক্ট ক্লোন ও ডিপেন্ডেন্সি ইনস্টল (Initialization)](#-ধাপ-১-প্রজেক্ট-ক্লোন-ও-ডিপেন্ডেন্সি-ইনস্টল)
2. [ধাপ ২: ডাটাবেজ সেটআপ ও প্রিজমা ক্লায়েন্ট (Prisma Setup)](#-ধাপ-২-ডাটাবেজ-সেটআপ-ও-প্রিজমা-ক্লায়েন্ট)
3. [ধাপ ৩: TSUP বিল্ড কনফিগারেশন (TSUP Build Configuration)](#-ধাপ-৩-tsup-বিল্ড-কনফিগারেশন)
4. [ধাপ ৪: Package Scripts আপডেট (package.json Setup)](#-ধাপ-৪-package-scripts-আপডেট)
5. [ধাপ ৫: Vercel ডিপ্লয়মেন্ট কনফিগারেশন (Vercel Deployment)](#-ধাপ-৫-vercel-ডিপ্লয়মেন্ট-কনফিগারেশন)
6. [ধাপ ৬: সার্ভারলেস লিমিটেশন ও জরুরি সতর্কতা (Serverless Limitations)](#-ধাপ-৬-সার্ভারলেস-লিমিটেশন-ও-জরুরি-সতর্কতা)

---

## 🔹 ধাপ ১: প্রজেক্ট ক্লোন ও ডিপেন্ডেন্সি ইনস্টল

### ১.১ রিপোজিটরি ক্লোন করুন
প্রথমে গিটহাব থেকে প্রজেক্টটি আপনার লোকাল মেশিনে নামিয়ে ফোল্ডারে প্রবেশ করুন:

```bash
git clone https://github.com/rashedulraha/DevAssess-Backend.git
cd DevAssess-Backend
```

### ১.২ ডিপেন্ডেন্সি ইনস্টল করুন
**Bun** প্যাকেজ ম্যানেজার ব্যবহার করে সমস্ত প্রয়োজনীয় লাইব্রেরি ইনস্টল করুন:

```bash
bun install
```

> [!TIP]
> আপনি যদি `npm` ব্যবহার করতে চান, তবে `npm install` চালাতে পারেন। তবে `bun` অনেক দ্রুত প্যাকেজ ইনস্টল করে।

### ১.৩ এনভায়রনমেন্ট ভেরিয়েবল (.env) তৈরি করুন
প্রজেক্টের রুট ডিরেক্টরিতে একটি `.env` ফাইল তৈরি করুন (বা `.env.example` থেকে কপি করুন):

```bash
cp .env.example .env
```

`.env` ফাইলে নিচের তথ্যগুলো সঠিকভাবে প্রদান করুন:

```env
# সার্ভার পোর্ট ও মোড
PORT=5000
NODE_ENV=production

# ডাটাবেজ ও ক্যাশ সংযোগ (Neon PostgreSQL & Redis Cloud)
DATABASE_URL="postgresql://username:password@ep-sample.neon.tech/devassess?sslmode=require"
REDIS_URL="redis://default:password@your-redis-host.com:6379"

# সিকিউরিটি ও JWT
JWT_ACCESS_SECRET="your-super-secret-access-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="30d"
BCRYPT_SALT_ROUNDS=12

# পেমেন্ট গেটওয়ে (ঐচ্ছিক / লাইভ টেস্ট)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SSL_STORE_ID="your-ssl-store-id"
SSL_STORE_PASS="your-ssl-store-password"
SSL_IS_LIVE=false

# ক্লাউডিনারি ফাইল আপলোড (ঐচ্ছিক)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ফ্রন্টএন্ড ও ব্যাকএন্ড পাবলিক ইউআরএল
FRONTEND_PUBLIC_URL="https://devassess.vercel.app"
BACKEND_PUBLIC_URL="https://devassess-backend.vercel.app"
```

---

## 🔹 ধাপ ২: ডাটাবেজ সেটআপ ও প্রিজমা ক্লায়েন্ট

Prisma ও PostgreSQL ডাটাবেজের সাথে সংযোগ নিশ্চিত করে স্কিমা পুশ এবং ক্লায়েন্ট তৈরি করুন।

### ২.১ প্রিজমা ক্লায়েন্ট জেনারেট করুন
এটি TypeScript টাইপ ও মেথডগুলো তৈরি করে:

```bash
bunx prisma generate
```

### ২.২ ডাটাবেজ স্কিমা সিনক্রোনাইজ করুন
লোকালে কাজ করলে মাইগ্রেশন চালাতে পারেন, আর ক্লাউড ডাটাবেজে (যেমন Neon) দ্রুত আপডেট করতে `db push` চালাতে পারেন:

```bash
# মাইগ্রেশন চালাতে:
bunx prisma migrate dev --name init

# অথবা সরাসরি স্কিমা পুশ করতে:
bunx prisma db push
```

### ২.৩ ডেমো ডাটা সিড করুন (Seed Database)
এডমিন, রিক্রুটার ও ক্যান্ডিডেট একাউন্ট এবং স্যাম্পল প্রশ্ন তৈরি করতে সিড স্ক্রিপ্ট চালান:

```bash
bun run db:seed
```

---

## 🔹 ধাপ ৩: TSUP বিল্ড কনফিগারেশন

> [!NOTE]
> **কেন TSUP ব্যবহার করবেন?**
> `tsup` হলো `esbuild`-এর ওপর নির্মিত একটি অত্যন্ত দ্রুতগতির জিরো-কনফিগ বান্ডলার। এটি সব কোডকে একটিমাত্র অপ্টিমাইজড `dist/server.js` ফাইলে বান্ডেল করে, যা Vercel সার্ভারলেস ফাংশনে সহজে রান হয় এবং মডিউল এরর দূর করে।

### ৩.১ TSUP ইনস্টল করুন (যদি আগে না করা থাকে)
```bash
bun add -D tsup
```

### ৩.২ `tsup.config.ts` ফাইল তৈরি করুন
প্রজেক্টের রুট ডিরেক্টরিতে `tsup.config.ts` নামে একটি ফাইল তৈরি করে নিচের কোডটি লিখুন:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  noExternal: [
    // Prisma বাদে অন্যান্য প্যাকেজ একসাথে বান্ডেল হবে
    /^((?!@prisma\/client).)*$/,
  ],
  banner: {
    js: `
      // CommonJS shim for Node.js modules compatibility
      var require = require || ((m) => { throw new Error('Cannot require ' + m); });
    `,
  },
});
```

---

## 🔹 ধাপ ৪: Package Scripts আপডেট

আপনার `package.json` ফাইলের `"scripts"` সেকশনে বিল্ড কমান্ড হিসেবে `prisma generate && tsup` নিশ্চিত করুন:

```json
{
  "name": "devassess-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "prisma generate && tsup",
    "start": "node dist/server.js",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

> [!IMPORTANT]
> `"build": "prisma generate && tsup"` এবং `"postinstall": "prisma generate"` রাখা বাধ্যতামূলক। Vercel ডিপ্লয় হওয়ার সময় এটি স্বয়ংক্রিয়ভাবে Prisma Client তৈরি করবে।

---

## 🔹 ধাপ ৫: Vercel ডিপ্লয়মেন্ট কনফিগারেশন

Vercel একটি সার্ভারলেস প্ল্যাটফর্ম। আপনার এক্সপ্রেস অ্যাপকে Vercel-এর সাথে কানেক্ট করার জন্য রুটে `vercel.json` কনফিগার করতে হবে।

### ৫.১ `vercel.json` তৈরি/যাচাই করুন
প্রজেক্টের রুট ফোল্ডারে `vercel.json` ফাইলে নিচের কনফিগারেশনটি দিন:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

---

### ৫.২ ডিপ্লয় করার উপায় (Deployment Methods)

আপনি ২ টি সহজ উপায়ে ডিপ্লয় করতে পারেন:

#### 🌟 উপায় ১: Vercel Dashboard (সবচেয়ে সহজ ও রিকমেন্ডেড)

1. [vercel.com](https://vercel.com)-এ লগইন করুন।
2. **"Add New Project"** এ ক্লিক করে আপনার GitHub রিপোজিটরি (`rashedulraha/DevAssess-Backend`) সিলেক্ট করুন।
3. **Framework Preset**: সিলেক্ট করুন `Other`।
4. **Build Command**: ডিফল্ট থাকবে `npm run build` বা `bun run build`।
5. **Output Directory**: ডিফল্ট খালি রাখুন।
6. **Environment Variables**: নিচে থাকা সব ভ্যারিয়েবল যোগ করুন:
   - `DATABASE_URL` (আপনার Neon DB ইউআরএল)
   - `REDIS_URL` (আপনার Redis Cloud ইউআরএল)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRES_IN` (`1d`)
   - `JWT_REFRESH_EXPIRES_IN` (`30d`)
   - `BCRYPT_SALT_ROUNDS` (`12`)
   - `NODE_ENV` (`production`)
7. **"Deploy"** বাটনে ক্লিক করুন! কয়েক মিনিটের মধ্যে আপনার প্রজেক্ট লাইভ হয়ে যাবে।

---

#### 💻 উপায় ২: Vercel CLI দিয়ে টার্মিনাল থেকে ডিপ্লয়

যদি টার্মিনাল থেকেই সরাসরি ডিপ্লয় করতে চান:

```bash
# ১. গ্লোবালি Vercel CLI ইনস্টল করুন
npm i -g vercel

# ২. আপনার একাউন্টে লগইন করুন
vercel login

# ৩. প্রজেক্ট লিঙ্ক ও প্রিভিউ ডিপ্লয়
vercel

# ৪. প্রোডাকশন লাইভ ডিপ্লয়
vercel --prod
```

---

### ৫.৩ Vercel-এ এনভায়রনমেন্ট ভেরিয়েবল সেটআপ (Manual ENV Setup)

টার্মিনাল থেকে সরাসরি সিক্রেট এনভায়রনমেন্ট ভেরিয়েবল যোগ করার নিয়ম:

```bash
# উদাহরণ: DATABASE_URL যোগ করতে
vercel env add DATABASE_URL production

# উদাহরণ: REDIS_URL যোগ করতে
vercel env add REDIS_URL production

# উদাহরণ: JWT_ACCESS_SECRET যোগ করতে
vercel env add JWT_ACCESS_SECRET production
```
*(অথবা Vercel ড্যাশবোর্ডের Settings -> Environment Variables ট্যাব থেকে এক ক্লিকেই সবগুলো পেস্ট করে সেভ করতে পারেন)*।

---

## 🔹 ধাপ ৬: সার্ভারলেস লিমিটেশন ও জরুরি সতর্কতা

Vercel-এর মতো ফ্রি সার্ভারলেস ক্লাউডে প্রতিটি রিকোয়েস্টে ফাংশন স্বল্প সময়ের জন্য জেগে ওঠে (spin up) এবং কাজ শেষে ঘুমিয়ে পড়ে (spin down / cold state)। তাই নিচের বিষয়গুলো খেয়াল রাখা জরুরি:

| ফিচার / প্যাটার্ন | কেন সার্ভারলেসে সরাসরি চলে না? | সঠিক অল্টারনেটিভ / সমাধান |
|---|---|---|
| **Cron Jobs (`node-cron`, `setInterval`)** | সার্ভার সবসময় চালু থাকে না, তাই মেমোরির টাইমার বন্ধ হয়ে যায়। | Vercel Cron Jobs, Upstash QStash, অথবা GitHub Actions ব্যবহার করুন। |
| **WebSockets (`socket.io`)** | সার্ভারলেসে অবিচ্ছিন্ন TCP কানেকশন সম্ভব নয়। | Pusher, Ably, অথবা Supabase Realtime / Server-Sent Events (SSE)। |
| **লোকাল ফাইল আপলোড (`fs.writeFileSync`, `./uploads`)** | সার্ভারলেস কন্টেইনারের ডিস্ক রিড-অনলি এবং অস্থায়ী; রিকোয়েস্ট শেষেই মুছে যায়। | ক্লাউড স্টোরেজ ব্যবহার করুন যেমন **Cloudinary**, **AWS S3**, বা **Supabase Storage** (DevAssess-এ Cloudinary ইতিমধ্যে কনফিগার করা আছে)। |
| **ইন-মেমোরি ক্যাশ (মেমোরিতে গ্লোবাল ভ্যারিয়েবল রাখা)** | আলাদা আলাদা ফাংশন ইন্সট্যান্সের মধ্যে র‍্যামের ডাটা শেয়ার হয় না। | এক্সটার্নাল ক্যাশ স্টোর ব্যবহার করুন যেমন **Redis Cloud / Upstash Redis** (DevAssess-এ Redis ইতিমধ্যে যুক্ত আছে)। |

---

## 🎯 লাইভ API টেস্ট ও ভেরিফিকেশন

ডিপ্লয়মেন্ট সফল হওয়ার পর আপনার প্রাপ্ত ডোমেইন দিয়ে নিচের রিকোয়েস্টগুলো চেক করুন:

```bash
# হেলথ চেক টেস্ট
curl -X GET https://your-app.vercel.app/api/v1/health

# রেসপন্স দেখতে পাবেন:
# {
#   "success": true,
#   "message": "DevAssess API is healthy and operational",
#   "data": { "status": "UP" }
# }
```

---

🎉 **অভিনন্দন! আপনার DevAssess Backend এখন সফলভাবে Vercel-এ লাইভ ও ব্যবহারের জন্য প্রস্তুত!**
