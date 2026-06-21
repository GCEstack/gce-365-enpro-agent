// static/js/components/upload.js — Manual PO upload
import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>Add PO to Review</h2>
    <div class="upload-zone" id="uploadZone">
      <p>Drag and drop a file here, or click to browse.</p>
      <input type="file" id="fileInput" accept=".xml,.csv,.pdf" style="margin:12px 0;">
      <div style="margin-top:12px;">
        <label>Source:</label>
        <select id="sourceSelect" style="margin-left:8px;padding:6px;background:#141620;color:#e0e0e0;border:1px solid #2a2d3a;border-radius:4px;">
          <option value="auto">Auto-detect</option>
          <option value="ariba">Ariba</option>
          <option value="coupa">Coupa</option>
          <option value="direct">Direct / Email</option>
        </select>
      </div>
      <button class="btn btn-blue" id="btnUpload" style="margin-top:16px;">Upload</button>
    </div>
    <div id="uploadResult" style="margin-top:16px;"></div>
  `;

  const zone = container.querySelector('#uploadZone');
  const fileInput = container.querySelector('#fileInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#3b82f6'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    fileInput.files = e.dataTransfer.files;
  });

  container.querySelector('#btnUpload').addEventListener('click', () => upload(container));
}

async function upload(container) {
  const fileInput = container.querySelector('#fileInput');
  const source = container.querySelector('#sourceSelect').value;
  const resultBox = container.querySelector('#uploadResult');

  if (!fileInput.files.length) {
    showToast('No file selected', 'Please choose a PO file to upload.', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('source', source);

  resultBox.innerHTML = '<div class="empty">Uploading…</div>';
  try {
    const data = await api.upload(formData);
    showToast('Upload complete', `PO ${data.po_number || data.intake_id} added to review queue.`, 'success');
    resultBox.innerHTML = `<div class="meta-box">Uploaded: <b>${data.po_number || data.intake_id}</b></div>`;
    setState('tab', 'queue');
  } catch (e) {
    resultBox.innerHTML = '';
    showToast('Upload failed', e.message, 'error');
  }
}
