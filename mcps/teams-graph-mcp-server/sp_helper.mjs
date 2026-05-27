import { AuthProvider } from './src/auth/authProvider.js';

const CLIENT_ID = 'c9512ef5-2f33-4f63-bda1-848f9121444d';
const TENANT_ID = '3048dc87-43f0-4100-9acb-ae1971c79395';
const SITE_ID = 'everisgroup.sharepoint.com,08b4d475-c3a7-4b92-b0bd-5dba3496c974,9bd87fa4-9d88-4483-8f3e-d003ed918a72';
const GRAPH = 'https://graph.microsoft.com/v1.0';

const [,, action, ...args] = process.argv;
const auth = new AuthProvider(CLIENT_ID, TENANT_ID);
const token = await auth.getAccessToken();

async function graphGet(url) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}

async function graphDownload(url, dest) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const buf = await r.arrayBuffer();
  const { writeFileSync } = await import('fs');
  writeFileSync(dest, Buffer.from(buf));
  console.log(`Downloaded: ${dest} (${buf.byteLength} bytes)`);
}

if (action === 'list') {
  const folderId = args[0];
  const data = await graphGet(`${GRAPH}/sites/${SITE_ID}/drive/items/${folderId}/children?$top=50`);
  console.log(JSON.stringify(data, null, 2));
} else if (action === 'download') {
  const itemId = args[0];
  const dest = args[1];
  const meta = await graphGet(`${GRAPH}/sites/${SITE_ID}/drive/items/${itemId}`);
  const dlUrl = meta['@microsoft.graph.downloadUrl'];
  if (!dlUrl) { console.error('No download URL', JSON.stringify(meta)); process.exit(1); }
  const r = await fetch(dlUrl);
  const buf = await r.arrayBuffer();
  const { writeFileSync } = await import('fs');
  writeFileSync(dest, Buffer.from(buf));
  console.log(`Downloaded: ${dest} (${buf.byteLength} bytes)`);
} else if (action === 'upload') {
  const localPath = args[0];
  const folderId = args[1];
  const fileName = args[2];
  const { readFileSync } = await import('fs');
  const data = readFileSync(localPath);
  const r = await fetch(
    `${GRAPH}/sites/${SITE_ID}/drive/items/${folderId}:/${fileName}:/content`,
    { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' }, body: data }
  );
  const result = await r.json();
  console.log(JSON.stringify(result, null, 2));
} else if (action === 'delete') {
  const itemId = args[0];
  if (!itemId) { console.error('Uso: sp_helper.mjs delete <itemId>'); process.exit(1); }
  const r = await fetch(
    `${GRAPH}/sites/${SITE_ID}/drive/items/${itemId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
  if (r.status === 204) {
    console.log(`Deleted: ${itemId}`);
  } else {
    const err = await r.json().catch(() => ({}));
    console.error(`Error ${r.status}:`, JSON.stringify(err));
    process.exit(1);
  }
} else {
  console.error(`Acción desconocida: "${action}". Acciones disponibles: list, download, upload, delete`);
  process.exit(1);
}
