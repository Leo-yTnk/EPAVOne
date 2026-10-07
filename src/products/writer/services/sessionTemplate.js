const SESSION_KEY = 'epav-writer-session';
const DATABASE = 'epav-writer-files';

// Keep the original workbook bytes, never serialize parsed XML/ZIP objects.
// sessionStorage scopes the attachment to this tab and survives a reload.
function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
async function access(mode, operation) {
  const id = sessionId();
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    const timer = setTimeout(() => reject(new Error('O armazenamento não respondeu.')), 5000);
    request.onupgradeneeded = () => request.result.createObjectStore('attachments');
    request.onsuccess = () => {
      clearTimeout(timer);
      resolve(request.result);
    };
    request.onerror = () => {
      clearTimeout(timer);
      reject(request.error);
    };
    request.onblocked = () => {
      clearTimeout(timer);
      reject(new Error('Armazenamento ocupado.'));
    };
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('attachments', mode);
      const request = operation(transaction.objectStore('attachments'), id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Armazenamento interrompido.'));
    });
  } finally {
    db.close();
  }
}
export const sessionTemplate = {
  load: () => (sessionStorage.getItem(SESSION_KEY) ? access('readonly', (store, id) => store.get(id)) : Promise.resolve(null)),
  save: async (file) => {
    const bytes = await file.arrayBuffer();
    try {
      await access('readwrite', (store, id) => store.put({ bytes, name: file.name, type: file.type }, id));
    } catch (error) {
      // Never restore an older attachment after a replacement couldn't be persisted.
      sessionStorage.removeItem(SESSION_KEY);
      throw error;
    }
  },
  remove: async () => {
    if (!sessionStorage.getItem(SESSION_KEY)) return;
    await access('readwrite', (store, id) => store.delete(id));
    sessionStorage.removeItem(SESSION_KEY);
  }
};
export function restoreTemplateFile(attachment) {
  return new File([attachment.bytes], attachment.name, { type: attachment.type });
}
