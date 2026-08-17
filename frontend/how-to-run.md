# TrackFlow – Frontend Prototype Setup Guide

This guide explains how to run the TrackFlow frontend prototype on your local machine.  
The prototype is a React + Vite application. You will need **Node.js** installed before you can run it.

---

## 1. Install Node.js

If you do not have Node.js installed:

1. Go to **https://nodejs.org**
2. Download the **LTS** version (recommended)
3. Run the installer and follow the prompts — accept all defaults
4. Once installed, open a terminal (Command Prompt, PowerShell, or Terminal) and verify:

```bash
node -v
npm -v
```

Both commands should print a version number (e.g. `v20.11.0` and `10.x.x`). If they do, Node.js is ready.

---

## 2. Extract the ZIP

Extract the submitted ZIP file to a folder of your choice.  
You should see files like `package.json`, `vite.config.js`, and a `src/` directory directly inside the extracted folder — there is no subfolder to navigate into.

---

## 3. Install Dependencies

Open a terminal and navigate into the extracted folder:

```bash
cd path/to/extracted-folder
```

Then install the project dependencies:

```bash
npm install
```

This will download all required packages into a `node_modules/` folder. It may take a minute or two on first run.

---

## 4. Run the Development Server

Once dependencies are installed, start the app:

```bash
npm run dev
```

You should see output like:

```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173** to view the application.

---

## 5. Common Errors & Fixes

### `vite: command not found` or `'vite' is not recognized`

This means Vite was not installed. Run:

```bash
npm install
```

If the error persists, install Vite explicitly:

```bash
npm install vite --save-dev
```

Then try `npm run dev` again.

---

### `Cannot find module '...'` or missing package errors

Dependencies were not installed correctly. Delete the `node_modules` folder and reinstall:

```bash
# On Windows (PowerShell)
Remove-Item -Recurse -Force node_modules

# On Mac/Linux
rm -rf node_modules
```

Then run:

```bash
npm install
npm run dev
```

---

### Port 5173 already in use

Another process is using the default port. Either stop that process, or run on a different port:

```bash
npm run dev -- --port 3000
```

Then visit **http://localhost:3000** instead.

---

### `node` or `npm` not recognised after installing Node.js

Close your terminal completely and reopen it. The PATH environment variable only updates when a new terminal session starts.

---

### `EACCES` permission error (Mac/Linux only)

Run the install with elevated permissions:

```bash
sudo npm install
```

---

## 6. Notes

- The prototype runs entirely in the browser — no backend or database connection is required.
- All data displayed is seeded mock data for demonstration purposes.
- The app has been tested on **Node.js v20 LTS**. Using an older version may cause issues.
- If you are on Windows, PowerShell or Command Prompt both work. VS Code's integrated terminal also works.

---

*TrackFlow Solutions — INFO3002A/INFO3003A Elaboration 1, 2026*