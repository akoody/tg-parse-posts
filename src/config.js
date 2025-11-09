import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const keywords = 'giveaway tickets'; // search keywords should be separated by spaces.
export const searchText = 'giveaway'; // search text in the search bar in posts

export const FINGERPRINT_PATH = path.join(__dirname, '..', 'telegram_fingerprint.json');
export const PROFILE_DIR = path.join(__dirname, '..', 'telegram_profile');
export const BROWSER_DATA_DIR = path.join(__dirname, '..', 'telegram_browser_data');

