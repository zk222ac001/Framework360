import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Section = {
  title: string;
  body: string;
};

function LegalPage({
  label,
  title,
  updated,
  intro,
  sections,
}: {
  label: string;
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 10 }, maxWidth: 980, mx: "auto" }}>
      <Stack spacing={2.5} sx={{ mb: 5 }}>
        <Chip label={label} color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 58 }, lineHeight: 1 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">Last updated: {updated}</Typography>
        <Typography variant="h6" color="text.secondary">{intro}</Typography>
      </Stack>

      <Stack spacing={2.5}>
        {sections.map((section) => (
          <Paper key={section.title} sx={{ p: 3, borderRadius: 5 }}>
            <Typography variant="h5" gutterBottom>{section.title}</Typography>
            <Typography color="text.secondary">{section.body}</Typography>
          </Paper>
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        These terms are a practical starting point and should be reviewed by qualified legal counsel before broad commercial launch.
      </Typography>
    </Box>
  );
}

export function TermsPage() {
  return (
    <LegalPage
      label="Terms"
      title="Terms of Service"
      updated="July 27, 2026"
      intro="These terms describe the baseline conditions for using Framework360 during private beta and commercial evaluation."
      sections={[
        {
          title: "Service Use",
          body: "Customers may use Framework360 to manage compliance workspaces, frameworks, evidence, vendors, systems, reports, and related workflows. Customers are responsible for the accuracy of information entered into the platform.",
        },
        {
          title: "Compliance Responsibility",
          body: "Framework360 provides workflow and documentation support. It does not provide legal, audit, certification, or regulatory advice, and use of the service does not guarantee compliance or certification.",
        },
        {
          title: "Accounts and Access",
          body: "Customers must protect account credentials, assign appropriate user roles, and promptly remove users who no longer need access.",
        },
        {
          title: "Payment and Subscription",
          body: "Paid access is governed by the selected subscription plan, checkout terms, and any signed order form or agreement between the parties.",
        },
        {
          title: "Availability and Changes",
          body: "The service may change as the product evolves. Planned maintenance and material service changes should be communicated to active customers where practical.",
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      label="Privacy"
      title="Privacy Policy"
      updated="July 27, 2026"
      intro="This policy summarizes how Framework360 expects to handle personal data in the application and related customer communication."
      sections={[
        {
          title: "Data We Process",
          body: "Framework360 may process account details, company profile data, compliance records, uploaded evidence metadata, audit logs, support messages, and billing-related identifiers.",
        },
        {
          title: "Purpose",
          body: "Data is processed to provide the service, authenticate users, maintain tenant separation, operate subscriptions, send service emails, protect the platform, and support customer requests.",
        },
        {
          title: "Customer Content",
          body: "Customers control the evidence, vendors, systems, tasks, and compliance content they upload or create. Customers should avoid uploading unnecessary personal or sensitive data.",
        },
        {
          title: "Processors",
          body: "The production service may use hosting, database, object storage, email, analytics, payment, logging, and security providers to operate the platform.",
        },
        {
          title: "Rights and Requests",
          body: "Users can contact the service operator to request access, correction, deletion, export, or other privacy support where applicable law provides those rights.",
        },
      ]}
    />
  );
}

export function DpaPage() {
  return (
    <LegalPage
      label="DPA"
      title="Data Processing Addendum"
      updated="July 27, 2026"
      intro="This page outlines the intended data processing arrangement for customers using Framework360 with organizational compliance data."
      sections={[
        {
          title: "Roles",
          body: "For customer workspace content, the customer is generally the controller and Framework360 acts as processor, unless a separate agreement says otherwise.",
        },
        {
          title: "Processing Instructions",
          body: "Framework360 processes customer content only to provide, secure, maintain, and support the service, or as otherwise instructed by the customer.",
        },
        {
          title: "Security Measures",
          body: "The service should use access controls, tenant isolation, audit logging, encrypted transport, managed database security, object storage controls, backups, and operational monitoring.",
        },
        {
          title: "Sub-processors",
          body: "Sub-processors may include hosting, database, object storage, email, payment, analytics, logging, and support providers required to run the service.",
        },
        {
          title: "Deletion and Return",
          body: "Upon termination, customer content should be returned or deleted according to the customer agreement, technical limits, and backup retention procedures.",
        },
      ]}
    />
  );
}
