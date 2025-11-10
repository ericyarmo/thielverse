import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!URL || !KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY"); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

(async () => {
  const [{ count: rc }, { count: ec }] = await Promise.all([
    sb.from('receipts').select('*', { count: 'exact', head: true }),
    sb.from('entities').select('id', { count: 'exact', head: true }),
  ]);

  const { data: rows, error } = await sb
    .from('receipts')
    .select('cid,published_at,title')
    .not('cid','is',null)
    .order('published_at',{ ascending:false })
    .limit(1);

  if (error) { console.error(error.message); process.exit(1); }

  console.log(`Receipts: ${rc ?? 0} • Entities: ${ec ?? 0} • With CID: ${rows?.length ?? 0}`);
  const cid = rows?.[0]?.cid as string | undefined;
  if (cid) {
    writeFileSync('.tmp_cid', cid);
    console.log(`Sample CID: ${cid}`);
  } else {
    console.log('No CID with analysis found yet.');
  }
})();
