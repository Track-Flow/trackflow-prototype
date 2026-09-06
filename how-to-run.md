# TrackFlow – How to Run (Docker)

TrackFlow runs as a fully containerised application using Docker Compose. You do **not** need Node.js, MySQL, or any other runtime installed on your machine — Docker handles everything.

---

## 1. Install Docker

### Windows & macOS
1. Go to **https://www.docker.com/products/docker-desktop**
2. Download **Docker Desktop** for your operating system
3. Run the installer and follow the prompts — accept all defaults
4. Once installed, **launch Docker Desktop** and wait for it to finish starting (the whale icon in your taskbar/menu bar will stop animating)
5. Open a terminal (PowerShell on Windows, Terminal on macOS) and verify:

```bash
docker --version
docker compose version
```

Both commands should print a version number. If they do, Docker is ready.

> **Windows users:** Docker Desktop requires WSL 2 (Windows Subsystem for Linux). The installer will prompt you to enable it if it is not already active — follow those prompts before continuing.

### Linux (Ubuntu/Debian)
Follow the official Docker installation guide at **https://docs.docker.com/engine/install/ubuntu/** — do not use `apt install docker.io` as it installs an outdated version.

---

## 2. Extract the Project

Extract the submitted ZIP file to a folder of your choice. Inside you should see:

```
trackflow-prototype/
├── docker-compose.yml
├── frontend/
├── backend/
└── trackflow.sql
```

Open a terminal and navigate into that folder:

```bash
cd path/to/trackflow-prototype
```

---

## 3. Start the Application

Run the following command from inside the `trackflow-prototype` folder:

```bash
docker compose up -d
```

This will:
- Pull and build all container images (frontend, backend, database)
- Seed the database from `trackflow.sql`
- Start all services in the background

**First run takes longer** (2–5 minutes) as images are being built. Subsequent starts are much faster.

Once complete, open your browser and go to:

```
https://localhost
```

> Your browser will show a security warning because the app uses a self-signed SSL certificate. This is expected. Click **Advanced → Proceed to localhost** (Chrome) or **Accept the Risk and Continue** (Firefox).

---

## 4. Stopping the Application

```bash
docker compose down
```

This stops and removes the containers but keeps your database data intact.

---

## 5. Viewing Logs

If something does not look right, check the logs:

```bash
# All services
docker compose logs -f

# A specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

Press `Ctrl + C` to stop following logs.

---

## 6. Common Errors & Fixes

### Port 80 or 443 already in use

**Error message:** `bind: address already in use` or `Ports are not available`

Another application on your machine is using port 80 (HTTP) or 443 (HTTPS). Common culprits are IIS, another web server, or a previous Docker container.

**Fix — stop the conflicting process:**

```bash
# Windows (find what is using port 443)
netstat -ano | findstr :443

# Then kill it by PID
taskkill /PID <pid> /F
```

```bash
# Mac/Linux
sudo lsof -i :443
sudo kill -9 <pid>
```

Then run `docker compose up -d` again.

---

### Port 3306 already in use (MySQL conflict)

**Error message:** `bind: address already in use` on port `3306`

You likely have MySQL installed locally and it is running.

**Fix:** Stop your local MySQL service:

```bash
# Windows
net stop MySQL

# macOS (Homebrew)
brew services stop mysql

# Linux
sudo systemctl stop mysql
```

Then run `docker compose up -d` again.

---

### Database fails to initialise / containers keep restarting

This can happen if the database volume was left in a broken state from a previous run.

**Fix — wipe the volume and reinitialise:**

```bash
docker compose down -v
docker compose up -d
```

> ⚠️ This deletes all data in the database and re-seeds it from `trackflow.sql`. Only use this to recover from a broken state.

---

### `docker compose` command not found

On older Docker installations the command is `docker-compose` (with a hyphen):

```bash
docker-compose up -d
```

If neither works, Docker is not installed correctly — return to Step 1.

---

### Docker Desktop is not running

**Error message:** `Cannot connect to the Docker daemon`

Docker Desktop must be open and fully started before you run any commands.

**Fix:** Open Docker Desktop from your Applications / Start Menu and wait for the whale icon to stop animating, then retry.

---

### Browser shows "Connection Refused" or blank page

The containers may still be starting up. Wait 30 seconds and refresh.

If it persists, check that all three containers are running:

```bash
docker compose ps
```

All three services (`frontend`, `backend`, `db`) should show `Up` or `running`. If any show `Exit`, check that service's logs:

```bash
docker compose logs backend
```

---

## 7. Notes

- The app is served over **HTTPS on port 443**. Always use `https://localhost`, not `http://`.
- HTTP on port 80 automatically redirects to HTTPS.
- All uploaded files and database data persist between restarts unless you run `docker compose down -v`.
- The application has been tested on **Docker Desktop 4.x** on Windows 11 and macOS.

---

*TrackFlow Solutions — INFO3002A/INFO3003A, Group 10, 2026*
