import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getApprovals, updateApproval } from "../../api/approvals";
import type { ApprovalDecision, ApprovalItem, ApprovalStatus } from "../../types/approvals";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function statusColor(status: ApprovalStatus) {
  if (status === "APPROVED") return "success";
  if (status === "IN_REVIEW") return "warning";
  return "primary";
}

function priorityColor(priority: string) {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "primary";
}

function WorkflowMetric({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 0 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function ApprovalQueue({ items, onDecision }: { items: ApprovalItem[]; onDecision: (id: number, decision: ApprovalDecision) => void }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6">Approval queue</Typography>
          <Typography variant="body2" color="text.secondary">Review remediation items and persist decisions to the audit log.</Typography>
        </Box>
        <Chip label={`${items.filter((item) => item.status === "PENDING").length} pending`} color="primary" />
      </Stack>

      <Stack spacing={1.5}>
        {!items.length && <Typography variant="body2" color="text.secondary">No approval items yet.</Typography>}
        {items.map((item) => (
          <Box key={item.id} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip label={item.priority} size="small" color={priorityColor(item.priority)} />
                  <Chip label={item.status.replace("_", " ")} size="small" color={statusColor(item.status)} />
                  {item.framework && <Typography variant="caption" color="text.secondary">{item.framework}</Typography>}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{item.title}</Typography>
                {item.requirement && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Requirement: {item.requirement}</Typography>}
                <Typography variant="caption" color="text.secondary">Owner: {item.owner} · Reviewer: {item.reviewer}</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="small" variant="outlined" onClick={() => onDecision(item.id, "REQUEST_CHANGES")}>Request changes</Button>
                <Button size="small" variant="outlined" onClick={() => onDecision(item.id, "REVIEW")}>Review</Button>
                <Button size="small" variant="contained" onClick={() => onDecision(item.id, "APPROVE")}>Approve</Button>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function OwnershipModel({ items }: { items: ApprovalItem[] }) {
  const owners = useMemo(() => {
    const map = new Map<string, { total: number; high: number; approved: number }>();
    for (const item of items) {
      const current = map.get(item.owner) || { total: 0, high: 0, approved: 0 };
      current.total += 1;
      if (item.priority === "HIGH") current.high += 1;
      if (item.status === "APPROVED") current.approved += 1;
      map.set(item.owner, current);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Typography variant="h6" gutterBottom>Ownership model</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>A practical ownership map derived from remediation responsibility.</Typography>
      <Stack spacing={1.5}>
        {!owners.length && <Typography variant="body2" color="text.secondary">No owners assigned yet.</Typography>}
        {owners.map(([owner, stats]) => (
          <Box key={owner} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{owner}</Typography>
                <Typography variant="caption" color="text.secondary">{stats.total} assigned items</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${stats.high} high`} size="small" color={stats.high ? "error" : "default"} />
                <Chip label={`${stats.approved} approved`} size="small" color="success" />
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export default function WorkflowApprovalsApiPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadApprovals() {
    const data = await getApprovals();
    setItems(data.approvals);
  }

  useEffect(() => {
    let isMounted = true;
    getApprovals()
      .then((data) => { if (isMounted) setItems(data.approvals); })
      .catch((err) => { if (isMounted) setError(getErrorMessage(err)); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  async function handleDecision(id: number, decision: ApprovalDecision) {
    setIsSaving(true);
    setError(null);
    try {
      await updateApproval(id, decision);
      await loadApprovals();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  const pending = items.filter((item) => item.status === "PENDING").length;
  const approved = items.filter((item) => item.status === "APPROVED").length;
  const inReview = items.filter((item) => item.status === "IN_REVIEW").length;
  const high = items.filter((item) => item.priority === "HIGH").length;

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {isSaving && <Alert severity="info" sx={{ mb: 3 }}>Saving workflow decision...</Alert>}

      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37,99,235,.20), transparent 22rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="Workflow governance" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Workflow & approvals</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>Review remediation, request changes, approve evidence-backed controls and keep ownership visible across the compliance program.</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
        <WorkflowMetric label="Pending" value={pending} helper="Items waiting for reviewer decision." />
        <WorkflowMetric label="In review" value={inReview} helper="Items actively being reviewed." />
        <WorkflowMetric label="Approved" value={approved} helper="Items accepted by reviewers." />
        <WorkflowMetric label="High priority" value={high} helper="High-risk workflow items." />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr .65fr" }, gap: 3 }}>
        <ApprovalQueue items={items} onDecision={handleDecision} />
        <OwnershipModel items={items} />
      </Box>
    </Box>
  );
}
