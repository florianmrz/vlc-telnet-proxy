import { Telnet } from 'telnet-client';
import got from 'got';
import { readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type MediaState = 'playing' | 'stopped';

let currentState: MediaState = 'stopped';

async function getHomeAssistantEntityState(): Promise<MediaState> {
  const { HOME_ASSISTANT_BASE_URL, HOME_ASSISTANT_ENTITY_ID, HOME_ASSISTANT_TOKEN } = process.env;
  const url = `${HOME_ASSISTANT_BASE_URL}/api/states/${HOME_ASSISTANT_ENTITY_ID}`;

  const response = await got<{ state: 'on' | 'off' }>(url, {
    headers: {
      Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  });

  return response.body.state === 'on' ? 'playing' : 'stopped';
}

async function sendVLCTelnetCommand(command: string) {
  const connection = new Telnet();

  const { VLC_TELNET_HOST, VLC_TELNET_PASSWORD } = process.env;

  await connection.connect({
    host: VLC_TELNET_HOST,
    port: 4212,
    negotiationMandatory: false,
    timeout: 3_000,
    username: '',
    password: '',
    // Timeouts are disabled as we do not care about responses
    execTimeout: false,
    sendTimeout: false,
    disableLogon: true,
  });

  // Login using password (this is done manually as the "password" option does not work properly)
  await connection.send(VLC_TELNET_PASSWORD);

  await connection.send(command);

  await connection.destroy();
}

/**
 * Creates a playlist from the music folder and starts playback.
 */
async function startMusic() {
  const { MUSIC_FOLDER } = process.env;

  if (!MUSIC_FOLDER) {
    throw new Error('MUSIC_FOLDER environment variable is not set');
  }

  // Convert to absolute path
  const musicFolderPath = resolve(MUSIC_FOLDER);

  // Read all files from the music folder
  const files = await readdir(musicFolderPath);

  // Filter for common music file extensions
  const musicExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus'];
  const musicFiles = files.filter(file => musicExtensions.some(ext => file.toLowerCase().endsWith(ext)));

  // Create playlist content with absolute paths
  const playlistContent = musicFiles.map(file => join(musicFolderPath, file)).join('\n');

  // Write playlist.m3u file
  const playlistPath = join(musicFolderPath, 'playlist.m3u');
  await writeFile(playlistPath, playlistContent, 'utf-8');

  // Clear current playlist and add the new one
  await sendVLCTelnetCommand('clear');
  await sendVLCTelnetCommand(`enqueue ${playlistPath}`);
  await sendVLCTelnetCommand('play');
}

/**
 * Stops music playback.
 */
async function stopMusic() {
  await sendVLCTelnetCommand('stop');
}

async function main() {
  const state = await getHomeAssistantEntityState();
  console.log(`Current Home Assistant state: ${state}`);

  if (state !== currentState) {
    if (state === 'playing') {
      await startMusic();
    } else {
      await stopMusic();
    }

    currentState = state;
  }
}

main();
setInterval(main, 3_000);
