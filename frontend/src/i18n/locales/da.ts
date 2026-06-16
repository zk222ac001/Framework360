const da = {
  common: {
    loading: "Indlæser...",
    save: "Gem",
    cancel: "Annuller",
    delete: "Slet",
    edit: "Rediger",
    create: "Opret",
    yes: "Ja",
    no: "Nej",
    error: "Noget gik galt",
    readOnlyAccess: "Du har kun læseadgang.",
    back: "Tilbage",
  },

  navbar: {
    dashboard: "Dashboard",
    vendors: "Leverandører",
    systems: "Systemer",
    processes: "Processer",
    dependencies: "Afhængigheder",
    evidence: "Dokumentation",
    frameworks: "Tilføj framework",
    settings: "Indstillinger",
    logout: "Log ud",
    admin: "Admin",
    continueSetup: "Fortsæt opsætning",
    login: "Log ind",
    requestDemo: "Anmod Prøve",
  },

  admin: {
    admin: "Admin",
    subtitle: "Håndter prøve anmodninger og aktiver brugerer.",
    company: "Firma:",
    activation: "Prøve anmodning aktiveret. Midlertidigt password for",
    country: "Land:",
    jobtitle: "Jobtitel:",
  },

  auth: {
    login: {
      title: "Log ind",
      subtitle: "Log ind for at få adgang til dit compliance-dashboard",
      email: "Email",
      password: "Adgangskode",
      rememberMe: "Husk mig",
      signIn: "Log ind",
      signingIn: "Logger ind...",
      needAccess: "Mangler du adgang?",
      requestDemo: "Anmod om prøve",
      errors: {
        emailRequired: "Email er påkrævet",
        invalidEmail: "Indtast en gyldig emailadresse",
        passwordRequired: "Adgangskode er påkrævet",
        loginFailed: "Login mislykkedes. Prøv igen.",
      },
    },

    changePassword: {
      title: "Skift din adgangskode",
      temporarySubtitle:
        "Du skal skifte din midlertidige adgangskode, før du kan fortsætte.",
      normalSubtitle: "Opdater din adgangskode nedenfor.",
      currentPassword: "Nuværende adgangskode",
      newPassword: "Ny adgangskode",
      confirmNewPassword: "Bekræft ny adgangskode",
      savePassword: "Gem adgangskode",
      saving: "Gemmer...",
      success: "Adgangskoden er ændret.",
      errors: {
        currentRequired: "Nuværende adgangskode er påkrævet",
        newRequired: "Ny adgangskode er påkrævet",
        minLength: "Adgangskoden skal være mindst 8 tegn",
        confirmRequired: "Bekræft venligst din adgangskode",
        passwordsDoNotMatch: "Adgangskoderne matcher ikke",
        changeFailed: "Kunne ikke ændre adgangskoden. Prøv igen.",
      },
    },

    requestDemo: {
      title: "Anmod om prøve",
      subtitle: "Udfyld dine oplysninger, så kontakter vi dig.",
      email: "Email",
      firstName: "Fornavn",
      lastName: "Efternavn",
      companyName: "Virksomhedsnavn",
      jobTitle: "Jobtitel",
      selectJobTitle: "Vælg jobtitel",
      yourJobTitle: "Din jobtitel",
      country: "Land",
      selectCountry: "Vælg et land",
      submit: "Anmod om prøve",
      sending: "Sender anmodning...",
      success: "Din prøveanmodning er sendt.",
      jobTitles: {
        ceo: "CEO",
        cto: "CTO",
        cfo: "CFO",
        ciso: "CISO",
        dpo: "DPO",
        complianceManager: "Compliance manager",
        itManager: "IT manager",
        securityManager: "Sikkerhedsansvarlig",
        legalCounsel: "Juridisk rådgiver",
        other: "Andet",
      },
      countries: {
        denmark: "Danmark",
        sweden: "Sverige",
        germany: "Tyskland",
        netherlands: "Holland",
        france: "Frankrig",
      },
      errors: {
        emailRequired: "Email er påkrævet",
        invalidEmail: "Indtast en gyldig emailadresse",
        companyEmailRequired: "Brug venligst din firma-emailadresse",
        firstNameRequired: "Fornavn er påkrævet",
        lastNameRequired: "Efternavn er påkrævet",
        companyNameRequired: "Virksomhedsnavn er påkrævet",
        jobTitleRequired: "Vælg venligst din jobtitel",
        customJobTitleRequired: "Indtast venligst din jobtitel",
        submitFailed: "Noget gik galt. Prøv igen.",
      },
    },
  },

  onboarding: {
    product: {
      title: "Vælg dit produkt",
      subtitle:
        "Start med en simpel beta-plan. Frameworks vælges, efter virksomhedens sektor er gemt.",
      starterTitle: "Starter Compliance",
      starterLabel: "Demo / Beta",
      starterDescription: "Start med sektorbaseret framework-assessment.",
      confirm: "Bekræft",
    },

    company: {
      title: "Virksomhedsopsætning",
      subtitle:
        "Tilføj virksomhedens oplysninger for at færdiggøre onboarding.",
      companyName: "Virksomhedsnavn",
      cvr: "CVR",
      sector: "Sektor",
      selectSector: "Vælg sektor",
      country: "Land",
      selectCountry: "Vælg et land",
      saving: "Gemmer...",
      complete: "Færdiggør onboarding",
      errors: {
        companyNameRequired: "Virksomhedsnavn er påkrævet",
        sectorRequired: "Sektor er påkrævet",
        saveFailed: "Kunne ikke gemme virksomhedsopsætning.",
      },
      countries: {
        denmark: "Danmark",
        sweden: "Sverige",
        germany: "Tyskland",
        netherlands: "Holland",
        france: "Frankrig",
      },
    },

    scope: {
      title: "Virksomhedens scope",
      subtitle:
        "Svar på nogle få spørgsmål, så vi kan anbefale de mest relevante compliance-frameworks til virksomheden.",
      companySize: "Virksomhedsstørrelse",
      back: "Tilbage",
      continue: "Fortsæt til frameworks",
      saving: "Gemmer...",
      errors: {
        loadFailed: "Kunne ikke hente virksomhedens scope.",
        saveFailed: "Kunne ikke gemme virksomhedens scope.",
      },
      employeeCount: {
        oneToNine: "1-9 ansatte",
        tenToFortyNine: "10-49 ansatte",
        fiftyToTwoFortyNine: "50-249 ansatte",
        twoFiftyPlus: "250+ ansatte",
        unknown: "Ikke sikker endnu",
      },
      questions: {
        processesPersonalData: {
          label: "Behandler persondata",
          helper:
            "Eksempler: kundenavne, emails, medarbejderdata eller brugerkonti.",
        },
        handlesSensitiveData: {
          label: "Håndterer følsomme data",
          helper:
            "Eksempler: sundhedsdata, finansielle data eller fortrolige virksomhedsdata.",
        },
        acceptsCardPayments: {
          label: "Modtager kortbetalinger",
          helper: "Relevant for PCI-DSS-anbefalinger.",
        },
        usesAiSystems: {
          label: "Bruger AI-systemer",
          helper: "Relevant for AI Act og AI governance-anbefalinger.",
        },
        servesFinancialCustomers: {
          label: "Leverer til finansielle kunder",
          helper:
            "Relevant hvis jeres kunder er banker, forsikringsselskaber eller finansielle institutioner.",
        },
        isDigitalServiceProvider: {
          label: "Er digital service provider",
          helper:
            "Eksempler: SaaS, cloud, hosting, managed services eller digitale platforme.",
        },
        operatesCriticalInfrastructure: {
          label: "Driver kritisk infrastruktur",
          helper: "Relevant for NIS2 og kontinuitetsrelaterede anbefalinger.",
        },
        hasEuCustomers: {
          label: "Har EU-kunder",
          helper: "Relevant for EU-compliance scope.",
        },
        usesCloudProviders: {
          label: "Bruger cloud-leverandører",
          helper:
            "Eksempler: AWS, Azure, Google Cloud, Microsoft 365 eller lignende.",
        },
        hasCriticalSuppliers: {
          label: "Har kritiske leverandører",
          helper: "Leverandører virksomheden er operationelt afhængig af.",
        },
      },
    },

    frameworks: {
      title: "Vælg frameworks til virksomheden",
      subtitle:
        "Disse frameworks anbefales baseret på virksomhedens sektor, onboarding-svar og registrerede virksomhedssignaler. Du kan justere valget.",
      required: "Påkrævet",
      recommended: "Anbefalet",
      other: "Andet",
      confidence: "Sikkerhed",
      saving: "Gemmer...",
      complete: "Færdiggør onboarding",
      errors: {
        loadFailed: "Kunne ikke hente frameworks.",
        selectOne: "Vælg mindst ét framework.",
        completeFailed: "Kunne ikke færdiggøre onboarding.",
      },
    },
  },

  dashboard: {
    euLawScore: "EU-lovgivning compliance score",
    euLawScoreDescription: "Score for nuværende lovkrav",
    certificateScore: "Frivillige certifikater score",
    certificateScoreDescription:
      "Score for tilføjede certificeringer og standarder",
    frameworks: "Frameworks",
    addFramework: "Tilføj framework",
    noFrameworks: "Ingen frameworks tilføjet endnu",
    noFrameworksDescription:
      "Tilføj dit første framework for at begynde at følge compliance-fremdrift.",
    addFirstFramework: "Tilføj dit første framework",
    completed: "Færdig",
    inProgress: "I gang",
    view: "Se",
    continue: "Fortsæt",
    addNewFramework: "+ Tilføj nyt framework",
    errors: {
      loadFailed: "Noget gik galt",
    },
  },

  frameworksPage: {
    add: {
      title: "Tilføj framework",
      subtitle:
        "Vælg et compliance-framework og start eller fortsæt virksomhedens assessment.",
      requiredByLaw: "Påkrævet ved lov",
      relevantForCompany: "Relevant for virksomheden",
      otherFrameworks: "Alle andre frameworks",
      allAdded: "Alle tilgængelige frameworks er allerede tilføjet.",
      startContinue: "Start / fortsæt",
      starting: "Starter...",
      fallbackDescription:
        "Start en compliance self-assessment for dette framework.",
    },

    assessment: {
      assessment: "assessment",
      section: "Sektion",
      of: "af",
      requirements: "Krav",
      gaps: "Mangler",
      actionPlan: "Handlingsplan",
      autosaving: "Gemmer automatisk...",
      saved: "Gemt",
      downloadPdf: "Download PDF",
      sectionProgress: "Sektionens fremdrift",
      showOnlyMissing: "Vis kun manglende / delvise / manglende dokumentation",
      requirement: "Krav",
      noMatchingRequirements: "Ingen krav matcher det nuværende filter.",
      previous: "Forrige",
      saveProgress: "Gem fremdrift",
      saving: "Gemmer...",
      completing: "Færdiggør...",
      complete: "Færdiggør",
      saveNextSection: "Gem og næste sektion",
      nextRequirement: "Næste krav",
      missingAssessment: "Framework assessment kunne ikke indlæses.",
      noGaps: "Ingen mangler fundet for denne assessment.",
      missingEvidence: "Manglende dokumentation",
      complianceGap: "Compliance-mangel",
      noActions: "Ingen handlingspunkter fundet endnu.",
      recommendedAction: "Anbefalet handling",
      risk: "Risiko:",
      evidenceNeeded: "Dokumentation nødvendig:",
      errors: {
        missingCode: "Manglende framework-kode.",
        createAnswerFailed:
          "Kunne ikke oprette svar før upload af dokumentation.",
      },
    },

    requirement: {
      yes: "Ja, vi overholder kravet",
      partial: "Delvist",
      no: "Nej",
      notApplicable: "Ikke relevant",
      optionalNote: "Valgfri note",
      evidence: "Dokumentation",
      evidenceAdded: "Dokumentation tilføjet",
      missingEvidence: "Manglende dokumentation",
      noEvidence: "Ingen dokumentation uploadet endnu.",
      evidenceFile: "Dokumentationsfil",
      uploadEvidence: "Upload dokumentation",
      uploading: "Uploader...",
      howToFix: "Sådan løses det",
      exampleEvidence: "Eksempel på dokumentation",
      riskIfMissing: "Risiko hvis det mangler",
      errors: {
        uploadFailed: "Kunne ikke uploade dokumentation",
        deleteFailed: "Kunne ikke slette dokumentation",
      },
    },
  },

  vendors: {
    title: "Leverandører",
    subtitle:
      "Registrer vigtige leverandører og følg DPA, SLA og sikkerhedsreview.",
    addVendor: "Tilføj leverandør",
    readOnly: "Du har kun læseadgang til leverandører.",
    empty:
      "Ingen leverandører er oprettet endnu. Tilføj din første leverandør.",
    create: "Opret leverandør",
    edit: "Rediger leverandør",
    vendorName: "Leverandørnavn",
    website: "Hjemmeside",
    contactEmail: "Kontakt-email",
    country: "Land",
    criticality: "Kritikalitet",
    reviewDate: "Review-dato",
    description: "Beskrivelse",
    criticalSupplier: "Kritisk leverandør",
    hasDpa: "Har DPA",
    hasSla: "Har SLA",
    hasSecurityReview: "Har sikkerhedsreview",
    noWebsite: "Ingen hjemmeside",
    noContactEmail: "Ingen kontakt-email",
    noCountry: "Intet land",
    noReviewDate: "Ingen review-dato",
    deleteConfirm: 'Slet leverandør "{{name}}"? Dette kan ikke fortrydes.',
    errors: {
      nameRequired: "Leverandørnavn er påkrævet.",
    },
  },

  systems: {
    title: "Systemer",
    subtitle:
      "Registrer IT-systemer og følg sikkerhed, kontinuitet og compliance.",
    addSystem: "Tilføj system",
    readOnly: "Du har kun læseadgang til systemer.",
    empty: "Ingen systemer er oprettet endnu. Tilføj dit første system.",
    create: "Opret system",
    edit: "Rediger system",
    systemName: "Systemnavn",
    systemType: "Systemtype",
    status: "Status",
    criticality: "Kritikalitet",
    ownerDepartment: "Ansvarlig afdeling",
    description: "Beskrivelse",
    vendor: "Leverandør",
    noVendor: "Ingen leverandør",
    containsPersonalData: "Indeholder persondata",
    containsSensitiveData: "Indeholder følsomme data",
    internetExposed: "Eksponeret mod internettet",
    mfaEnabled: "MFA aktiveret",
    backupEnabled: "Backup aktiveret",
    loggingEnabled: "Logging aktiveret",
    monitoringEnabled: "Overvågning aktiveret",
    rtoMinutes: "RTO i minutter",
    rpoMinutes: "RPO i minutter",
    deleteConfirm: 'Slet system "{{name}}"? Dette kan ikke fortrydes.',
    errors: {
      nameRequired: "Systemnavn er påkrævet.",
    },
  },

  processes: {
    title: "Forretningsprocesser",
    subtitle: "Registrer vigtige forretningsprocesser og kontinuitetskrav.",
    addProcess: "Tilføj proces",
    readOnly: "Du har kun læseadgang til forretningsprocesser.",
    empty:
      "Ingen forretningsprocesser er oprettet endnu. Tilføj din første proces.",
    create: "Opret forretningsproces",
    edit: "Rediger forretningsproces",
    processName: "Procesnavn",
    ownerDepartment: "Ansvarlig afdeling",
    criticality: "Kritikalitet",
    maxTolerableDowntimeMinutes: "Maks. tolereret nedetid i minutter",
    manualWorkaroundAvailable: "Manuel workaround tilgængelig",
    description: "Beskrivelse",
    notSet: "Ikke angivet",
    deleteConfirm:
      'Slet forretningsprocessen "{{name}}"? Dette kan ikke fortrydes.',
    errors: {
      nameRequired: "Procesnavn er påkrævet.",
    },
  },

  dependencies: {
    title: "Afhængigheder",
    subtitle:
      "Kortlæg relationer mellem systemer, leverandører og forretningsprocesser.",
    addDependency: "Tilføj afhængighed",
    readOnly: "Du har kun læseadgang til afhængigheder.",
    empty: "Ingen afhængigheder er oprettet endnu.",
    create: "Opret afhængighed",
    edit: "Rediger afhængighed",
    sourceType: "Kildetype",
    source: "Kilde",
    targetType: "Måltype",
    target: "Mål",
    dependencyType: "Afhængighedstype",
    failureImpact: "Konsekvens ved fejl",
    criticalDependency: "Kritisk afhængighed",
    deleteConfirm: "Slet denne afhængighed? Dette kan ikke fortrydes.",
    errors: {
      sourceAndTargetRequired: "Kilde og mål er påkrævet.",
    },
  },

  evidence: {
    title: "Dokumentation",
    subtitle:
      "Se al uploadet compliance-dokumentation på tværs af frameworks, sektioner og krav.",
    empty:
      "Ingen dokumentation er uploadet endnu. Dokumentation uploadet inde i framework-assessments vises her.",
    uploadedBy: "Uploadet af",
    openFile: "Åbn fil",
    download: "Download",
    requirement: "Krav",
    description: "Beskrivelse",
    evidenceFile: "Dokumentationsfil",
    unknownSize: "Ukendt størrelse",
    unknownUser: "Ukendt bruger",
  },

  settings: {
    title: "Indstillinger",
    subtitle: "Administrer din profil, email og virksomhedsoplysninger.",

    profile: "Profil",
    email: "Email",
    password: "Adgangskode",
    company: "Virksomhed",

    firstName: "Fornavn",
    lastName: "Efternavn",

    currentEmail: "Nuværende email",
    newEmail: "Ny email",
    confirmNewEmail: "Bekræft ny email",

    currentPassword: "Nuværende adgangskode",

    changeEmail: "Skift email",
    changePassword: "Skift adgangskode",

    saveProfile: "Gem profil",
    saveCompany: "Gem virksomhed",

    companyName: "Virksomhedsnavn",
    cvr: "CVR",
    country: "Land",
    sector: "Sektor",

    profileUpdated: "Profil opdateret.",
    companyUpdated: "Virksomhedsoplysninger opdateret.",
    emailUpdated: "Email opdateret.",

    passwordSubtitle: "Opdater din adgangskode.",
    emailSubtitle:
      "Bekræft din nye email og indtast din nuværende adgangskode.",

    companyReadOnly:
      "Din rolle kan se virksomhedsoplysninger, men kun admins kan redigere dem.",

    unknownCompanyId: "Ukendt",

    errors: {
      newEmailRequired: "Indtast venligst en ny email.",
      emailsDoNotMatch: "Emailfelterne matcher ikke.",
      currentPasswordRequired: "Indtast venligst din nuværende adgangskode.",
    },
  },
};

export default da;
