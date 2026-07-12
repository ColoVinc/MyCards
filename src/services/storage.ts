import { unlink } from 'node:fs/promises'
import path from 'node:path'

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/** Best effort: la carta è già stata eliminata, un'immagine orfana non è un errore. */
export async function deleteCardImage(url: string | null): Promise<void> {
  if (!url) return
  try {
    if (url.startsWith('/uploads/')) {
      await unlink(path.join(process.cwd(), 'public', url))
      return
    }
    // Le immagini del catalogo sono URL esterni (OPTCG): non sono
    // nostre, non vanno eliminate. Tocchiamo solo i blob che abbiamo caricato.
    if (url.includes('.blob.vercel-storage.com') && hasBlobToken()) {
      const { del } = await import('@vercel/blob')
      await del(url)
    }
  } catch {
    // ignore
  }
}
