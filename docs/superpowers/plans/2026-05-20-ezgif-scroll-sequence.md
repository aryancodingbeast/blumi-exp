# Ezgif Scroll Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development

**Goal:** Replace hero scroll sequence with 50 ezgif frames. One frame per scroll increment.

**Architecture:** Copy images to public directory, update SequenceHero to point to new image set.

**Tech Stack:** Next.js, GSAP ScrollTrigger, Canvas API

---

### Task 1: Copy Images to Public Directory

**Files:**
- Create: `public/sequence/ezgif-frame-001.jpg` through `ezgif-frame-050.jpg`

- [ ] **Step 1: Create public/sequence directory**

```bash
mkdir -p /Users/aryansingh/Developer/blumi/public/sequence
```

- [ ] **Step 2: Copy all 50 frames**

```bash
cp /Users/aryansingh/Developer/blumi/ezgif-89dfe4c22c8d3991-jpg/ezgif-frame-*.jpg \
   /Users/aryansingh/Developer/blumi/public/sequence/
```

- [ ] **Step 3: Verify copy**

```bash
ls /Users/aryansingh/Developer/blumi/public/sequence/ | wc -l
```

Expected: `50`

- [ ] **Step 4: Commit**

```bash
git add public/sequence/
git commit -m "feat: add ezgif scroll sequence frames (50 images)"
```

---

### Task 2: Update SequenceHero Props

**Files:**
- Modify: `src/components/SequenceHero.tsx:83-88`

- [ ] **Step 1: Update ScrollSequence props**

Replace lines 83-88:
```tsx
            <ScrollSequence
                frameCount={50}
                directory="/sequence"
                prefix="ezgif-frame-"
                extension="jpg"
            >
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SequenceHero.tsx
git commit -m "feat: point hero sequence to ezgif frames"
```

---

### Task 3: Verify in Browser

**Files:**
- Test: `http://localhost:3000`

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open browser, scroll through hero**

Expected: Images change smoothly with scroll, header hidden during sequence
```

---

**Spec coverage check:**
- ✅ 50 frames from ezgif folder
- ✅ Scroll-synced frame progression
- ✅ Editorial overlay with text
- ✅ Header hidden during sequence
- ✅ Canvas rendering with DPR handling (inherited from ScrollSequence)

**Placeholder scan:** None found. All steps have actual code/commands.

**Type consistency:** No type changes needed — reusing existing ScrollSequence component.