import { getToken } from '../api';

export async function downloadTaskSubmission(task) {
  try {
    const response = await fetch(`/api/tasks/${task.id}/submission`, {
      headers: {
        Accept: 'application/octet-stream',
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, message: result.message || 'Berkas tugas gagal diunduh.' };
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = task.submission_file_name || 'berkas-tugas';
    downloadLink.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    return { success: true };
  } catch {
    return { success: false, message: 'Berkas tugas gagal diunduh. Periksa koneksi lalu coba lagi.' };
  }
}
