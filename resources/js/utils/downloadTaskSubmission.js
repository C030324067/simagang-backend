import { getToken } from '../api';

const fileDetails = {
  attachment: ['task_file_name', 'Berkas-instruksi'],
  submission: ['submission_file_name', 'Berkas-pengumpulan'],
  revision: ['revision_file_name', 'Berkas-revisi'],
};

export async function downloadTaskFile(task, kind = 'submission') {
  try {
    const [nameField, fallbackName] = fileDetails[kind] || fileDetails.submission;
    const response = await fetch(`/api/tasks/${task.id}/${kind === 'revision' ? 'revision-file' : kind}`, {
      headers: {
        Accept: 'application/octet-stream, application/json',
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
    downloadLink.download = task[nameField] || fallbackName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message || 'Berkas tugas gagal diunduh. Periksa koneksi lalu coba lagi.' };
  }
}

export async function downloadTaskSubmission(task) {
  return downloadTaskFile(task, 'submission');
}
