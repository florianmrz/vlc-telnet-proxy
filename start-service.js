import { Service } from 'node-windows';
import * as path from 'node:path';

const svc = new Service({
  name: 'VLC Telnet Proxy',
  description:
    'A Node.js service that synchronizes VLC media player with Home Assistant entity states via telnet commands.',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: ['--harmony', '--max_old_space_size=4096'],
  abortOnError: false,
  logmode: 'rotate',
});

svc.on('install', () => svc.start());

svc.install();
