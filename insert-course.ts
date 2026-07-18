import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import jsonConfig from "./firebase-applet-config.json" assert { type: "json" };

admin.initializeApp({
  projectId: jsonConfig.projectId,
});

const db = getFirestore(jsonConfig.firestoreDatabaseId);

const longDescription = `
# Dynamic EDITS: The Ultimate Guide to Video Editing by Deepak Daiya (Deepak Sir)

Kya aap ek Content Creator, YouTuber, Reel Creator, ya aspiring Video Editor hain jo apne videos ko ek premium aur professional look dena chahte hain? Kya aap thak chuke hain wahi purane, boring videos edit kar-kar ke jisme na koi retention hota hai aur na koi views aate hain?

**Agli generation ka video editing course ab aapke samne hai!** 

"Dynamic EDITS" ek aisa complete practical masterclass hai jise **Deepak Daiya (Deepak Sir)** ne design kiya hai taaki aap sirf apne Smartphone ya basic Laptop ka use karke industry-standard cinematic videos edit karna seekh sakein. Is course me unhone apne 4 saal ka secret editing framework share kiya hai jo kisi bhi normal video ko highly engaging masterpiece me badal deta hai.

---

## Video Editing Kyun Hai Aaj Ka #1 Skill?

Aaj ke digital era me attention span bohot kam ho chuka hai. Instagram Reels, YouTube Shorts, aur high-retention video essays hi grow kar rahe hain. 

*   **Audience Retention is King:** Agar aapka video pehle 3 second me viewers ko hook nahi kar pata, to video flop ho jata hai.
*   **High Demand for Editors:** Brand owners, YouTubers, aur local businesses ko professional video editors ki behad zaroorat hai. Wo log ek achhe video edit ke liye **₹5,000 se ₹50,000 tak pay karne ko tayar hain**.
*   **No Heavy PC Required:** Is course ka sabse bada benefit ye hai ki aap ye sabhi premium techniques apne **Mobile Phone (CapCut / Alight Motion)** par apply kar sakte hain. Aapko kisi ₹1,50,000 wale laptop ki zaroorat nahi hai!

---

## Course me kya-kya shamil hai? (The Core Modules)

Ye course ek step-by-step ladder ki tarah hai jo bilkul beginner level se shuru hokar absolute professional level tak jata hai. Aaiye iske key segments ko dekhte hain:

### 1. Fundamentals of Storyboarding & Scripting
Ek achha video sirf editing software se nahi banta; uske peeche ek strong video concept aur planning hoti hai. Aap seekhenge ki kaise footage ko sequence me arrange kiya jata hai aur timeline par story kaise build ki jati hai.

### 2. CapCut Masterclass (Basic to Pro)
CapCut aaj ke samay me mobile ka sabse powerful aur feature-rich editor hai. 
*   **Keyframing:** Smooth zoom-in, zoom-out, aur panning effects create karna.
*   **Custom Transitions:** Glitch, whip, light leak aur dynamic overlays apply karna.
*   **Auto Captions & Subtitles:** Trendy, colorful, aur engaging text captions auto-generate karna aur unhe animate karna.
*   **Masking & Blend Modes:** High-end creative visual compositions banana.

### 3. Alight Motion Advanced Motion Graphics
Agar aapko apne videos me high-level animations aur text movements chahiye, to Alight Motion aapka ultimate tool hai.
*   **Text Animation:** Kinetic typography aur professional modern titles create karna.
*   **Vector Design:** App ke andar hi assets banana aur unhe animate karna.
*   **Glow Effects & Curves:** Perfect ease-in/ease-out graphs banana taaki animations organic lagein.

### 4. Documentary Style Video Editing
YouTube par Magnates Media, Johnny Harris, aur Vox style ke videos aajkal kaafi viral ho rahe hain. Is course me aap seekhenge:
*   **Paper Texture & Map Animation:** Historical aur informational story representation kaise karein.
*   **Cinematic B-Roll Management:** Free premium footages download karna aur perfect timing par mix karna.
*   **Overlay & Lighting Effects:** Dusty, scratchy film overlay se classic visual appearance dena.

### 5. Sound Design & Audio Engineering (The Unsung Hero)
**"A video is 50% visuals and 50% sound."** Lekin 90% naye editors sound design ko ignore karte hain. Is module me aap seekhenge:
*   **Voice Editing:** Background noise kaise hatayein, voice ko deep aur crisp kaise banayein (audacity aur mobile apps se).
*   **Sound Effects (SFX) Placement:** Whoosh, Swoosh, Paper Tear, Mouse Click, aur Riser sound effects ko sahi visual frame par fit karna.
*   **Background Music (BGM) Mixing:** Mood ke hisab se audio levels track karna taaki music voice-over ko overpower na kare.

### 6. Portfolio Building & Clients Kaise Payein
Sirf editing seekhna kaafi nahi hai; usse paise kamana zaroori hai. 
*   **Professional Portfolio Setup:** Apna best work show karne ke liye online links create karna.
*   **Cold Emailing Strategy:** Creators aur brands ko kaise approach karein taaki wo aapko hire karein.
*   **Freelancing Platforms:** Fiverr, Upwork, aur social media groups se high-paying clients kaise find karein.

---

## Learn2Future Par Is Course Ko Join Karne Ke Fayde:

1.  **Direct Downloadable Asset Packs:** Is course ke saath aapko ₹4,999 value ka raw premium material free milega (SFX, Greenscreens, Overlay clips, Templates, and Fonts).
2.  **Lifetime Access & Updates:** Ek baar join karne par aap ise kabhi bhi, kahin bhi dekh sakte hain. Naye tutorials aur software updates aane par naye videos automatic add hote rahenge.
3.  **Hinglish Me Direct Learning:** Koi boring technical jargon nahi. Simple aur practical Hindi language me live edit karke seekhayein gaya hai.
4.  **Dedicated Support System:** Agar koi doubt ho, to aap hamare premium Telegram channel par join karke feedback aur help le sakte hain.

Aapke pass ab ek sunehra mauka hai apne video editing carrier ko next level par le jane ka. **₹1,999 ke is professional course ko aaj hi sirf ₹288 ke limited introductory price par grab karein!**

*Abhi enroll karein aur banayein dynamic videos jo audience ko crazy bana de!*
`;

