import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../helpers/api.js";

const ACCENT      = "#5a8dc4";
const BG_MAIN     = "#0c1422";
const BORDER      = "rgba(148,163,184,0.10)";
const TEXT_MUTED  = "#64748b";
const TEXT_DIM    = "#94a3b8";
const TEXT_BRIGHT = "#e3e8f0";

function TFLogo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 3.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "8px",
          background: ACCENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: "#fff", fontVariationSettings: "'FILL' 1" }}
        >
          confirmation_number
        </span>
      </Box>
      <Box>
        <Typography
          sx={{
            fontFamily: '"Rubik", sans-serif',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: TEXT_BRIGHT,
          }}
        >
          <span style={{ color: ACCENT }}>TRACK</span>FLOW
        </Typography>
        <Typography
          sx={{
            fontSize: 10.5,
            color: TEXT_MUTED,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            mt: 0.5,
          }}
        >
          Wits University · MSS
        </Typography>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        user_id: userId,
        password,
      });

      localStorage.setItem("tf_token", res.data.token);
      localStorage.setItem("tf_user", JSON.stringify(res.data.user));

      const routes = {
        tla: "/tla",
        mss_manager: "/manager",
        end_user: "/home",
        admin: "/helpdesk",
      };
      navigate(routes[res.data.user.role] ?? "/login");
    } catch (err) {
      setError(err.response?.data?.error ?? "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const linkSx = {
    color: ACCENT,
    fontWeight: 600,
    cursor: "pointer",
    background: "none",
    border: "none",
    p: 0,
    fontFamily: "inherit",
    "&:hover": { textDecoration: "underline" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: BG_MAIN,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <TFLogo />

        <Card sx={{ p: { xs: 3, sm: 3.5 } }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              mb: 0.75,
            }}
          >
            Welcome back
          </Typography>
          <Typography variant="h5" sx={{ color: TEXT_BRIGHT, mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography sx={{ fontSize: 13, color: TEXT_DIM, mb: 3 }}>
            Use your MSS staff or student credentials.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, fontSize: 13 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Student / Staff number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
              fullWidth
              helperText="e.g. 123456 or EMP0012"
              FormHelperTextProps={{ sx: { color: TEXT_MUTED, fontSize: 11.5 } }}
            />

            <TextField
              label="Password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPw((p) => !p)}
                      edge="end"
                      sx={{ color: TEXT_MUTED, "&:hover": { color: TEXT_DIM } }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPw ? "visibility_off" : "visibility"}
                      </span>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: "right", mt: -1 }}>
              <Typography
                component="button"
                type="button"
                onClick={() => {}}
                sx={{ ...linkSx, fontSize: 12.5 }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontSize: 14 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: BORDER }} />

          <Typography sx={{ fontSize: 13, color: TEXT_DIM, textAlign: "center" }}>
            New to TrackFlow?{" "}
            <Typography
              component="button"
              type="button"
              onClick={() => navigate("/register")}
              sx={{ ...linkSx, fontSize: 13 }}
            >
              Create an account
            </Typography>
          </Typography>
        </Card>

        <Typography sx={{ textAlign: "center", mt: 2.5, fontSize: 11, color: TEXT_MUTED, opacity: 0.6 }}>
          © {new Date().getFullYear()} TrackFlow Solutions · Mathematical Sciences Support
        </Typography>
      </Box>
    </Box>
  );
}