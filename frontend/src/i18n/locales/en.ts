const en = {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    yes: "Yes",
    no: "No",
    error: "Something went wrong",
    readOnlyAccess: "You have read-only access.",
    back: "Back",
  },

  navbar: {
    dashboard: "Dashboard",
    vendors: "Vendors",
    systems: "Systems",
    processes: "Processes",
    dependencies: "Dependencies",
    evidence: "Evidence",
    frameworks: "Add Framework",
    settings: "Settings",
    logout: "Logout",
    admin: "Admin",
    continueSetup: "Continue setup",
    login: "Log in",
    requestDemo: "Request Demo",
  },

  admin: {
    admin: "Admin",
    subtitle: "Manage incoming demo requests and activate users.",
    company: "Company:",
    activation: "Demo request activated. Temporary password for",
    country: "Country:",
    jobtitle: "Job title:",
  },

  auth: {
    login: {
      title: "Login",
      subtitle: "Sign in to access your compliance dashboard",
      email: "Email",
      password: "Password",
      rememberMe: "Remember me",
      signIn: "Sign In",
      signingIn: "Signing in...",
      needAccess: "Need access first?",
      requestDemo: "Request a demo",
      errors: {
        emailRequired: "Email is required",
        invalidEmail: "Please enter a valid email address",
        passwordRequired: "Password is required",
        loginFailed: "Login failed. Please try again.",
      },
    },

    changePassword: {
      title: "Change your password",
      temporarySubtitle:
        "You must change your temporary password before continuing.",
      normalSubtitle: "Update your password below.",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      savePassword: "Save password",
      saving: "Saving...",
      success: "Password changed successfully.",
      errors: {
        currentRequired: "Current password is required",
        newRequired: "New password is required",
        minLength: "Password must be at least 8 characters",
        confirmRequired: "Please confirm your password",
        passwordsDoNotMatch: "Passwords do not match",
        changeFailed: "Could not change password. Please try again.",
      },
    },

    requestDemo: {
      title: "Request a Demo",
      subtitle: "Fill in your details and we will get in touch with you.",
      email: "Email",
      firstName: "First Name",
      lastName: "Last Name",
      companyName: "Company Name",
      jobTitle: "Job title",
      selectJobTitle: "Select job title",
      yourJobTitle: "Your job title",
      country: "Country",
      selectCountry: "Select a country",
      submit: "Request Demo",
      sending: "Sending request...",
      success: "Your demo request has been submitted successfully.",
      jobTitles: {
        ceo: "CEO",
        cto: "CTO",
        cfo: "CFO",
        ciso: "CISO",
        dpo: "DPO",
        complianceManager: "Compliance manager",
        itManager: "IT manager",
        securityManager: "Security manager",
        legalCounsel: "Legal counsel",
        other: "Other",
      },
      countries: {
        denmark: "Denmark",
        sweden: "Sweden",
        germany: "Germany",
        netherlands: "Netherlands",
        france: "France",
      },
      errors: {
        emailRequired: "Email is required",
        invalidEmail: "Please enter a valid email address",
        companyEmailRequired: "Please use your company email address",
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        companyNameRequired: "Company name is required",
        jobTitleRequired: "Please select your job title",
        customJobTitleRequired: "Please enter your job title",
        submitFailed: "Something went wrong. Please try again.",
      },
    },
  },

  onboarding: {
    product: {
      title: "Choose your product",
      subtitle:
        "Start with a simple beta plan. Frameworks are selected after your company sector is saved.",
      starterTitle: "Starter Compliance",
      starterLabel: "Demo / Beta",
      starterDescription: "Start with sector-based framework assessment.",
      confirm: "Confirm",
    },

    company: {
      title: "Company onboarding",
      subtitle: "Add your company details to complete onboarding.",
      companyName: "Company name",
      cvr: "CVR",
      sector: "Sector",
      selectSector: "Select sector",
      country: "Country",
      selectCountry: "Select a country",
      saving: "Saving...",
      complete: "Complete onboarding",
      errors: {
        companyNameRequired: "Company name is required",
        sectorRequired: "Sector is required",
        saveFailed: "Could not save company onboarding.",
      },
      countries: {
        denmark: "Denmark",
        sweden: "Sweden",
        germany: "Germany",
        netherlands: "Netherlands",
        france: "France",
      },
    },

    scope: {
      title: "Company scope",
      subtitle:
        "Answer a few questions so we can recommend the most relevant compliance frameworks for your company.",
      companySize: "Company size",
      back: "Back",
      continue: "Continue to frameworks",
      saving: "Saving...",
      errors: {
        loadFailed: "Could not load company scope.",
        saveFailed: "Could not save company scope.",
      },
      employeeCount: {
        oneToNine: "1-9 employees",
        tenToFortyNine: "10-49 employees",
        fiftyToTwoFortyNine: "50-249 employees",
        twoFiftyPlus: "250+ employees",
        unknown: "Not sure yet",
      },
      questions: {
        processesPersonalData: {
          label: "Processes personal data",
          helper:
            "Examples: customer names, emails, employee data or user accounts.",
        },
        handlesSensitiveData: {
          label: "Handles sensitive data",
          helper:
            "Examples: health data, financial data or confidential business data.",
        },
        acceptsCardPayments: {
          label: "Accepts card payments",
          helper: "Relevant for PCI-DSS recommendations.",
        },
        usesAiSystems: {
          label: "Uses AI systems",
          helper: "Relevant for AI Act and AI governance recommendations.",
        },
        servesFinancialCustomers: {
          label: "Serves financial customers",
          helper:
            "Relevant if your customers are banks, insurers or financial institutions.",
        },
        isDigitalServiceProvider: {
          label: "Is a digital service provider",
          helper:
            "Examples: SaaS, cloud, hosting, managed services or digital platforms.",
        },
        operatesCriticalInfrastructure: {
          label: "Operates critical infrastructure",
          helper: "Relevant for NIS2 and continuity-related recommendations.",
        },
        hasEuCustomers: {
          label: "Has EU customers",
          helper: "Relevant for EU compliance scope.",
        },
        usesCloudProviders: {
          label: "Uses cloud providers",
          helper:
            "Examples: AWS, Azure, Google Cloud, Microsoft 365 or similar.",
        },
        hasCriticalSuppliers: {
          label: "Has critical suppliers",
          helper: "Suppliers your company depends on operationally.",
        },
      },
    },

    frameworks: {
      title: "Choose frameworks for your company",
      subtitle:
        "These frameworks are recommended based on your company sector, onboarding answers and registered company signals. You can adjust the selection.",
      required: "Required",
      recommended: "Recommended",
      other: "Other",
      confidence: "Confidence",
      saving: "Saving...",
      complete: "Complete onboarding",
      errors: {
        loadFailed: "Could not load frameworks.",
        selectOne: "Select at least one framework.",
        completeFailed: "Could not complete onboarding.",
      },
    },
  },

  dashboard: {
    euLawScore: "EU Law Compliance Score",
    euLawScoreDescription: "Score for current legal requirements followed",
    certificateScore: "Voluntary Certificate Score",
    certificateScoreDescription: "Score for added certifications and standards",
    frameworks: "Frameworks",
    addFramework: "Add Framework",
    noFrameworks: "No frameworks added yet",
    noFrameworksDescription:
      "Add your first framework to start tracking compliance progress.",
    addFirstFramework: "Add your first framework",
    completed: "Completed",
    inProgress: "In progress",
    view: "View",
    continue: "Continue",
    addNewFramework: "+ Add new framework",
    errors: {
      loadFailed: "Something went wrong",
    },
  },

  frameworksPage: {
    add: {
      title: "Add Framework",
      subtitle:
        "Choose a compliance framework and start or continue the company assessment.",
      requiredByLaw: "Required by law",
      relevantForCompany: "Relevant for your company",
      otherFrameworks: "All other frameworks",
      allAdded: "All available frameworks are already added.",
      startContinue: "Start / Continue",
      starting: "Starting...",
      fallbackDescription:
        "Start a compliance self-assessment for this framework.",
    },

    assessment: {
      assessment: "assessment",
      section: "Section",
      of: "of",
      requirements: "Requirements",
      gaps: "Gaps",
      actionPlan: "Action plan",
      autosaving: "Autosaving...",
      saved: "Saved",
      downloadPdf: "Download PDF",
      sectionProgress: "Section progress",
      showOnlyMissing: "Show only missing / partial / missing evidence",
      requirement: "Requirement",
      noMatchingRequirements: "No requirements match the current filter.",
      previous: "Previous",
      saveProgress: "Save progress",
      saving: "Saving...",
      completing: "Completing...",
      complete: "Complete",
      saveNextSection: "Save & Next section",
      nextRequirement: "Next requirement",
      missingAssessment: "Framework assessment could not be loaded.",
      noGaps: "No gaps found for this assessment.",
      missingEvidence: "Missing evidence",
      complianceGap: "Compliance gap",
      noActions: "No action plan items returned yet.",
      recommendedAction: "Recommended action",
      risk: "Risk:",
      evidenceNeeded: "Evidence needed:",
      errors: {
        missingCode: "Missing framework code.",
        createAnswerFailed:
          "Could not create answer before uploading evidence.",
      },
    },

    requirement: {
      yes: "Yes, we comply",
      partial: "Partially",
      no: "No",
      notApplicable: "Not applicable",
      optionalNote: "Optional note",
      evidence: "Evidence",
      evidenceAdded: "Evidence added",
      missingEvidence: "Missing evidence",
      noEvidence: "No evidence uploaded yet.",
      evidenceFile: "Evidence file",
      uploadEvidence: "Upload evidence",
      uploading: "Uploading...",
      howToFix: "How to fix",
      exampleEvidence: "Example evidence",
      riskIfMissing: "Risk if missing",
      errors: {
        uploadFailed: "Could not upload evidence",
        deleteFailed: "Could not delete evidence",
      },
    },
  },

  vendors: {
    title: "Vendors",
    subtitle:
      "Register important suppliers and track DPA, SLA and security review status.",
    addVendor: "Add vendor",
    readOnly: "You have read-only access to vendors.",
    empty: "No vendors have been created yet. Add your first vendor.",
    create: "Create vendor",
    edit: "Edit vendor",
    vendorName: "Vendor name",
    website: "Website",
    contactEmail: "Contact email",
    country: "Country",
    criticality: "Criticality",
    reviewDate: "Review date",
    description: "Description",
    criticalSupplier: "Critical supplier",
    hasDpa: "Has DPA",
    hasSla: "Has SLA",
    hasSecurityReview: "Has security review",
    noWebsite: "No website",
    noContactEmail: "No contact email",
    noCountry: "No country",
    noReviewDate: "No review date",
    deleteConfirm: 'Delete vendor "{{name}}"? This cannot be undone.',
    errors: {
      nameRequired: "Vendor name is required.",
    },
  },

  systems: {
    title: "Systems",
    subtitle:
      "Register IT systems and track security, continuity and compliance.",
    addSystem: "Add system",
    readOnly: "You have read-only access to systems.",
    empty: "No systems have been created yet. Add your first system.",
    create: "Create system",
    edit: "Edit system",
    systemName: "System name",
    systemType: "System type",
    status: "Status",
    criticality: "Criticality",
    ownerDepartment: "Owner department",
    description: "Description",
    vendor: "Vendor",
    noVendor: "No vendor",
    containsPersonalData: "Contains personal data",
    containsSensitiveData: "Contains sensitive data",
    internetExposed: "Internet exposed",
    mfaEnabled: "MFA enabled",
    backupEnabled: "Backup enabled",
    loggingEnabled: "Logging enabled",
    monitoringEnabled: "Monitoring enabled",
    rtoMinutes: "RTO in minutes",
    rpoMinutes: "RPO in minutes",
    deleteConfirm: 'Delete system "{{name}}"? This cannot be undone.',
    errors: {
      nameRequired: "System name is required.",
    },
  },

  processes: {
    title: "Business processes",
    subtitle: "Register key business processes and continuity requirements.",
    addProcess: "Add process",
    readOnly: "You have read-only access to business processes.",
    empty:
      "No business processes have been created yet. Add your first process.",
    create: "Create business process",
    edit: "Edit business process",
    processName: "Process name",
    ownerDepartment: "Owner department",
    criticality: "Criticality",
    maxTolerableDowntimeMinutes: "Max tolerable downtime in minutes",
    manualWorkaroundAvailable: "Manual workaround available",
    description: "Description",
    notSet: "Not set",
    deleteConfirm: 'Delete business process "{{name}}"? This cannot be undone.',
    errors: {
      nameRequired: "Business process name is required.",
    },
  },

  dependencies: {
    title: "Dependencies",
    subtitle:
      "Map relationships between systems, vendors and business processes.",
    addDependency: "Add dependency",
    readOnly: "You have read-only access to dependencies.",
    empty: "No dependencies have been created yet.",
    create: "Create dependency",
    edit: "Edit dependency",
    sourceType: "Source type",
    source: "Source",
    targetType: "Target type",
    target: "Target",
    dependencyType: "Dependency type",
    failureImpact: "Failure impact",
    criticalDependency: "Critical dependency",
    deleteConfirm: "Delete this dependency? This cannot be undone.",
    errors: {
      sourceAndTargetRequired: "Source and target are required.",
    },
  },

  evidence: {
    title: "Evidence overview",
    subtitle:
      "View all uploaded compliance evidence across frameworks, sections and requirements.",
    empty:
      "No evidence has been uploaded yet. Evidence uploaded inside framework assessments will appear here.",
    uploadedBy: "Uploaded by",
    openFile: "Open file",
    download: "Download",
    requirement: "Requirement",
    description: "Description",
    evidenceFile: "Evidence file",
    unknownSize: "Unknown size",
    unknownUser: "Unknown user",
  },

  settings: {
    title: "Settings",
    subtitle: "Manage your profile, email and company information.",

    profile: "Profile",
    email: "Email",
    password: "Password",
    company: "Company",

    firstName: "First name",
    lastName: "Last name",

    currentEmail: "Current email",
    newEmail: "New email",
    confirmNewEmail: "Confirm new email",

    currentPassword: "Current password",

    changeEmail: "Change email",
    changePassword: "Change password",

    saveProfile: "Save profile",
    saveCompany: "Save company",

    companyName: "Company name",
    cvr: "CVR",
    country: "Country",
    sector: "Sector",

    profileUpdated: "Profile updated.",
    companyUpdated: "Company settings updated.",
    emailUpdated: "Email updated.",

    passwordSubtitle: "Update your password.",
    emailSubtitle: "Confirm your new email and enter your current password.",

    companyReadOnly:
      "Your role can view company settings, but only admins can edit them.",

    unknownCompanyId: "Unknown",

    errors: {
      newEmailRequired: "Please enter a new email.",
      emailsDoNotMatch: "The email fields do not match.",
      currentPasswordRequired: "Please enter your current password.",
    },
  },
};

export default en;
