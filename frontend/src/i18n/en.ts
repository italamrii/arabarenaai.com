export const en = {
  brand: "ArabArenaAI",
  brandTagline: "Compare AI models in Arabic",
  common: {
    skipToContent: "Skip to content",
    menuAria: "Menu",
  },
  localeSwitcher: {
    label: "Language",
    arabic: "العربية",
    english: "English",
  },
  nav: {
    home: "Home",
    compare: "Compare",
    insights: "Community Signals",
    models: "Models",
    about: "About",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contact: "Contact Us",
  },
  home: {
    heroTitle: "Compare AI Models",
    heroHighlight: "Side by Side",
    heroSubtitle:
      "Enter one prompt, choose 2 to 10 models, and view their responses side by side. Vote for your preference and explore community signals — no official rankings.",
    cta: "Start Comparing",
    ctaSecondary: "Explore Community Signals",
    features: [
      {
        title: "Arabic First",
        description:
          "An RTL interface built for Arabic text and meaningful side-by-side comparisons.",
      },
      {
        title: "Multi-Model Comparison",
        description: "Select 2 to 10 models in a single request and view responses together.",
      },
      {
        title: "Community Signals",
        description: "Community preference shares only — no winners or losers.",
      },
    ],
    howItWorks: "How It Works",
    steps: [
      "Write your prompt in Arabic",
      "Choose a category and models",
      "Compare responses and vote",
      "View community preference shares",
    ],
  },
  compare: {
    title: "New Comparison",
    subtitle: "One prompt · Multiple models · Side-by-side responses",
    promptLabel: "Prompt",
    promptPlaceholder: "Type your question or upload a file...",
    attachment: {
      attach: "Attach file",
      uploading: "Uploading file...",
      remove: "Remove attachment",
      invalidType: "Unsupported file type. Allowed: PNG, JPG, WEBP, PDF",
      tooLarge: "File size exceeds 20 MB",
      uploadFailed: "Could not upload the file. Please try again.",
      supportsImages: "Supports images",
      supportsFiles: "Supports files",
      unsupported: "Not supported",
    },
    promptHint: "The clearer your prompt, the more useful the comparison",
    categoryLabel: "Prompt category",
    autoDetect: "Auto-detect",
    autoDetectHint: "We will suggest a category based on your prompt content",
    detectingCategory: "Detecting...",
    modelsLabel: "Models",
    modelsHint: "Select between 2 and 10 models",
    modelsStep: "Model selection",
    categoryStep: "Category",
    promptStep: "Prompt",
    submit: "Start Comparison",
    submitting: "Starting comparison...",
    readyToCompare: "Ready to compare",
    needsPrompt: "Enter your prompt first",
    needsModels: "Select at least two models",
    needsCategory: "Choose a prompt category",
    minModels: "You must select at least two models",
    maxModels: "Maximum of 10 models",
    comingSoon: "Coming soon",
    selected: "Selected",
    clearSelection: "Clear selection",
    selectPopular: "Select most popular",
    modelsLoadError: "Could not load models. Check your server connection and try again.",
    modelsLoading: "Loading models...",
    providerUnavailable: "Currently unavailable",
    guide: {
      title: "How to start a comparison",
      steps: [
        "Write a clear prompt in Arabic describing what you want to compare.",
        "Choose a prompt category or enable auto-detect.",
        "Select at least two models, then click Start Comparison.",
      ],
    },
    emptyPrompt: "Start by writing your prompt here to see the next steps.",
    emptyModelsTitle: "No models available right now",
    emptyModelsDescription: "Check your server connection or reload the page later.",
  },
  results: {
    title: "Comparison Results",
    responsesHeading: "Model Responses",
    responsesHint: "Compare responses side by side — click your preferred response to vote",
    loading: "Generating responses...",
    loadingProgress: "{done} of {total} complete",
    partial: "Some models did not finish responding",
    voteTitle: "Vote for your preference",
    voteHint: "Choose the response you prefer — this is a community signal, not an official verdict",
    voteSubmit: "Confirm preference",
    voteSubmitting: "Submitting...",
    voteSelectFirst: "Select a response to vote",
    voteSelected: "Your selected preference",
    selected: "Selected",
    clickToSelect: "Click to select",
    voteSuccess: "Thank you — your preference has been recorded",
    pollTimeout: "This comparison took longer than expected and did not complete.",
    pollTimeoutHint: "A provider may be slow or unavailable. You can try again.",
    alreadyVoted: "You have already recorded your preference",
    responseTime: "Response time",
    errorResponse: "Could not get a response",
    waiting: "Waiting for response...",
    compareAgain: "New comparison",
    viewInsights: "Community Signals",
  },
  insights: {
    title: "Community Signals",
    subtitle: "Community preference shares — not an official model evaluation",
    overall: "Overall",
    byCategory: "By category",
    preferenceShare: "Community preference share",
    totalVotes: "Total votes",
    noData: "Not enough data yet",
    disclaimer:
      "These shares reflect community preferences and are not an official evaluation or ranking of models.",
  },
  models: {
    title: "Available Models",
    subtitle: "All models supported on the platform",
    provider: "Provider",
    placeholder: "Coming soon",
    available: "Available",
  },
  about: {
    title: "About ArabArenaAI",
    intro: {
      paragraph1:
        "ArabArenaAI is an independent platform that helps users compare AI model responses from multiple providers in one place, making it easier to choose the most suitable answer quickly and clearly.",
      paragraph2:
        "The project is led by Abdullah Alamri, with a focus on user experience, comparison quality, and improving access to AI tools in Arabic.",
    },
    mission: {
      title: "Our Mission",
      body: "ArabArenaAI is an Arabic-first platform for comparing AI models on real prompts in Arabic. We collect community preferences transparently — without claiming that one model is officially better than another.",
    },
    methodology: {
      title: "Methodology",
      items: [
        "One prompt → multiple models → parallel responses",
        "One community vote per comparison",
        "Aggregate shares overall or by category",
        "We do not show rankings, winners, or losers",
      ],
    },
    transparency: {
      title: "Transparency",
      body: "We show community preference shares only. We do not use language like \"best\" or \"#1.\" The data reflects user signals, not an academic benchmark.",
    },
    independence: {
      title: "Platform Independence",
      paragraphs: [
        "ArabArenaAI is an independent platform for comparing AI models. It is not affiliated with any model provider or technology company featured on the site, and does not represent a partnership, sponsorship, or official endorsement from any of them.",
        "All trademarks, product names, and services displayed belong to their respective owners.",
      ],
    },
  },
  legal: {
    trademarkNotice: "All trademarks and product names belong to their respective owners.",
    independenceShort:
      "ArabArenaAI is an independent platform and is not affiliated with any AI provider featured on the site.",
    aiContentNotice:
      "AI responses may be inaccurate, incomplete, biased, or outdated. They do not constitute legal, medical, financial, or professional advice.",
    cookieNotice: {
      ariaLabel: "Cookie notice",
      message:
        "We use cookies and optional analytics tools (such as Google Analytics or Microsoft Clarity when enabled) to understand platform usage and improve the experience.",
      accept: "Got it",
      learnMore: "Privacy Policy",
    },
  },
  footer: {
    tagline: "Transparent comparisons · Community signals · Arabic first",
    platformTagline: "AI Model Comparison Platform",
    rights: "© 2026 ArabArenaAI",
    disclaimer:
      "ArabArenaAI is an independent platform for comparing AI models. It is not affiliated with OpenAI, Anthropic, Google, xAI, DeepSeek, Qwen, IBM, SDAIA, HUMAIN, Alibaba, Microsoft, or any other provider featured on the site. All trademarks belong to their respective owners.",
    legal: "Legal",
    product: "Product",
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Last updated: June 2026",
    intro:
      "This policy explains how ArabArenaAI handles data when you use the site. We aim to be transparent without making compliance claims that cannot be verified at this stage.",
    sections: {
      dataCollection: {
        title: "Data We Collect",
        paragraphs: [
          "We may collect basic technical data such as browser type, request time, and a temporary session identifier (in localStorage) to improve the user experience and prevent abuse.",
          "When you submit a prompt for comparison, the prompt text, comparison results, and associated votes are stored within the operational service infrastructure.",
          "We do not intentionally collect sensitive data such as ID numbers, medical records, or financial data through registration forms — but you may include such data in prompts or attachments at your own risk.",
        ],
      },
      uploads: {
        title: "Attachments (Images and PDF Files)",
        paragraphs: [
          "If you upload an image or PDF file, the file is stored temporarily to run the comparison and may be sent to AI providers according to platform settings.",
          "You are responsible for the content you upload. Do not upload files containing sensitive personal data or unlawful content.",
          "We aim to delete attachments after a reasonable operational period. Retention policies may be updated later without guaranteeing immediate deletion.",
        ],
      },
      comparisonRequests: {
        title: "Comparison Requests",
        paragraphs: [
          "Comparison requests are used to operate the platform's core feature and display responses side by side.",
          "Prompts may be sent to external AI providers to generate responses according to platform settings.",
        ],
      },
      analytics: {
        title: "Usage Analytics",
        paragraphs: [
          "We may use aggregated usage data to understand platform performance and improve it, such as the number of comparisons and success or failure rates.",
          "When enabled through deployment settings, we may use Google Analytics (with partial IP masking when configured) and/or Microsoft Clarity to measure diagnostic usage and improve the interface experience.",
          "These tools may set cookies or similar technologies and are subject to their providers' privacy policies.",
          "We do not aim to track individual users for advertising purposes outside the scope of operating the service.",
        ],
      },
      cookies: {
        title: "Cookies",
        paragraphs: [
          "The platform may use cookies or similar technologies for administrative sessions, security, and experience stability.",
          "When analytics tools are enabled, additional cookies from Google or Microsoft may be used as described above.",
          "You can control cookies through your browser settings, though disabling them may affect some functionality.",
        ],
      },
      userRights: {
        title: "Your Rights and Privacy Requests",
        paragraphs: [
          "Depending on your location and local laws, you may have the right to request access to, correction of, or deletion of your data within what the operational infrastructure allows.",
          "ArabArenaAI does not claim GDPR certification or formal compliance. We handle requests in good faith according to current operational capacity.",
        ],
        items: [
          "Request access to data associated with your use when possible.",
          "Request correction of inaccurate information if it is stored and can be linked to you.",
          "Request deletion of a comparison, vote, or attachment linked to you when technically possible.",
          "Contact privacy@arabarenaai.com for any privacy request.",
        ],
      },
      thirdParty: {
        title: "External AI Providers",
        paragraphs: [
          "ArabArenaAI relies on external providers to generate responses. Data processing by those providers is subject to their own policies.",
          "ArabArenaAI is an independent platform and is not affiliated with any AI provider featured on the site.",
        ],
        items: [
          "OpenAI",
          "Anthropic",
          "Google",
          "xAI",
          "DeepSeek",
          "Qwen / Alibaba",
          "ALLaM / IBM / SDAIA / HUMAIN",
          "Microsoft (when optional analytics services are used)",
        ],
      },
      userResponsibilities: {
        title: "User Responsibilities",
        items: [
          "Do not submit sensitive or personal data you do not wish to share within prompts.",
          "Ensure that submitted content does not violate applicable laws or the rights of others.",
          "Use the platform responsibly and within acceptable use limits.",
        ],
      },
      contact: {
        title: "Contact",
        paragraphs: [
          "For privacy-related inquiries, you can reach us at privacy@arabarenaai.com or through the Contact Us page.",
        ],
      },
      retention: {
        title: "Data Retention",
        paragraphs: [
          "Comparisons and votes: stored to operate features and display community signals for as long as operationally necessary.",
          "Attachments: we aim to delete them after a limited period (operational target: 90 days or less) unless security or operations require otherwise.",
          "Technical logs: may be retained for a shorter period for security and troubleshooting.",
          "Retention periods may be updated without prior notice within reasonable operational update limits.",
        ],
      },
    },
  },
  terms: {
    title: "Terms of Use",
    subtitle: "Last updated: June 2026",
    intro:
      "By using ArabArenaAI, you agree to these terms. If you do not agree, please do not use the platform.",
    sections: {
      acceptableUse: {
        title: "Acceptable Use",
        items: [
          "Use the platform to compare responses, review outputs, and vote in a lawful and responsible manner.",
          "Do not attempt to disrupt, compromise, or misuse the service or its APIs.",
          "Do not submit offensive, unlawful, or intentionally misleading content.",
        ],
      },
      userContent: {
        title: "Content You Submit",
        paragraphs: [
          "You are responsible for the prompts and attachments (images, PDFs) you submit through the platform.",
          "By submitting content, you confirm that you have the right to share it and that it does not violate laws or the rights of others.",
        ],
        items: [
          "Unlawful content, incitement to violence, or harassment is prohibited.",
          "Identity impersonation, fraud, or distribution of malware is prohibited.",
          "Infringement of intellectual property or privacy rights is prohibited.",
          "Submitting sensitive data with no reason to include it in a comparison is prohibited.",
        ],
      },
      independence: {
        title: "Platform Independence and Trademarks",
        paragraphs: [
          "ArabArenaAI is an independent platform and is not affiliated with OpenAI, Anthropic, Google, xAI, DeepSeek, Qwen, IBM, SDAIA, HUMAIN, Alibaba, Microsoft, or any other provider.",
          "Displaying a model or provider name on the platform does not imply a partnership, sponsorship, or official endorsement.",
          "All trademarks and product names belong to their respective owners.",
        ],
      },
      noAccuracyGuarantee: {
        title: "No Guarantee of AI Accuracy",
        paragraphs: [
          "Model responses are generated automatically and may be inaccurate, incomplete, biased, or outdated.",
          "ArabArenaAI helps you compare responses but does not guarantee the accuracy, completeness, or suitability of any answer for your decision.",
        ],
      },
      notProfessionalAdvice: {
        title: "Not Professional Advice",
        paragraphs: [
          "Model responses do not constitute legal, medical, financial, or professional advice.",
          "Consult a qualified professional before making decisions based on sensitive or high-risk information.",
        ],
      },
      availability: {
        title: "Service Availability",
        paragraphs: [
          "We strive to provide a stable service, but outages, maintenance, or temporary limits may occur.",
          "We do not guarantee uninterrupted availability of the platform at all times.",
        ],
      },
      thirdPartyDependency: {
        title: "Reliance on External Providers",
        paragraphs: [
          "Comparisons depend on external AI providers. Results may be affected by their availability, policies, or limits.",
          "ArabArenaAI is not responsible for changes or outages at third-party providers.",
        ],
      },
      liability: {
        title: "Limitation of Liability",
        paragraphs: [
          "The platform is provided \"as is\" within the limits of the current operational infrastructure.",
          "ArabArenaAI is not liable for decisions or direct or indirect damages resulting from reliance on model responses.",
        ],
      },
      intellectualProperty: {
        title: "Intellectual Property",
        paragraphs: [
          "The ArabArenaAI brand and the platform's operational content are protected within applicable limits.",
          "Using the platform does not grant you rights to external providers' trademarks or services.",
          "All trademarks, model names, and services displayed belong to their respective owners.",
        ],
      },
      userResponsibilities: {
        title: "User Responsibilities",
        items: [
          "Evaluate responses carefully before making any decision that depends on them.",
          "Comply with local and international laws when using the platform.",
          "Report misuse or operational issues through the contact page.",
        ],
      },
    },
  },
  contact: {
    title: "Contact Us",
    subtitle: "We welcome general and business inquiries",
    emailSection: {
      title: "Email Channels",
      note: "Reach us directly through any of the official email addresses below.",
    },
    beta: {
      title: "ArabArenaAI Beta",
      subtitle: "We are continuously improving the platform and refining the experience.",
    },
    social: {
      title: "Follow us on X",
      description: "Latest updates and announcements from ArabArenaAI.",
      xHandle: "@ArabArenaAI",
      xUrl: "https://x.com/ArabArenaAI",
    },
    emails: {
      hello: {
        label: "General",
        address: "hello@arabarenaai.com",
        description: "For general correspondence and platform introductions.",
      },
      support: {
        label: "Support",
        address: "support@arabarenaai.com",
        description: "For technical help and platform usage issues.",
      },
      privacy: {
        label: "Privacy",
        address: "privacy@arabarenaai.com",
        description: "For data and privacy inquiries.",
      },
      contact: {
        label: "Contact",
        address: "contact@arabarenaai.com",
        description: "For general and business inquiries.",
      },
    },
    general: {
      title: "General Inquiries",
      body: "For questions about using the platform, comparisons, or user experience.",
    },
    business: {
      title: "Business Inquiries",
      body: "For collaboration, partnerships, or suggestions related to ArabArenaAI development.",
    },
    form: {
      title: "Contact Form",
      nameLabel: "Name",
      emailLabel: "Email",
      inquiryTypeLabel: "Inquiry type",
      generalInquiry: "General inquiry",
      businessInquiry: "Business inquiry",
      messageLabel: "Message",
      submit: "Send message",
      helper: "Your message will be sent via your email client to the appropriate ArabArenaAI team.",
      successNotice:
        "Thank you for contacting ArabArenaAI. Your message is ready — complete sending from your email client.",
    },
  },
  seo: {
    home: {
      title: "Compare AI Models in Arabic",
      description:
        "Compare GPT-4o, Claude, Gemini, DeepSeek, and Grok responses in Arabic in one place with ArabArenaAI.",
    },
    about: {
      title: "About ArabArenaAI",
      description:
        "Learn about ArabArenaAI's vision, transparent comparison methodology, and community preference signals in Arabic.",
    },
    compare: {
      title: "Start a New Comparison",
      description:
        "Enter a prompt in Arabic and choose models to compare responses side by side on ArabArenaAI.",
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "Read ArabArenaAI's privacy policy and how we handle data and comparison requests.",
    },
    terms: {
      title: "Terms of Use",
      description: "Read ArabArenaAI's terms of use, acceptable use, and liability limits.",
    },
    contact: {
      title: "Contact Us",
      description: "Contact ArabArenaAI for general and business inquiries.",
    },
    insights: {
      title: "Community Preference Insights",
      description: "Explore community preference signals for Arabic AI models on ArabArenaAI.",
    },
    models: {
      title: "Available Models",
      description: "Browse AI models available for Arabic comparison on ArabArenaAI.",
    },
  },
  maintenance: {
    title: "Platform Maintenance",
    defaultMessage: "We are performing maintenance and improvements. We will be back soon.",
    defaultMessageEn: "We are performing maintenance and improvements. We will be back soon.",
    defaultReturn: "Soon",
    estimatedReturn: "Expected return",
  },
  admin: {
    title: "Admin Dashboard",
    loginTitle: "Admin Login",
    passwordLabel: "Password",
    login: "Sign in",
    logout: "Sign out",
    refresh: "Refresh data",
    notConfigured: "Admin dashboard is not configured.",
    invalidCredentials: "Invalid login credentials.",
    unauthorized: "You must sign in first",
    notAvailable: "Not available",
    noDataYet: "No data yet",
    loadFailed: "Could not load data",
    sectionError: "Could not display this section.",
    sections: {
      modelStats: "Model Statistics",
    },
    cards: {
      totalModels: "Total models",
      enabledModels: "Enabled models",
      selectableModels: "Selectable models",
      placeholderModels: "Coming soon models",
      unavailableProviderModels: "Models with unavailable provider",
      modelsByProvider: "Models by provider",
      providerHealth: "Provider health",
      recentComparisons: "Comparison statistics",
      spendingLimits: "Spending limits",
      deploymentStatus: "Deployment status",
      providerErrors: "Provider errors (since startup)",
      usageInsights: "Usage signals",
      mostSelectedModels: "Most selected",
      mostUsedProviders: "Most used (providers)",
      votePreferences: "User preferences",
      totalVotes: "Total votes",
      providerSuccessRate: "Success rate by provider",
      avgResponseTime: "Average response time",
      executionErrors: "Recent execution errors",
      database: "Database",
      uploads: "Uploads",
    },
    deployment: {
      status: "Status",
      version: "Version",
      uptime: "Uptime",
      uptimeUnit: "min",
      database: "Database",
    },
    uploads: {
      total: "Total",
      today: "Today",
      images: "Images",
      pdfs: "PDF",
    },
    usage: {
      onlineNow: "Online now",
      activeSessions15m: "Active sessions (15m)",
      visitorsToday: "Visitors today",
      comparisonsToday: "Comparisons today",
      votesToday: "Votes today",
      uploadsToday: "Uploads today",
      attachmentsToday: "Comparisons with attachments today",
      modelResponsesToday: "Model responses today",
      inputTokensToday: "Input tokens today",
      outputTokensToday: "Output tokens today",
      avgResponseTimeToday: "Avg response time today",
      failedComparisonsToday: "Failed comparisons today",
      mostUsedModelsToday: "Most used models today",
      mostUsedProvidersToday: "Most used providers today",
    },
    systemControls: {
      title: "System Controls",
      maintenanceMode: "Maintenance mode",
      maintenanceHint: "When enabled, visitors see a maintenance page and cannot use the platform.",
      status: "Status",
      on: "ON",
      off: "OFF",
      loadFailed: "Could not load maintenance settings",
      saveFailed: "Could not save maintenance settings",
    },
    systemOverview: {
      title: "System Overview",
      applicationVersion: "Application version",
      gitCommit: "Latest Git commit",
      lastDeploymentTime: "Last deployment time",
      environment: "Environment",
      apiBaseUrl: "API URL",
      refreshedAt: "Last refreshed",
      notAvailable: "Not available",
    },
    providerStatus: {
      title: "Provider Status",
      healthy: "Healthy",
      unavailable: "Unavailable",
      degraded: "Degraded",
      unknown: "Unknown",
      latency: "Latency",
      ms: "ms",
    },
    recentActivity: {
      title: "Recent Activity",
      timestamp: "Time",
      activityType: "Activity type",
      status: "Status",
      empty: "No data yet",
    },
    errorMonitoring: {
      title: "Provider Error Monitoring",
      source: "Source",
      errorType: "Error type",
      failures: "Failure count",
      empty: "Not available currently",
      noRecordedErrors: "No recorded errors",
    },
    executionErrors: {
      title: "Recent Execution Errors",
      timestamp: "Time",
      provider: "Provider",
      model: "Model",
      message: "Message",
      errorCode: "Error code",
      requestId: "Request ID",
      empty: "No recorded errors",
      unavailable: "Not available currently",
    },
    comparisons: {
      total: "Total",
      completed: "Completed",
      partial: "Partial",
      failed: "Failed",
      pending: "Pending",
      today: "Today",
      avgResponseTime: "Average response time",
      runtimeStarted: "Since startup (in-memory)",
      started: "Started",
    },
  },
  errors: {
    generic: "An unexpected error occurred",
    network: "Could not reach the server",
    retry: "Try again",
    retryHint: "A temporary issue occurred. You can try again or return to the home page.",
    goHome: "Back to home",
  },
  notFound: {
    title: "Page not found",
    description:
      "The link you requested is unavailable or has moved. Try returning to the home page or starting a new comparison.",
    goHome: "Back to home",
  },
} as const;

export type EnStrings = typeof en;
