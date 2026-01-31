# VLC Telnet Proxy

A Node.js service that synchronizes VLC media player with Home Assistant entity states via telnet commands.

## Overview

This proxy monitors a Home Assistant entity and automatically starts or stops music playback in VLC based on the entity's state. When the entity is "on", it generates a playlist from a given music folder and starts playback. When "off", it stops the music.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Enable VLC telnet interface:**
   - Open VLC → Tools → Preferences
   - Show settings: All
   - Interface → Main interfaces → Check "Telnet"
   - Interface → Main interfaces → Lua → Set password
   - Restart VLC

3. **Create `.env` file (based on .env.example):**

## Usage

```bash
npm start
```

The service will:
- Poll Home Assistant every X seconds
- Start music playback when entity turns "on"
- Stop music playback when entity turns "off"

## Setup

This script is ran using the native Windows Task Scheduler. To set it up:
1. Open Task Scheduler and create a new task.
2. Set the trigger to "At startup" or as desired (in my case every minute after user login).
3. Set the action to start the node program within the project directory to properly load env variables.