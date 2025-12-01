# Electron Image Editor

An Electron-based Windows application for uploading, syncing, viewing, and processing high-resolution image data.
This project was built as a full-stack evaluation of Electron architecture, client–server synchronization, UI/UX design, and image-processing workflows.

# Demo
https://www.youtube.com/watch?v=ekZzQPQxzFg

## Overview

The application provides:
* A full client + server architecture
* Electron desktop UI for uploading and managing images
* A PostgreSQL + Docker mock server environment
* Thumbnail gallery viewer + single-image viewer
* Image upload, filtering, selection, batch export, and metadata reporting
* Local–server synchronization with conflict resolution
* Support for large 4K image sets
* Optional integrations (WASM / N-API ready structure)
---

## Tech Stack
### **Frontend (Electron App)**
* Electron
* Node.js
* HTML/CSS/JS/TS/React
* Image rendering with canvas and custom utilities
* Thumbnail generation + high-resolution viewer

### **Backend / Mock Server**
* Docker
* PostgreSQL
* Express API Server
* Mounted server-side storage for mock datasets

### **Additional Integrations**
* Batch folder configuration via JSON
* Support for JPG, PNG, and TIFF (4K) images
---

## Features
### **File Upload**
* Upload JPG, PNG, and TIF images
* 4K image support
* Reads batches from a JSON configuration file
* Displays:
  * Total file count
  * Total file size
  * Number of corrupted/unreadable images

### **Gallery Viewer**
* Displays thumbnails of all uploaded server-side images
* Filters by file type
* Multi-select with custom selection logic
* Batch export / batch download to local folder

### **Single-Image Viewer**
* Opens when a user double-clicks any thumbnail
* Includes:
  * Pan
  * Zoom
  * Area Selection Tool
* Selected area can be exported as a new image

### **Control Panel**
Manages syncing between local Electron app and the server’s database + mounted storage.
Includes:
* Sync status
* Manual sync
* Auto-sync logic
* Conflict detection
---

## Synchronization Strategy
### **Chosen Strategy: *Server Always Wins***
Whenever a conflict occurs between local data and server data, the server version is treated as the source of truth.

### **Why This Strategy?**
* Keeps the system simple and predictable
* Prevents local user changes from creating inconsistent states
* Ensures server data remains authoritative
* Avoids complex merge logic for image files and metadata

### **Potential Risks / Flaws**
* Local edits may be overwritten if they haven’t been synced
* Users who work offline could lose changes
* Requires stable server availability for maximum reliability

This tradeoff was chosen deliberately to maintain consistency and avoid partial merges of binary files.

---

## Project Structure
```
/electron        -> Electron main process, window management, sync controller
/client          -> Frontend UI, thumbnail grid, single-image viewer
/server
    /api         -> Express API (CRUDL for images + metadata)
    /db          -> PostgreSQL container configuration
    /storage     -> Mounted folder for server-side files
```
---

## Docker Setup
1. Ensure Docker Desktop is running
2. From `/server`, run:

```
docker-compose up --build
```

This starts:
* PostgreSQL container
* API server container
* Mounted storage

---

## Running the Electron App
From the project root:

```
npm install
npm run dev
```
---

## UI / UX Notes

The app follows a three-panel layout:
* **Left Panel:** Upload tools + metadata
* **Center Area:** Tabs for Gallery / Single Image
* **Bottom Panel:** Live logs + system feedback
The UI is built to be:
* Clean
* Responsive
* Minimalistic
* Easy to navigate for large image datasets
---

## Testing & Demo Data

The project supports any publicly available image datasets.
Just place test images inside the mounted storage directory or upload them via the UI.

---
## License
This project is for assessment and demonstration purposes.
