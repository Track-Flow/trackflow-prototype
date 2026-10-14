import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  InputAdornment,
  IconButton,
} from "@mui/material";
import api from "../helpers/api";

const ACCENT = "#5a8dc4";
const PAPER = "#111d2e";
const BORDER = "rgba(148,163,184,0.10)";
const ERROR = "#e5484d";

// ─── Validation (REQ-13 / UC01 A5) ────────────────────────────────────────────
// Spaces alone count as empty. Limits match the inputs' maxLength.
const TITLE_MIN = 3;
const TITLE_MAX = 150;
const DESC_MIN = 3;
const DESC_MAX = 1000;

function validateDetails(form) {
  const errors = {};
  const title = form.ticket_title.trim();
  const desc = form.ticket_description.trim();
  if (!title) errors.ticket_title = "Subject is required.";
  else if (title.length < TITLE_MIN)
    errors.ticket_title = `Subject must be at least ${TITLE_MIN} characters.`;
  if (!desc) errors.ticket_description = "Description is required.";
  else if (desc.length < DESC_MIN)
    errors.ticket_description = `Description must be at least ${DESC_MIN} characters.`;
  return errors;
}

function withoutKey(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}

function RequiredMark() {
  return (
    <Typography component="span" sx={{ color: ERROR, fontWeight: 700, ml: 0.25 }}>
      *
    </Typography>
  );
}

// ─── Category groups & metadata ───────────────────────────────────────────────
// Keyed by lowercase category_name. Hints and keywords are written around the
// incidents people actually report, so search finds e.g. "broken fan".
// Categories not listed here still show, under "More".
const GROUPS = [
  { id: "it", label: "IT & Systems", icon: "devices", color: "#5a8dc4" },
  { id: "facilities", label: "Facilities", icon: "apartment", color: "#c49a4a" },
  { id: "academic", label: "Academic & Research", icon: "school", color: "#5a8f72" },
  { id: "events", label: "Events & Media", icon: "celebration", color: "#7a6fa8" },
  { id: "making", label: "Making", icon: "precision_manufacturing", color: "#4fa3a5" },
  { id: "more", label: "More", icon: "category", color: "#5a8dc4" },
];

const GROUP_BY_ID = {
  ...Object.fromEntries(GROUPS.map((g) => [g.id, g])),
  other: { id: "other", label: "Other", icon: "help", color: "#7a6fa8" },
};

// Shown first, in this order, when they exist.
const POPULAR = ["hardware", "software", "physical", "scripts & book collection"];

const CATEGORY_META = {
  hardware: {
    group: "it",
    icon: "memory",
    hint: "Flickering monitor, laggy keyboard, faulty device",
    keywords: "monitor flicker flickering screen keyboard lag input delay mouse device broken workstation",
  },
  software: {
    group: "it",
    icon: "code",
    hint: "Network drives, accounts, logins, app errors",
    keywords: "network drive mount mounting shared files access account provision new starter login password install app error",
  },
  pc: {
    group: "it",
    icon: "backup",
    hint: "Lab PC backups that failed or need restoring",
    keywords: "backup job failed overnight restore recovery lab pc reimage",
  },
  "internal systems / dev request": {
    group: "it",
    icon: "terminal",
    hint: "Bugs or new features in TrackFlow and lab systems",
    keywords: "trackflow portal website system bug feature dev request",
  },
  physical: {
    group: "facilities",
    icon: "chair",
    hint: "Broken fans, aircon, furniture, room equipment",
    keywords: "fan broken hot heating aircon ac air conditioning cooling server room projector furniture",
  },
  "building & facilities": {
    group: "facilities",
    icon: "domain",
    hint: "Doors, leaks, power and cleaning",
    keywords: "door access key leak water power electricity cleaning",
  },
  "lab & test room setup": {
    group: "facilities",
    icon: "meeting_room",
    hint: "Open or prepare a lab for a test or tutorial",
    keywords: "lab locked open tutorial tut test exam venue room setup ready invigilation",
  },
  "scripts & book collection": {
    group: "academic",
    icon: "menu_book",
    hint: "Collect exam scripts and books",
    keywords: "exam scripts books collect collection textbook",
  },
  "research support": {
    group: "academic",
    icon: "science",
    hint: "Instruments, calibration and research equipment",
    keywords: "instrument calibration calibrate drifted readings experiment research equipment",
  },
  "interest group r&d": {
    group: "academic",
    icon: "groups",
    hint: "Interest group projects and development",
    keywords: "club society interest group project",
  },
  competitions: {
    group: "academic",
    icon: "emoji_events",
    hint: "Competition entries, teams and support",
    keywords: "hackathon olympiad contest competition team",
  },
  "event support": {
    group: "events",
    icon: "celebration",
    hint: "Mics, sound and setup during live events",
    keywords: "mic microphone cutting out sound event live setup venue function",
  },
  "audio / video / media": {
    group: "events",
    icon: "videocam",
    hint: "Recording, cameras and photos",
    keywords: "recording camera video photo media",
  },
  museum: {
    group: "events",
    icon: "museum",
    hint: "Museum visits, tours and exhibits",
    keywords: "museum tour exhibit display",
  },
  "fabrication / 3d printing": {
    group: "making",
    icon: "precision_manufacturing",
    hint: "Jammed or failed 3D prints, laser cutting",
    keywords: "3d printer print jammed stopped failed laser cut cnc fabrication",
  },
  other: {
    group: "other",
    icon: "help",
    hint: "Every department can see it, and the right team will pick it up.",
    keywords: "",
  },
};