const courseData = {
  title: "Dynamic EDITS: The Ultimate Guide to Video Editing",
  category: "Video Editing",
  subCategory: "Combo Courses / YouTube Courses",
  price: 288,
  originalPrice: 1999,
  discountPercentage: 86,
  currency: "INR",
  isLimitedTimeOffer: false,
  shortDescription: "Mobile se professional video editing sikhein — content creators aur social media users ke liye complete practical guide.",
  longDescription: longDescription,
  courseOverview: "Dynamic EDITS is a complete step-by-step practical masterclass by Deepak Daiya (Deepak Sir) tailored for YouTubers, Reels Creators, and video editors to learn professional level video editing using mobile and PC tools.",
  whoIsThisCourseFor: "Content creators, YouTubers, Instagram Reel makers, social media managers, freelance video editors, and anyone who wants to edit highly engaging, high-retention videos on mobile or PC.",
  prerequisites: "Koi advanced editing knowledge ki zaroorat nahi hai. Ek functional Smartphone (Android/iOS) ya basic PC aur sikhne ka jazba hona chahiye.",
  language: "Hindi/Hinglish",
  skillLevel: "All Levels",
  courseStatus: "Published",
  thumbnail: "https://cdn-wl-assets.classplus.co/production/single/jauzle/e081fbe3-d1bf-41ae-a346-c3378ec9e809.jpg",
  bannerImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200",
  promoVideoUrl: "https://youtu.be/Tp7PQ4ktAyQ?si=3O7ZEr5zwhTjnXL9",
  previewVideoUrl: "https://youtu.be/Tp7PQ4ktAyQ?si=3O7ZEr5zwhTjnXL9",
  welcomeVideoUrl: "https://youtu.be/Tp7PQ4ktAyQ?si=3O7ZEr5zwhTjnXL9",
  slug: "dynamic-edits-video-editing",
  instructorName: "Deepak Daiya (Deepak Sir)",
  instructorBio: "Deepak Daiya is a leading tech content creator and professional video editor with 4+ years of industry experience. Known for his step-by-step practical teaching style, he has empowered hundreds of thousands of students to master video editing, mobile cinematography, and YouTube growth strategies.",
  instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  courseDuration: "15+ Hours",
  videoHours: "15",
  numberOfLessons: 25,
  numberOfModules: 15,
  assignmentsCount: 5,
  projectsCount: 3,
  quizCount: 2,
  certificateAvailable: true,
  lifetimeAccess: true,
  mobileAccess: true,
  downloadableResources: true,
  googleDriveLink: "",
  telegramLink: "https://t.me/Learn2Future",
  deliveryLink: "",
  accessInstructions: "After payment verification, students will receive the course access details via Email & Telegram. You will get immediate access to our exclusive Premium Drive files and VIP Telegram Channel.",
  importantNotes: "Please provide your correct WhatsApp number and active Gmail address during check-out for seamless onboarding.",
  
  whatYouWillLearn: [
    "CapCut interface, basic timeline tools, video cropping, and layers setup.",
    "Advanced Mobile Keyframing for smooth zoom-ins, zoom-outs, and custom camera pans.",
    "Alight Motion Graph Curves to customize animation ease-in and ease-out organically.",
    "How to edit videos in a cinematic Documentary Style like Vox, Johnny Harris, and Magnates Media.",
    "Paper Texture overlays, old film styles, and 3D map animation tricks.",
    "Advanced Voice Editing: Background noise removal, boosting depth, and sharpening voice-over.",
    "Sound Design Mastery: How to select and sync perfect SFX (Whooshes, Risers, Clicks, Ambient noise).",
    "How to synchronize video cuts perfectly with background music beats.",
    "Kinetic Typography and modern subtitles/captions with animations in CapCut and Alight Motion.",
    "Masking, Green Screen keying, and multi-layer video overlaying techniques.",
    "Professional Reel & Short Form editing tricks for viral retention (first 3-second hook theory).",
    "Color Grading: Implementing Cinematic LUTs, custom exposure settings, and color correction on mobile.",
    "How to build a compelling editing portfolio showcasing your best work.",
    "Step-by-step strategy to approach content creators, YouTubers, and brands for paid editing gigs.",
    "Freelancing success guide: Finding high-paying video editing clients on social media."
  ],

  benefits: [
    "Complete practical hands-on video editing syllabus created by Deepak Sir.",
    "No expensive PC required—learn 100% video editing on your standard Android or iPhone.",
    "Lifetime Access to all course videos, tutorials, and future module additions.",
    "Includes a curated mega-resource asset pack (overlays, transitions, sound effects, fonts).",
    "Learn high-retention editing techniques that boost views, watch time, and subscriber growth.",
    "Master the secrets of professional Sound Design to elevate the production value of any simple video.",
    "Step-by-step guidance on creating documentary-style videos that stand out from ordinary vlogs.",
    "Hands-on practice files and raw footage provided for homework and timeline practice.",
    "Get dedicated support inside our exclusive VIP Student Telegram Channel.",
    "Learn high-income monetization skills: how to transition from video editor to high-paid freelancer.",
    "Step-by-step cold email templates and client pitching scripts included for immediate use.",
    "Learn modern transition mechanics: Glitches, Zoom-swipes, Light leaks, and film burns.",
    "Complete certificate of completion upon finishing all assignments and modules.",
    "Self-paced learning structure: study according to your schedule without any deadlines.",
    "Mobile-friendly learning platform allowing you to watch lectures offline as well."
  ],

  toolsNeeded: [
    "CapCut",
    "Alight Motion",
    "Pixellab",
    "VN Video Editor",
    "Audacity (for PC/Laptop if used)",
    "Lexis Audio Editor (for Mobile Voice Editing)"
  ],

  bonusResources: [
    "1000+ Ultimate sound effects library (SFX) for perfect transition sound design.",
    "500+ Cinematic and trendy background music tracks (Royalty Free).",
    "150+ Cinematic light leaks, particle overlays, and vintage film dust transitions.",
    "Exclusive CapCut template shortcuts & Alight Motion XML project file presets.",
    "Ready-to-use professional cold email outreach templates for securing clients."
  ],

  seoTitle: "Dynamic EDITS: Ultimate Video Editing Course by Deepak Daiya",
  seoDescription: "Mobile se professional video editing sikhein! Master CapCut, Alight Motion, Sound Design, Reel Editing & Documentary Style video editing. Join now at ₹288!",
  focusKeyword: "video editing course hindi",
  secondaryKeywords: [
    "mobile video editing course",
    "capcut editing tutorial hindi",
    "alight motion editing course",
    "reel editing course",
    "documentary style editing hindi",
    "youtube video editing guide"
  ],
  courseTags: [
    "video editing",
    "mobile editing",
    "youtube course",
    "reels editing",
    "capcut tutorial",
    "alight motion",
    "sound effects",
    "deepak daiya",
    "vlogging editing",
    "learn video editing",
    "video editing in hindi",
    "content creation"
  ],

  faqItems: [
    {
      question: "Is course ke liye kya high-end PC ya Laptop hona zaroori hai?",
      answer: "Nahi, is course ko is tarah se design kiya gaya hai ki aap iski sabhi premium editing and animations techniques apne standard smartphone (Android ya iPhone) par hi seekh aur apply kar sakte hain. PC/Laptop hona compulsory nahi hai."
    },
    {
      question: "Course ki lectures kis language me hain?",
      answer: "Lectures bilkul aasan Hindi / Hinglish me hain taaki Indian students ko har ek concepts smoothly aur dhang se samajh me aa sake."
    },
    {
      question: "Kya mujhe course ke saath assets aur presets milenge?",
      answer: "Haan, bilkul! Course me join hote hi aapko ₹4,999+ value ke dynamic presets, professional LUTs, fonts, overlay transitions aur sound effects ka pack bilkul free milega."
    },
    {
      question: "Is course ka access kitne dino tak rahega?",
      answer: "Aapke pass is course ka Lifetime Access rahega. Aap jab chahein, jitni baar chahein isko login karke seekh sakte hain aur aage aane wale sabhi naye videos bhi free me dekh sakte hain."
    },
    {
      question: "Mera payment safe hai ya nahi? Access kab milega?",
      answer: "Aapka payment 100% secure hai. Payment complete hone aur verification ke baad aapko instant digital course link aur exclusive Telegram channel ka access mil jayega."
    },
    {
      question: "Kya ye course complete beginners ke liye suitable hai?",
      answer: "Haan, ye course absolute zero se start hota hai. Agar aapko video editing ka 'V' bhi nahi pata, tab bhi aap iske simple step-by-step breakdown se master level professional edit seekh jayenge."
    },
    {
      question: "Documentary Style editing me kya cover hoga?",
      answer: "Isme historical maps, newspaper scanning, textured background overlays, camera pacing, cinematic transition setups, aur professional visual representation style cover kiya gaya hai."
    },
    {
      question: "Kya mujhe course ka Certificate milega?",
      answer: "Haan, course curriculum aur optional assignments complete karne ke baad, Learn2Future ki taraf se aapko ek prestigious Video Editing Certificate of Completion pradan kiya jayega."
    },
    {
      question: "Is course me kaun kaun se softwares cover hote hain?",
      answer: "Mainly mobile ke sabse popular tools CapCut, Alight Motion, VN Editor, Pixellab aur audio enhancement ke liye best mobile audio processing apps detail me cover kiye gaye hain."
    },
    {
      question: "Kya isme sound design detail me sikhaya jayega?",
      answer: "Haan! Sound design is course ka sabsay bada highlight hai. Deep Voice-over mixing, background music compression, transitions voice synchronization, aur SFX timing par live demo dikhaya gaya hai."
    },
    {
      question: "Client seekhne aur paise kamane wala part kab shuru hoga?",
      answer: "Curriculum ke modules me detail me portfolio building, standard pricing sheets, cold email scripts, aur local/international creators ko pitches bhejne ka practical dhang bataya gaya hai."
    },
    {
      question: "Kya main videos ko download karke offline dekh sakta hoon?",
      answer: "Haan! Hamara platform mobile access ko support karta hai, jahan aap easily online stream ke sath-sath study material ko access kar sakte hain."
    },
    {
      question: "Agar mujhe editing me koi error ya doubt aaye to support milega?",
      answer: "Haan, hamare VIP Student community support channel par join karke aap apne edits share karke experts se guidelines aur feedbacks le sakte hain."
    },
    {
      question: "Kya checkout ke baad koi hidden charge bhi liya jayega?",
      answer: "Nahi, ₹288 ek one-time fee hai. Iske baad aap se koi additional ya hidden monthly fees nahi li jayegi."
    },
    {
      question: "Main is course ko kaise join karu?",
      answer: "Niche diye gaye 'Enroll Now' button par click karein, payment instructions follow karein, apna screen snapshot upload karein aur instant login details paayein!"
    }
  ],

  modules: [
    {
      id: "mod-1",
      title: "MODULE 1 - Introduction to Video Editing Concept",
      lessons: [
        {
          id: "les-1-1",
          title: "Course Overview and Setting up your Workspace",
          description: "Understanding course outline, layout, files import, and mobile editing optimization tips.",
          duration: "12:45",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-2",
      title: "MODULE 2 - Fundamentals of Visual Retention",
      lessons: [
        {
          id: "les-2-1",
          title: "Visual Framing, Rule of Thirds, and Storyboard Basics",
          description: "How to frame your story, structure B-rolls, and design high-retention video plans before editing.",
          duration: "22:15",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-3",
      title: "MODULE 3 - Mobile Editing Toolkit & Resource Hub",
      lessons: [
        {
          id: "les-3-1",
          title: "Downloading and Organizing Editing Apps (Ad-Free & Pro)",
          description: "How to safely download, configure, and install essential apps and fonts for editing.",
          duration: "15:30",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-4",
      title: "MODULE 4 - Sourcing Premium Video Materials & Footages",
      lessons: [
        {
          id: "les-4-1",
          title: "How to Download Copyright-Free Cinematic Video Assets & Graphics",
          description: "Best free portals to source unlimited stock footages, graphic overlays, and royalty-free cinematic music.",
          duration: "18:40",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-5",
      title: "MODULE 5 - Alight Motion: The Beginner's Guide",
      lessons: [
        {
          id: "les-5-1",
          title: "Alight Motion Interface, Keyframing, and Vector Controls",
          description: "Mastering timeline controls, basic shapes, paths, and coordinate systems for smooth flow.",
          duration: "35:10",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-6",
      title: "MODULE 6 - CapCut: Complete Timeline Mastery",
      lessons: [
        {
          id: "les-6-1",
          title: "Basic to Advanced Tool Navigation & Multi-Track Setup",
          description: "How to import, chop, clip split, overlay, reverse, and optimize render resolutions.",
          duration: "25:15",
          type: "Video"
        },
        {
          id: "les-6-2",
          title: "Keyframes, Masking, and Speed Ramping in CapCut",
          description: "Creating highly customized zoom sequences, transition masks, and butter-smooth slow-motion cuts.",
          duration: "28:40",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-7",
      title: "MODULE 7 - Vox / Johnny Harris style Documentary Editing",
      lessons: [
        {
          id: "les-7-1",
          title: "Paper Textures and Map Pinpoint Animations",
          description: "Step-by-step guidance on creating historic paper textures, newspaper burns, and clean coordinate map trails.",
          duration: "32:10",
          type: "Video"
        },
        {
          id: "les-7-2",
          title: "Cinematic Overlays, Lighting leaks & Dust Texturing",
          description: "Enhancing the atmosphere with film grain overlay, old cinema filters, and realistic retro flashes.",
          duration: "20:15",
          type: "Video"
        },
        {
          id: "les-7-3",
          title: "High-Retention Historical Photo 3D Parallax Effects",
          description: "Bringing old static images to life by separating the foreground and animating depth offsets.",
          duration: "24:30",
          type: "Video"
        },
        {
          id: "les-7-4",
          title: "Full Documentary Scene Breakdown & Edit Walkthrough",
          description: "Putting everything together to build a professional 3-minute storytelling video sequence.",
          duration: "45:00",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-8",
      title: "MODULE 8 - Premium Voice-Over Editing",
      lessons: [
        {
          id: "les-8-1",
          title: "Professional Vocal Warmth & Noise Reduction on Mobile",
          description: "How to edit raw mobile recorded audio, compress peaks, add bass, and make vocals sound studio-quality.",
          duration: "18:20",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-9",
      title: "MODULE 9 - Sound Design & Audio Synchrony",
      lessons: [
        {
          id: "les-9-1",
          title: "How to Place and Sync Whoosh, Risers, and Click Sound Effects",
          description: "Syncing SFX to transitions, adding subtle click effects, and timing the perfect ambient noise layers.",
          duration: "22:15",
          type: "Video"
        },
        {
          id: "les-9-2",
          title: "Mastering Music Beat Drops and Audio Levels Mixing",
          description: "Tuning background tracks so they automatically dip beneath vocals and pop during silence blocks.",
          duration: "19:40",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-10",
      title: "MODULE 10 - Viral Reels & Shorts Editing Masterclass",
      lessons: [
        {
          id: "les-10-1",
          title: "High-Retention Instagram Reels Editing Blueprint",
          description: "Mastering the 3-second attention hook, zoom patterns, fast text captions, and sound loops for viral reels.",
          duration: "28:10",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-11",
      title: "MODULE 11 - Kinetic Typography & Motion Graphics",
      lessons: [
        {
          id: "les-11-1",
          title: "Creating High-Impact Smooth Animated Titles",
          description: "How to craft modern floating text animations, glowing title drops, and beautiful social media lower-thirds.",
          duration: "30:45",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-12",
      title: "MODULE 12 - Monitising Your Editing Skill",
      lessons: [
        {
          id: "les-12-1",
          title: "How to Find Clients, Setup Pricing & Sell Video Editing Services",
          description: "Step-by-step masterclass on cold-emailing, LinkedIn outreach, Fiverr freelancing, and keeping repeat clients.",
          duration: "34:20",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-13",
      title: "MODULE 13 - Advanced Soundscapes & Foley",
      lessons: [
        {
          id: "les-13-1",
          title: "Adding Immersive Atmospheric Audio and Spatial Sounds",
          description: "How to simulate realism using ambient birds, traffic, wind, reverb presets, and custom foley recording.",
          duration: "17:15",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-14",
      title: "MODULE 14 - Final Editing Workflow & Export Settings",
      lessons: [
        {
          id: "les-14-1",
          title: "Perfect Export Settings for YouTube, Instagram & Facebook",
          description: "Maximizing video crispness, color depth, frame rates, bitrates, and avoiding high compression pixelation.",
          duration: "15:50",
          type: "Video"
        }
      ]
    },
    {
      id: "mod-15",
      title: "MODULE 15 - Portfolio & Personal Profile Construction",
      lessons: [
        {
          id: "les-15-1",
          title: "Building an Unbeatable Showcase Portfolio",
          description: "How to present your projects in a simple Google Drive folder structure, custom Linktree, or portfolio pages.",
          duration: "21:30",
          type: "Video"
        }
      ]
    }
  ]
};

async function run() {
  console.log("Connecting to Firestore database via firebase-admin...");
  try {
    const docRef = db.collection("courses").doc("dynamic-edits-video-editing");
    await docRef.set({
      ...courseData,
      description: courseData.shortDescription || "", // Ensure description field exists
      serverSecret: "app_server_bypass_secret_2026_xYz987",
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log("🎉 Course successfully added to Firestore database under ID: 'dynamic-edits-video-editing'!");
  } catch (error) {
    console.error("❌ Failed to add course:", error);
    process.exit(1);
  }
}

run();
