import * as fs from 'fs';

const LOGPATH = '/home/bedsteler20/flatpak-host/flatpak-host.log';

export function log(message: string) {
    const msg = new Date().toISOString() + ' ' + message;
  fs.appendFileSync(LOGPATH, msg + '\n');
}

