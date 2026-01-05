import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');

    const parseEnv = (content) => {
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                env[key] = value;
            }
        });
        return env;
    };

    const env = parseEnv(envContent);
    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('Missing URL or Key in .env');
        process.exit(1);
    }

    const supabase = createClient(url, key);

    async function checkUsers() {
        console.log('Checking public.users table...\n');

        const { data, error } = await supabase
            .from('users')
            .select('id, username, email');

        if (error) {
            console.error('Query failed:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log('The public.users table is STILL EMPTY.');
            console.log('\nPossible causes:');
            console.log('1. No users exist in auth.users');
            console.log('2. RLS is blocking the read (even though we have a public SELECT policy)');
        } else {
            console.log(`Found ${data.length} user(s):\n`);
            data.forEach((u, i) => {
                console.log(`${i + 1}. ID: ${u.id}`);
                console.log(`   Username: ${u.username || '(NULL - needs to be set!)'}`);
                console.log(`   Email: ${u.email || '(NULL)'}`);
                console.log('');
            });

            // Check specifically for rfrmdhn
            const target = data.find(u => u.username === 'rfrmdhn');
            if (target) {
                console.log('✅ User "rfrmdhn" found! Login should work.');
            } else {
                console.log('❌ User "rfrmdhn" NOT found in the table.');
                console.log('   The username column might be NULL or different.');
            }
        }
    }

    checkUsers();

} catch (err) {
    console.error('Error:', err.message);
}