function getCategoryMeta(name = "") {
  const m = CATEGORY_META[name.trim().toLowerCase()];
  const groupId = m?.group ?? "more";
  const group = GROUP_BY_ID[groupId] ?? GROUP_BY_ID.more;
  return {
    group: groupId,
    icon: m?.icon ?? "category",
    hint: m?.hint ?? "",
    keywords: m?.keywords ?? "",
    color: group.color,
    bg: `${group.color}1f`,
  };
}

function matchesQuery({ cat, meta }, query) {
  const haystack = [cat.category_name, meta.hint, meta.keywords, cat.department_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query.split(/\s+/).every((term) => haystack.includes(term));
}

function onActivate(fn) {
  return (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ["Category", "Details", "Review"];
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        const color = done ? "#5a8f72" : active ? ACCENT : "#475569";
        const bg = done
          ? "rgba(90,143,114,0.15)"
          : active
            ? "rgba(90,141,196,0.15)"
            : "rgba(71,85,105,0.2)";
        return (
          <Box
            key={label}
            sx={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: bg,
                  border: `1.5px solid ${color}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color,
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 12 }}
                  >
                    check
                  </span>
                ) : (
                  idx
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: active || done ? 600 : 400,
                  color,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 1.5,
                  mx: 1,
                  bgcolor: done ? "#5a8f72" : BORDER,
                  borderRadius: 1,
                  minWidth: 12,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Category tiles ───────────────────────────────────────────────────────────
const TILE_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 1.25,
};

function tileSx(color, active) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    p: 1.5,
    borderRadius: 1.5,
    cursor: "pointer",
    border: `1.5px solid ${active ? color : BORDER}`,
    bgcolor: active ? `${color}1f` : "rgba(255,255,255,0.03)",
    transition: "border-color .15s, background-color .15s",
    outline: "none",
    "&:hover": { border: `1.5px solid ${color}` },
    "&:focus-visible": { boxShadow: `0 0 0 2px ${color}` },
  };
}

function TileIcon({ icon, color }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        bgcolor: `${color}1f`,
        color,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
        {icon}
      </span>
    </Box>
  );
}

function CategoryTile({ cat, meta, active, onSelect }) {
  return (
    <Box
      role="radio"
      aria-checked={active}
      tabIndex={0}
      onClick={() => onSelect(cat)}
      onKeyDown={onActivate(() => onSelect(cat))}
      sx={tileSx(meta.color, active)}
    >
      <TileIcon icon={meta.icon} color={meta.color} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{ fontSize: 13.5, fontWeight: 600, color: "#e3e8f0", lineHeight: 1.3 }}
        >
          {cat.category_name}
        </Typography>
        {meta.hint && (
          <Typography
            sx={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.4, mt: 0.25 }}
          >
            {meta.hint}
          </Typography>
        )}
        {cat.department_name && (
          <Typography sx={{ fontSize: 10.5, color: "#64748b", mt: 0.25 }}>
            → {cat.department_name}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function GroupTile({ group, items, onOpen, hasSelection }) {
  const names = items.map((i) => i.cat.category_name);
  const preview =
    names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`${group.label}: ${names.length} categories`}
      onClick={() => onOpen(group.id)}
      onKeyDown={onActivate(() => onOpen(group.id))}
      sx={tileSx(group.color, hasSelection)}
    >
      <TileIcon icon={group.icon} color={group.color} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{ fontSize: 13.5, fontWeight: 600, color: "#e3e8f0", lineHeight: 1.3 }}
        >
          {group.label}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#64748b", mt: 0.25 }}>
          {preview}
        </Typography>
      </Box>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: "#64748b" }}
        aria-hidden="true"
      >
        chevron_right
      </span>
    </Box>
  );
}

function SectionLabel({ color, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "#94a3b8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

// ─── Step 1: Category (from API) ──────────────────────────────────────────────
// Most-used categories up front, the rest behind groups, search across all.
function StepCategory({ categories, selected, onSelect, error, groupRef }) {
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const q = query.trim().toLowerCase();

  const enriched = categories.map((cat) => ({
    cat,
    meta: getCategoryMeta(cat.category_name),
  }));
  const otherItem = enriched.find((e) => e.meta.group === "other");
  const regular = enriched
    .filter((e) => e.meta.group !== "other")
    .sort((a, b) => a.cat.category_name.localeCompare(b.cat.category_name));

  const popular = POPULAR.map((name) =>
    regular.find((e) => e.cat.category_name.toLowerCase() === name),
  ).filter(Boolean);

  const groups = GROUPS.map((g) => ({
    group: g,
    items: regular.filter((e) => e.meta.group === g.id),
  })).filter((g) => g.items.length > 0);

  const isActive = (cat) => selected?.category_id === cat.category_id;
  const tiles = (items) => (
    <Box sx={TILE_GRID}>
      {items.map(({ cat, meta }) => (
        <CategoryTile
          key={cat.category_id}
          cat={cat}
          meta={meta}
          active={isActive(cat)}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );

  let content;
  if (q) {
    const hits = regular.filter((e) => matchesQuery(e, q));
    content = hits.length ? (
      tiles(hits)
    ) : (
      <Box
        sx={{
          p: 2.5,
          borderRadius: 1.5,
          textAlign: "center",
          border: `1px dashed ${BORDER}`,
        }}
      >
        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
          No category matches “{query.trim()}”. Try other words, or choose Other below.
        </Typography>
      </Box>
    );
  } else if (openGroup) {
    const g = groups.find((x) => x.group.id === openGroup);
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13 }}>
          <Typography
            component="button"
            type="button"
            onClick={() => setOpenGroup(null)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              background: "none",
              border: 0,
              p: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: ACCENT,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            All groups
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#475569" }}>/</Typography>
          <Typography sx={{ fontSize: 13, color: "#e3e8f0" }}>
            {g?.group.label}
          </Typography>
        </Box>
        {g && tiles(g.items)}
      </Box>
    );
  } else {
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        {popular.length > 0 && (
          <Box>
            <SectionLabel color={ACCENT}>Most used</SectionLabel>
            {tiles(popular)}
          </Box>
        )}
        <Box>
          <SectionLabel color="#94a3b8">Or browse by group</SectionLabel>
          <Box sx={TILE_GRID}>
            {groups.map(({ group, items }) => (
              <GroupTile
                key={group.id}
                group={group}
                items={items}
                onOpen={setOpenGroup}
                hasSelection={items.some((i) => isActive(i.cat))}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  const otherActive = otherItem && isActive(otherItem.cat);

  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: 15, md: 17 },
          fontWeight: 700,
          color: "#e3e8f0",
          mb: 0.5,
        }}
      >
        What is this about?<RequiredMark />
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#94a3b8", mb: 2, lineHeight: 1.6 }}>
        Search, pick a common one, or open a group.
      </Typography>

      <TextField
        id="category-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
        placeholder="Try “broken fan”, “exam scripts”, “3D printer”"
        size="small"
        fullWidth
        inputProps={{ "aria-label": "Search categories" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "#64748b" }}
              >
                search
              </span>
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                sx={{ color: "#64748b" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{ mb: 2 }}
      />

      {error && (
        <Typography
          id="category-error"
          role="alert"
          sx={{ fontSize: 12.5, color: ERROR, fontWeight: 600, mb: 1.5 }}
        >
          {error}
        </Typography>
      )}

      <Box
        ref={groupRef}
        tabIndex={-1}
        role="radiogroup"
        aria-label="Category"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "category-error" : undefined}
        sx={{
          outline: "none",
          borderRadius: 1.5,
          ...(error && { boxShadow: `0 0 0 1.5px ${ERROR}`, p: 0.75 }),
        }}
      >
        {content}

        {otherItem && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.25,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: "#7a6fa8" }}
              aria-hidden="true"
            >
              help
            </span>
            {otherActive ? (
              <Typography sx={{ fontSize: 13, color: "#e3e8f0" }}>
                <b>Other</b> selected. Every department can see this ticket.
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
                  Not sure where it fits?
                </Typography>
                <Box
                  role="radio"
                  aria-checked={false}
                  tabIndex={0}
                  onClick={() => onSelect(otherItem.cat)}
                  onKeyDown={onActivate(() => onSelect(otherItem.cat))}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7a6fa8",
                    cursor: "pointer",
                    outline: "none",
                    borderRadius: 0.5,
                    "&:hover": { textDecoration: "underline" },
                    "&:focus-visible": { boxShadow: "0 0 0 2px #7a6fa8" },
                  }}
                >
                  Choose Other
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────
function StepDetails({ form, onChange, file, onFile, errors, titleRef, descRef }) {
  const counter = (val, max) => `${val.length}/${max}`;
  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: 15, md: 17 },
          fontWeight: 700,
          color: "#e3e8f0",
          mb: 0.5,
        }}
      >
        Tell us more
      </Typography>
      <Typography sx={{ fontSize: 12, color: "#94a3b8", mb: 2 }}>
        Fields marked <RequiredMark /> are required.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          id="ticket-title"
          label="Subject"
          required
          placeholder="Short summary, e.g. Projector in MSL 104 not turning on"
          value={form.ticket_title}
          onChange={(e) => onChange("ticket_title", e.target.value)}
          fullWidth
          error={!!errors.ticket_title}
          helperText={errors.ticket_title ?? counter(form.ticket_title, TITLE_MAX)}
          inputRef={titleRef}
          inputProps={{ maxLength: TITLE_MAX }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          id="ticket-description"
          label="Description"
          required
          placeholder="Describe the problem — what happened, where, and when"
          value={form.ticket_description}
          onChange={(e) => onChange("ticket_description", e.target.value)}
          fullWidth
          multiline
          rows={4}
          error={!!errors.ticket_description}
          helperText={errors.ticket_description ?? counter(form.ticket_description, DESC_MAX)}
          inputRef={descRef}
          inputProps={{ maxLength: DESC_MAX }}
          InputLabelProps={{ shrink: true }}
        />
        <Box>
          <input
            type="file"
            id="tf-attach"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
            style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files[0] ?? null)}
          />
          <Button
            component="label"
            htmlFor="tf-attach"
            variant="outlined"
            size="small"
            startIcon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15 }}
              >
                attach_file
              </span>
            }
            sx={{ color: "#94a3b8", borderColor: BORDER, fontSize: 12 }}
          >
            {file ? "Change file" : "Attach a file"}
          </Button>
          <Typography sx={{ fontSize: 10.5, color: "#64748b", mt: 0.5 }}>
            Images, PDF, or text — up to 10MB
          </Typography>
          {file && (
            <Box
              sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.75 }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1,
                  fontSize: 11.5,
                  bgcolor: "rgba(90,141,196,0.1)",
                  color: ACCENT,
                  border: `1px solid ${ACCENT}33`,
                }}
              >
                {file.name}
              </Box>
              <Typography
                onClick={() => onFile(null)}
                sx={{
                  fontSize: 11,
                  color: "#64748b",
                  cursor: "pointer",
                  "&:hover": { color: "#e3e8f0" },
                }}
              >
                Remove
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function StepReview({ form, category, file }) {
  const labelSx = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    mb: 0.5,
  };
  const valueSx = { fontSize: 13.5, color: "#e3e8f0", fontWeight: 500 };
  const isOther = category?.category_name?.toLowerCase() === "other";
  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: 15, md: 17 },
          fontWeight: 700,
          color: "#e3e8f0",
          mb: 2,
        }}
      >
        Review
      </Typography>
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor: "rgba(255,255,255,0.03)",
          border: `1px solid ${BORDER}`,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography sx={labelSx}>Category</Typography>
          <Typography sx={valueSx}>{category?.category_name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: "#94a3b8", mt: 0.25 }}>
            {isOther
              ? "Visible to all departments"
              : category?.department_name
                ? `Goes to ${category.department_name}`
                : ""}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography sx={labelSx}>Subject</Typography>
          <Typography sx={valueSx}>{form.ticket_title}</Typography>
        </Box>
        <Box sx={{ mb: file ? 2 : 0 }}>
          <Typography sx={labelSx}>Description</Typography>
          <Typography
            sx={{
              ...valueSx,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: 13,
            }}
          >
            {form.ticket_description}
          </Typography>
        </Box>
        {file && (
          <Box>
            <Typography sx={labelSx}>Attachment</Typography>
            <Box
              sx={{
                display: "inline-block",
                mt: 0.5,
                px: 1.25,
                py: 0.4,
                borderRadius: 1,
                fontSize: 11.5,
                bgcolor: "rgba(90,141,196,0.1)",
                color: ACCENT,
                border: `1px solid ${ACCENT}33`,
              }}
            >
              {file.name}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Success dialog ───────────────────────────────────────────────────────────
function SuccessDialog({ open, ticketId, onViewTicket, onAnother }) {
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          bgcolor: PAPER,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          p: 1,
          width: { xs: "95vw", sm: 420 },
          maxWidth: "95vw",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", py: 4, px: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(90,143,114,0.12)",
            border: "2px solid #5a8f72",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: "#5a8f72" }}
          >
            check
          </span>
        </Box>
        <Typography
          variant="h5"
          sx={{
            color: "#e3e8f0",
            fontFamily: '"Rubik", sans-serif',
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Ticket submitted!
        </Typography>
        {ticketId && (
          <Typography
            sx={{ fontSize: 12, fontFamily: "monospace", color: ACCENT, mb: 1 }}
          >
            #{ticketId}
          </Typography>
        )}
        <Typography
          sx={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, mb: 3 }}
        >
          Your request has been received. We'll get back to you shortly.
        </Typography>
        {ticketId && (
          <Button
            variant="contained"
            fullWidth
            onClick={onViewTicket}
            sx={{ py: 1.2, fontWeight: 700, mb: 1 }}
          >
            View ticket
          </Button>
        )}
        <Button
          fullWidth
          onClick={() => navigate("/home/tickets")}
          sx={{ py: 0.9, color: "#94a3b8", fontSize: 13, mb: 0.5 }}
        >
          View my tickets
        </Button>
        <Button
          fullWidth
          onClick={onAnother}
          sx={{ py: 0.9, color: "#94a3b8", fontSize: 13 }}
        >
          Submit another
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SubmitTicket() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    ticket_title: "",
    ticket_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newId, setNewId] = useState(null);
  const [success, setSuccess] = useState(false);

  const [dupChecking, setDupChecking] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [dupConfirmed, setDupConfirmed] = useState(false);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setError("Failed to load categories."))
      .finally(() => setCatLoading(false));
  }, []);

  const [fieldErrors, setFieldErrors] = useState({});
  const categoryRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);

  // Typing into a field clears that field's error straight away.
  const handleChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((errs) => (errs[key] ? withoutKey(errs, key) : errs));
  };

  const handleSelectCategory = (cat) => {
    setSelected(cat);
    setFieldErrors((errs) => withoutKey(errs, "category"));
  };

  // Blocked submissions show which field is missing and move focus to it,
  // instead of silently disabling the button (REQ-13 / UC01 A5).
  const validateStep = () => {
    if (step === 1 && !selected) {
      setFieldErrors({ category: "Please choose a category to continue." });
      categoryRef.current?.focus();
      return false;
    }
    if (step === 2 || step === 3) {
      const errs = validateDetails(form);
      if (Object.keys(errs).length > 0) {
        if (step === 3) setStep(2); // send them back to the fields
        setFieldErrors(errs);
        // Wait a tick so step 2's inputs are mounted before focusing.
        setTimeout(() => {
          if (errs.ticket_title) titleRef.current?.focus();
          else descRef.current?.focus();
        }, 0);
        return false;
      }
    }
    setFieldErrors({});
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (!validateStep()) return;
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    if (!dupConfirmed) {
      setDupChecking(true);
      try {
        const res = await api.post("/tickets/check-duplicate", {
          ticket_title: form.ticket_title.trim(),
        });
        if (res.data.duplicates?.length > 0) {
          setDuplicates(res.data.duplicates);
          setDupChecking(false);
          return; // halts here — dialog shown below
        }
      } catch {
        // fail open — don't block submission if check fails
      }
      setDupChecking(false);
    }

    handleSubmit();
  };

  const handleConfirmAnyway = () => {
    setDuplicates([]);
    setDupConfirmed(true);
  };

  const handleCancelDuplicate = () => {
    setDuplicates([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("ticket_title", form.ticket_title.trim());
      payload.append("ticket_description", form.ticket_description.trim());
      payload.append("category_id", selected.category_id);
      if (file) payload.append("file", file);

      const res = await api.post("/tickets", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewId(res.data?.ticket_id ?? res.data?.id ?? null);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnother = () => {
    setStep(1);
    setSelected(null);
    setForm({ ticket_title: "", ticket_description: "" });
    setFile(null);
    setNewId(null);
    setSuccess(false);
    setDuplicates([]);
    setDupConfirmed(false);
    setFieldErrors({});
  };

  return (
    <Box>
      <SuccessDialog
        open={success}
        ticketId={newId}
        onViewTicket={() => navigate(`/tickets/${newId}`)}
        onAnother={handleAnother}
      />

      <Dialog
        open={duplicates.length > 0}
        PaperProps={{
          sx: {
            bgcolor: PAPER,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            p: 1,
            width: { xs: "95vw", sm: 440 },
            maxWidth: "95vw",
          },
        }}
      >
        <DialogContent sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Typography
            sx={{ fontSize: 16, fontWeight: 700, color: "#e3e8f0", mb: 1 }}
          >
            Possible duplicate
          </Typography>
          <Typography
            sx={{ fontSize: 13, color: "#94a3b8", mb: 2, lineHeight: 1.6 }}
          >
            You already have{" "}
            {duplicates.length === 1 ? "an open ticket" : "open tickets"} that
            look similar:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
            {duplicates.map((d) => (
              <Box
                key={d.ticket_id}
                sx={{
                  p: 1.25,
                  borderRadius: 1,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <Typography
                  sx={{ fontSize: 12.5, fontWeight: 600, color: "#e3e8f0" }}
                >
                  #{d.ticket_id} — {d.ticket_title}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.25 }}>
                  Status: {d.ticket_status}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmAnyway}
            sx={{ py: 1, fontWeight: 700, mb: 1 }}
          >
            Submit anyway
          </Button>
          <Button
            fullWidth
            onClick={handleCancelDuplicate}
            sx={{ py: 0.9, color: "#94a3b8", fontSize: 13 }}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color: ACCENT,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            mb: 0.5,
          }}
        >
          New request
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", md: "2rem" },
            color: "#e3e8f0",
            fontFamily: '"Rubik", sans-serif',
            fontWeight: 700,
          }}
        >
          Submit a ticket
        </Typography>
      </Box>

      <Box sx={{ height: 1, bgcolor: BORDER, mb: 2.5 }} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, maxWidth: 800 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Card
        sx={{
          p: { xs: 2, md: 3 },
          bgcolor: PAPER,
          border: `1px solid ${BORDER}`,
          maxWidth: 800,
          width: "100%",
        }}
      >
        <Stepper step={step} />

        {catLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <>
            {step === 1 && (
              <StepCategory
                categories={categories}
                selected={selected}
                onSelect={handleSelectCategory}
                error={fieldErrors.category}
                groupRef={categoryRef}
              />
            )}

            {step === 2 && (
              <StepDetails
                form={form}
                onChange={handleChange}
                file={file}
                onFile={setFile}
                errors={fieldErrors}
                titleRef={titleRef}
                descRef={descRef}
              />
            )}

            {step === 3 && <StepReview form={form} category={selected} file={file} />}
          </>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
          }}
        >
          {step > 1 ? (
            <Typography
              onClick={() => {
                setFieldErrors({});
                setStep((s) => s - 1);
              }}
              sx={{
                fontSize: 13,
                color: ACCENT,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ← Back
            </Typography>
          ) : (
            <Box />
          )}
          <Button
            variant="contained"
            disabled={loading || dupChecking}
            onClick={handleNext}
            startIcon={
              step === 3 ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15 }}
                >
                  send
                </span>
              ) : null
            }
            sx={{ px: { xs: 2.5, md: 3.5 }, py: 0.9, fontWeight: 700 }}
          >
            {dupChecking
              ? "Checking…"
              : loading
                ? "Submitting…"
                : step === 3
                  ? "Submit ticket"
                  : "Continue →"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}