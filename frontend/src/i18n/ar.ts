export const ar = {
  brand: "ArabArenaAI",
  brandTagline: "مقارنة النماذج الذكية بالعربية",
  nav: {
    home: "الرئيسية",
    compare: "قارِن",
    insights: "إشارات المجتمع",
    models: "النماذج",
    about: "عن المنصة",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    contact: "تواصل معنا",
  },
  home: {
    heroTitle: "قارِن نماذج الذكاء الاصطناعي",
    heroHighlight: "باللغة العربية",
    heroSubtitle:
      "أدخل موجهًا واحدًا، اختر من ٢ إلى ١٠ نماذج، واطّلع على ردودها جنبًا إلى جنب. صوّت لتفضيلك وشاهد إشارات المجتمع — بدون تصنيفات رسمية.",
    cta: "ابدأ المقارنة",
    ctaSecondary: "استكشف إشارات المجتمع",
    features: [
      {
        title: "عربي أولًا",
        description: "واجهة RTL مصممة للنصوص العربية والمقارنات الحقيقية.",
      },
      {
        title: "مقارنة متعددة",
        description: "اختر من ٢ إلى ١٠ نماذج في طلب واحد وشاهد الردود معًا.",
      },
      {
        title: "إشارات المجتمع",
        description: "نسب تفضيل المجتمع فقط — لا فائز ولا خاسر.",
      },
    ],
    howItWorks: "كيف تعمل المنصة",
    steps: [
      "اكتب موجهك بالعربية",
      "اختر الفئة والنماذج",
      "قارِن الردود وصوّت",
      "اطّلع على نسب تفضيل المجتمع",
    ],
  },
  compare: {
    title: "مقارنة جديدة",
    subtitle: "موجه واحد · عدة نماذج · ردود جنبًا إلى جنب",
    promptLabel: "الموجه",
    promptPlaceholder: "اكتب سؤالك أو طلبك بالعربية...",
    promptHint: "كلما كان الموجه أوضح، كانت المقارنة أدق",
    categoryLabel: "فئة الموجه",
    autoDetect: "اكتشاف تلقائي",
    autoDetectHint: "سنقترح فئة بناءً على محتوى الموجه",
    modelsLabel: "النماذج",
    modelsHint: "اختر بين ٢ و ١٠ نماذج",
    modelsStep: "اختيار النماذج",
    categoryStep: "الفئة",
    promptStep: "الموجه",
    submit: "ابدأ المقارنة",
    submitting: "جاري بدء المقارنة...",
    readyToCompare: "جاهز للمقارنة",
    needsPrompt: "أدخل موجهك أولاً",
    needsModels: "اختر نموذجين على الأقل",
    needsCategory: "حدّد فئة الموجه",
    minModels: "يجب اختيار نموذجين على الأقل",
    maxModels: "الحد الأقصى ١٠ نماذج",
    comingSoon: "قريباً",
    selected: "محدد",
    clearSelection: "مسح التحديد",
    selectPopular: "تحديد الأكثر شيوعًا",
    modelsLoadError: "تعذّر تحميل النماذج. تحقق من الاتصال بالخادم وحاول مرة أخرى.",
    modelsLoading: "جاري تحميل النماذج...",
    providerUnavailable: "المزود غير متاح حالياً",
    guide: {
      title: "كيف تبدأ المقارنة",
      steps: [
        "اكتب موجهًا واضحًا بالعربية يصف ما تريد مقارنته.",
        "اختر فئة الموجه أو فعّل الاكتشاف التلقائي.",
        "حدّد نموذجين على الأقل ثم اضغط «ابدأ المقارنة».",
      ],
    },
    emptyPrompt: "ابدأ بكتابة موجهك هنا لرؤية الخطوات التالية.",
    emptyModelsTitle: "لا توجد نماذج متاحة حالياً",
    emptyModelsDescription: "تحقق من الاتصال بالخادم أو أعد تحميل الصفحة لاحقًا.",
  },
  results: {
    title: "نتائج المقارنة",
    responsesHeading: "ردود النماذج",
    responsesHint: "قارِن الردود جنبًا إلى جنب — اضغط على الرد المفضّل للتصويت",
    loading: "جاري توليد الردود...",
    loadingProgress: "اكتمل {done} من {total}",
    partial: "بعض النماذج لم تُكمل الرد",
    voteTitle: "صوّت لتفضيلك",
    voteHint: "اختر الرد الذي تفضّله — هذه إشارة مجتمعية وليست حكمًا رسميًا",
    voteSubmit: "تأكيد التفضيل",
    voteSubmitting: "جاري التسجيل...",
    voteSelectFirst: "اختر ردًا للتصويت",
    voteSelected: "تفضيلك المحدد",
    voteSuccess: "شكرًا — تم تسجيل تفضيلك",
    alreadyVoted: "لقد سجّلت تفضيلك مسبقًا",
    responseTime: "زمن الاستجابة",
    errorResponse: "تعذر الحصول على رد",
    waiting: "في انتظار الرد...",
    compareAgain: "مقارنة جديدة",
    viewInsights: "إشارات المجتمع",
  },
  insights: {
    title: "إشارات المجتمع",
    subtitle: "نسب تفضيل المجتمع — ليست تقييمًا رسميًا للنماذج",
    overall: "الكل",
    byCategory: "حسب الفئة",
    preferenceShare: "نسبة تفضيل المجتمع",
    totalVotes: "إجمالي الأصوات",
    noData: "لا توجد بيانات كافية بعد",
    disclaimer:
      "هذه النسب تعكس تفضيلات المجتمع وليست تقييمًا رسميًا أو ranking للنماذج.",
  },
  models: {
    title: "النماذج المتاحة",
    subtitle: "جميع النماذج المدعومة على المنصة",
    provider: "المزود",
    placeholder: "قريباً",
    available: "متاح",
  },
  about: {
    title: "عن ArabArenaAI",
    intro: {
      paragraph1:
        "ArabArenaAI منصة مستقلة تساعد المستخدم على مقارنة ردود نماذج الذكاء الاصطناعي من عدة مزودين في مكان واحد، بهدف تسهيل اختيار الإجابة الأنسب بسرعة ووضوح.",
      paragraph2:
        "يدير المشروع Abdullah Alamri، ويركز على تجربة المستخدم، جودة المقارنة، وتحسين الوصول إلى أدوات الذكاء الاصطناعي باللغة العربية.",
    },
    mission: {
      title: "رسالتنا",
      body: "ArabArenaAI منصة عربية-first لمقارنة نماذج الذكاء الاصطناعي على موجهات حقيقية باللغة العربية. نجمع تفضيلات المجتمع بشفافية — دون ادّعاءات رسمية عن تفوق نموذج على آخر.",
    },
    methodology: {
      title: "المنهجية",
      items: [
        "موجه واحد → عدة نماذج → ردود متوازية",
        "تصويت مجتمعي واحد لكل مقارنة",
        "تجميع النسب حسب الكل أو حسب الفئة",
        "لا نعرض ترتيبًا أو فائزًا أو خاسرًا",
      ],
    },
    transparency: {
      title: "الشفافية",
      body: "نُظهر نسب تفضيل المجتمع (Preference Share) فقط. لا نستخدم لغة «الأفضل» أو «#1». البيانات تعكس إشارات المستخدمين وليست benchmark أكاديميًا.",
    },
  },
  footer: {
    tagline: "مقارنة شفافة · إشارات مجتمعية · عربي أولًا",
    platformTagline: "AI Model Comparison Platform",
    rights: "© 2026 ArabArenaAI",
    disclaimer:
      "ArabArenaAI is an independent AI comparison platform and is not affiliated with OpenAI, Anthropic, Google, xAI, DeepSeek, Qwen, or any other AI provider shown.",
    legal: "الصفحات القانونية",
    product: "المنتج",
  },
  privacy: {
    title: "سياسة الخصوصية",
    subtitle: "آخر تحديث: يونيو 2026",
    intro:
      "توضّح هذه السياسة كيف تتعامل منصة ArabArenaAI مع البيانات عند استخدامك للموقع. نهدف إلى الشفافية دون ادّعاءات امتثال لا يمكن التحقق منها في هذه المرحلة.",
    sections: {
      dataCollection: {
        title: "البيانات التي نجمعها",
        paragraphs: [
          "قد نجمع بيانات تقنية أساسية مثل نوع المتصفح، ووقت الطلب، ومعرّف جلسة مؤقت لتحسين تجربة الاستخدام ومنع الإساءة.",
          "عند إرسال موجه للمقارنة، يتم حفظ نص الموجه ونتائج المقارنة والتصويتات المرتبطة بها ضمن بنية الخدمة التشغيلية.",
        ],
      },
      comparisonRequests: {
        title: "طلبات المقارنة",
        paragraphs: [
          "تُستخدم طلبات المقارنة لتشغيل الميزة الأساسية للمنصة وعرض الردود جنبًا إلى جنب.",
          "قد يتم إرسال الموجه إلى مزودي ذكاء اصطناعي خارجيين لتوليد الردود وفق إعدادات المنصة.",
        ],
      },
      analytics: {
        title: "تحليلات الاستخدام",
        paragraphs: [
          "قد نستخدم بيانات مجمّعة عن الاستخدام لفهم أداء المنصة وتحسينها، مثل عدد المقارنات وحالات النجاح أو الفشل.",
          "لا نهدف إلى تتبّع هوية المستخدم الشخصية لأغراض إعلانية خارج نطاق تشغيل الخدمة.",
        ],
      },
      cookies: {
        title: "ملفات تعريف الارتباط (Cookies)",
        paragraphs: [
          "قد تستخدم المنصة ملفات تعريف ارتباط أو تقنيات مشابهة للجلسة، والأمان، واستقرار التجربة.",
          "يمكنك التحكم في ملفات تعريف الارتباط من إعدادات المتصفح، مع العلم أن تعطيلها قد يؤثر على بعض الوظائف.",
        ],
      },
      thirdParty: {
        title: "مزودو الذكاء الاصطناعي الخارجيون",
        paragraphs: [
          "تعتمد ArabArenaAI على مزودين خارجيين لتوليد الردود. تخضع معالجة البيانات عند هؤلاء المزودين لسياساتهم الخاصة.",
          "ArabArenaAI منصة مستقلة وغير تابعة لأي مزود ذكاء اصطناعي معروض على الموقع.",
        ],
        items: [
          "OpenAI",
          "Anthropic",
          "Google",
          "xAI",
          "DeepSeek",
          "Qwen",
          "ALLaM",
        ],
      },
      userResponsibilities: {
        title: "مسؤوليات المستخدم",
        items: [
          "عدم إرسال بيانات حساسة أو شخصية لا ترغب في مشاركتها ضمن الموجهات.",
          "التأكد من أن المحتوى المرسل لا ينتهك القوانين المعمول بها أو حقوق الآخرين.",
          "استخدام المنصة بشكل مسؤول وضمن حدود الاستخدام المقبول.",
        ],
      },
      contact: {
        title: "التواصل",
        paragraphs: [
          "للاستفسارات المتعلقة بالخصوصية، يمكنك التواصل عبر privacy@arabarenaai.com أو صفحة تواصل معنا.",
        ],
      },
      retention: {
        title: "الاحتفاظ بالبيانات",
        paragraphs: [
          "نحتفظ بالبيانات التشغيلية للمدة اللازمة لتقديم الخدمة وتحسينها وحمايتها.",
          "قد يتم حذف البيانات أو اختصار فترة الاحتفاظ بها مستقبلًا وفق سياسات تشغيل محدّثة.",
        ],
      },
    },
  },
  terms: {
    title: "شروط الاستخدام",
    subtitle: "آخر تحديث: يونيو 2026",
    intro:
      "باستخدامك ArabArenaAI فإنك توافق على هذه الشروط. إذا لم توافق عليها، يرجى عدم استخدام المنصة.",
    sections: {
      acceptableUse: {
        title: "الاستخدام المقبول",
        items: [
          "استخدام المنصة للمقارنة والاطلاع على الردود والتصويت بشكل قانوني ومسؤول.",
          "عدم محاولة تعطيل الخدمة أو اختراقها أو إساءة استخدام واجهات البرمجة.",
          "عدم إرسال محتوى مسيء أو غير قانوني أو مضلل عمدًا.",
        ],
      },
      noAccuracyGuarantee: {
        title: "عدم ضمان دقة الذكاء الاصطناعي",
        paragraphs: [
          "ردود النماذج تولَّد آلياً وقد تحتوي على أخطاء أو معلومات ناقصة أو قديمة.",
          "ArabArenaAI تساعدك على المقارنة ولا تضمن صحة أو اكتمال أو ملاءمة أي إجابة لقرارك.",
        ],
      },
      availability: {
        title: "توفر الخدمة",
        paragraphs: [
          "نسعى لتوفير خدمة مستقرة، لكن قد تحدث انقطاعات أو صيانة أو قيود مؤقتة.",
          "لا نضمن توفر المنصة بشكل مستمر دون انقطاع في جميع الأوقات.",
        ],
      },
      thirdPartyDependency: {
        title: "الاعتماد على مزودين خارجيين",
        paragraphs: [
          "تعتمد المقارنات على مزودي ذكاء اصطناعي خارجيين. قد تتأثر النتائج بتوفر هؤلاء المزودين أو سياساتهم أو حدودهم.",
          "ArabArenaAI ليست مسؤولة عن تغيّرات أو انقطاعات لدى مزودي الطرف الثالث.",
        ],
      },
      liability: {
        title: "تحديد المسؤولية",
        paragraphs: [
          "تُقدَّم المنصة «كما هي» ضمن حدود ما تتيحه البنية التشغيلية الحالية.",
          "لا تتحمل ArabArenaAI مسؤولية عن قرارات أو أضرار مباشرة أو غير مباشرة ناتجة عن الاعتماد على ردود النماذج.",
        ],
      },
      intellectualProperty: {
        title: "الملكية الفكرية",
        paragraphs: [
          "علامة ArabArenaAI والمحتوى التشغيلي للمنصة محمية ضمن الحدود المعمول بها.",
          "لا يمنحك استخدام المنصة حقوقًا في علامات أو خدمات المزودين الخارجيين.",
        ],
      },
      userResponsibilities: {
        title: "مسؤوليات المستخدم",
        items: [
          "تقييم الردود بعناية قبل اتخاذ أي قرار يعتمد عليها.",
          "الالتزام بالقوانين المحلية والدولية عند استخدام المنصة.",
          "إبلاغنا عبر صفحة التواصل عند ملاحظة إساءة استخدام أو مشكلة تشغيلية.",
        ],
      },
    },
  },
  contact: {
    title: "تواصل معنا",
    subtitle: "نرحب باستفساراتك العامة والتجارية",
    emailSection: {
      title: "قنوات البريد الإلكتروني",
      note: "تواصل معنا مباشرة عبر أي من عناوين البريد الرسمية أدناه.",
    },
    beta: {
      title: "نسخة تجريبية (Beta) من ArabArenaAI",
      subtitle: "نعمل باستمرار على تحسين المنصة وتطوير التجربة.",
    },
    social: {
      title: "تابعنا على X",
      description: "آخر التحديثات والإعلانات من ArabArenaAI.",
      xHandle: "@ArabArenaAI",
      xUrl: "https://x.com/ArabArenaAI",
    },
    emails: {
      hello: {
        label: "البريد العام",
        address: "hello@arabarenaai.com",
        description: "للمراسلات العامة والتعريف بالمنصة.",
      },
      support: {
        label: "الدعم",
        address: "support@arabarenaai.com",
        description: "للمساعدة التقنية ومشكلات استخدام المنصة.",
      },
      privacy: {
        label: "الخصوصية",
        address: "privacy@arabarenaai.com",
        description: "للاستفسارات المتعلقة بالبيانات والخصوصية.",
      },
      contact: {
        label: "التواصل",
        address: "contact@arabarenaai.com",
        description: "للاستفسارات العامة والتجارية.",
      },
    },
    general: {
      title: "استفسارات عامة",
      body: "للأسئلة حول استخدام المنصة، المقارنات، أو تجربة المستخدم.",
    },
    business: {
      title: "استفسارات تجارية",
      body: "للتعاون، الشراكات، أو الاقتراحات المتعلقة بتطوير ArabArenaAI.",
    },
    form: {
      title: "نموذج التواصل",
      nameLabel: "الاسم",
      emailLabel: "البريد الإلكتروني",
      inquiryTypeLabel: "نوع الاستفسار",
      generalInquiry: "استفسار عام",
      businessInquiry: "استفسار تجاري",
      messageLabel: "الرسالة",
      submit: "إرسال الرسالة",
      helper: "سيتم إرسال رسالتك عبر بريدك الإلكتروني إلى الفريق المناسب في ArabArenaAI.",
      successNotice: "شكراً لتواصلك مع ArabArenaAI. تم تجهيز رسالتك — أكمل الإرسال من بريدك الإلكتروني.",
    },
  },
  seo: {
    home: {
      title: "مقارنة نماذج الذكاء الاصطناعي بالعربية",
      description:
        "قارِن ردود GPT-4o وClaude وGemini وDeepSeek وGrok باللغة العربية في مكان واحد مع ArabArenaAI.",
    },
    about: {
      title: "عن ArabArenaAI",
      description:
        "تعرّف على رؤية ArabArenaAI ومنهجية المقارنة الشفافة وإشارات تفضيل المجتمع باللغة العربية.",
    },
    compare: {
      title: "ابدأ مقارنة جديدة",
      description:
        "أدخل موجهًا بالعربية واختر النماذج لمقارنة الردود جنبًا إلى جنب على ArabArenaAI.",
    },
    privacy: {
      title: "سياسة الخصوصية",
      description: "اطّلع على سياسة خصوصية ArabArenaAI وكيفية التعامل مع البيانات وطلبات المقارنة.",
    },
    terms: {
      title: "شروط الاستخدام",
      description: "اقرأ شروط استخدام ArabArenaAI والاستخدام المقبول وحدود المسؤولية.",
    },
    contact: {
      title: "تواصل معنا",
      description: "تواصل مع ArabArenaAI للاستفسارات العامة والتجارية.",
    },
  },
  admin: {
    title: "لوحة الإدارة",
    loginTitle: "تسجيل دخول الإدارة",
    passwordLabel: "كلمة المرور",
    login: "دخول",
    logout: "خروج",
    refresh: "تحديث البيانات",
    notConfigured: "Admin is not configured.",
    invalidCredentials: "Invalid credentials.",
    unauthorized: "يجب تسجيل الدخول أولاً",
    cards: {
      totalModels: "إجمالي النماذج",
      enabledModels: "النماذج المفعّلة",
      providerHealth: "صحة المزودين",
      recentComparisons: "المقارنات",
      spendingLimits: "حدود الإنفاق",
      deploymentStatus: "حالة النشر",
      providerErrors: "آخر أخطاء المزودين",
      comingSoon: "قريباً",
    },
    systemOverview: {
      title: "نظرة عامة على النظام",
      applicationVersion: "إصدار التطبيق",
      gitCommit: "آخر Git Commit",
      lastDeploymentTime: "وقت آخر نشر",
      environment: "البيئة",
      notAvailable: "Not Available",
    },
    providerStatus: {
      title: "حالة المزودين",
      healthy: "Healthy",
      unavailable: "Unavailable",
      unknown: "Unknown",
    },
    recentActivity: {
      title: "Recent Activity",
      timestamp: "الوقت",
      activityType: "نوع النشاط",
      status: "الحالة",
      empty: "No activity available",
    },
    errorMonitoring: {
      title: "Error Monitoring",
      source: "المصدر",
      errorType: "نوع الخطأ",
      failures: "عدد الإخفاقات",
      empty: "No error data available",
      noRecordedErrors: "لا توجد أخطاء مسجّلة حالياً",
    },
  },
  errors: {
    generic: "حدث خطأ غير متوقع",
    retry: "إعادة المحاولة",
    retryHint: "حدثت مشكلة مؤقتة. يمكنك إعادة المحاولة أو العودة للرئيسية.",
    goHome: "العودة للرئيسية",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    description: "الرابط الذي طلبته غير متوفر أو تم نقله. جرّب العودة للرئيسية أو ابدأ مقارنة جديدة.",
    goHome: "العودة للرئيسية",
  },
} as const;

export type ArStrings = typeof ar;
