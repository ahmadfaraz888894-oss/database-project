# Mirath v3 — Islamic Inheritance Calculator

A full-stack web application implementing **Hanafi Faraid** for Pakistani families. Build family trees, track diverse wealth, calculate inheritance, and share results — all in one app.

## 🆕 v3 Major Features

### Your requests
- 🌾 **Per-property distribution in native units** — Land split in kanal/marla/acre, gold in tola, etc. (not just rupees!)
- 💑 **Spouse connections in family tree** — Marriage lines with ♥ symbol horizontally, parent-child branches below
- 🎨 **Colored family lines** — Each couple has a unique color

### The 10 high-value features
1. **📄 Auto Legal Document** — Certificate-style PDF with Bismillah header
2. **💬 WhatsApp Share** — Both English & Urdu, with full distribution + Quranic sources for disputes
3. **🏠 Property Type Splitter** — See exactly which kanal of land, which tola of gold goes to whom
4. **🔮 What-If Simulator** — Test "if I died today" for any living person
5. **⚖ Dispute Resolver** — Each share has its Quranic verse / Hadith / scholar consensus
6. **📊 Generational Tracker** — Statistics dashboard with generation breakdown
7. **🪙 Estate Planning Mode** — Full Wasiyyah simulator with validation
8. **✓ Wasiyyat Validator** — Auto-checks bequest doesn't exceed 1/3 limit
9. **🔒 Family Vault** — Track CNICs, deeds, wills, marriage certs, expiration dates
10. **🕌 Scholar Verification** — Authentic Arabic Qur'an + translation + classical scholar's explanation for every rule

## 🚀 Setup

Since you've already set this up before, you only need:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

(The `npx prisma db push` will add the new VaultDocument table to your existing database.)

If running fresh:
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

## 📐 The Faraid Algorithm

Verified with multiple test cases:
- ✅ Standard Hanafi distribution (5 classical scenarios)
- ✅ Cascading representation doctrine (3-generation test)
- ✅ Per-property distribution in native units

Run tests yourself:
```bash
node test-calculator.mjs       # Classical Faraid rules
node test-cascading.mjs        # Representation doctrine
node test-property-dist.mjs    # Per-property splitting
```

## 🧰 Stack

Next.js 14 · PostgreSQL · Prisma · React Flow · jsPDF · Tailwind · JWT · Fraction.js

## ⚠️ Disclaimer

Educational use. For binding legal matters, consult a qualified Islamic scholar or lawyer. Implements **Hanafi** rules only. Representation doctrine follows **Pakistan Muslim Family Laws Ordinance 1961**.

May Allah make it beneficial. 🤲
