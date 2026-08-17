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
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const LOGO_BLUE = "#2ec8ff";
const BG = "#0a1628";
const CARD_BG = "#0f1f3a";
const BORDER = "rgba(143,162,192,0.12)";

/* ── tiny TrackFlow wordmark ── */
function TFWordmark() {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
      <Typography
        sx={{
          fontFamily: '"Rubik", sans-serif',
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: "-0.03em",
          color: "#e6edf7",
        }}
      >
        <span style={{ color: LOGO_BLUE }}>TRACK</span>FLOW
      </Typography>
    </Box>
  );
}

/* ── faint grid background ── */
function GridBg() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `
        linear-gradient(rgba(46,200,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(46,200,255,0.04) 1px, transparent 1px)
      `,
        backgroundSize: "40px 40px",
      }}
    />
  );
}

/* ── glow blob ── */
function GlowBlob({
  x = "50%",
  y = "50%",
  color = LOGO_BLUE,
  size = 480,
  opacity = 0.07,
}) {
  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 0,
        pointerEvents: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(90px)",
        opacity,
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // add at top of component


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GridBg />
      <GlowBlob x="20%" y="30%" color={LOGO_BLUE} size={500} opacity={0.06} />
      <GlowBlob x="80%" y="70%" color="#c084fc" size={400} opacity={0.05} />

      <Box
        sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}
      >
        {/* Logo + tagline */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <TFWordmark />
          <Typography
            sx={{
              fontSize: 12,
              color: "#5b6d8a",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Wits University · MSS
          </Typography>
        </Box>

        {/* Card */}
        <Card
          sx={{
            p: 3.5,
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6)",
          }}
        >
          <Typography variant="h5" sx={{ color: "#e6edf7", mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "#5b6d8a", mb: 3 }}>
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
              FormHelperTextProps={{ sx: { color: "#5b6d8a", fontSize: 11.5 } }}
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
                      sx={{ color: "#5b6d8a" }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        {showPw ? "visibility_off" : "visibility"}
                      </span>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot password */}
            <Box sx={{ textAlign: "right", mt: -1 }}>
              <Typography
                component="button"
                type="button"
                onClick={() => {}}
                sx={{
                  fontSize: 12.5,
                  color: LOGO_BLUE,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  p: 0,
                  fontFamily: "inherit",
                  "&:hover": { textDecoration: "underline" },
                }}
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
              sx={{ mt: 0.5, py: 1.3, fontSize: 15, fontWeight: 700 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: BORDER }} />

          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#5b6d8a" }}>
              New to TrackFlow?{" "}
              <Typography
                component="span"
                onClick={() => navigate('/register')}
                sx={{
                  color: LOGO_BLUE,
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Create an account
              </Typography>
            </Typography>
          </Box>
        </Card>

        {/* Footer */}
        <Typography
          sx={{
            textAlign: "center",
            mt: 2.5,
            fontSize: 11.5,
            color: "#2e3e55",
          }}
        >
          © {new Date().getFullYear()} TrackFlow Solutions · Mathematical
          Sciences Support
        </Typography>
      </Box>
    </Box>
  );
}
