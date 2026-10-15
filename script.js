/**
 * URL2QR - Minimalist Application Logic
 * 1. Centered logo + URL input initial state
 * 2. URL input moves to bottom, QR code appears in center
 * 3. Clicking QR code downloads high-resolution JPG
 */

document.addEventListener('DOMContentLoaded', () => {
  const appWrapper = document.getElementById('app-wrapper');
  const qrForm = document.getElementById('qr-form');
  const urlInput = document.getElementById('url-input');
  const btnSubmit = document.getElementById('btn-submit');
  const btnClear = document.getElementById('btn-clear');
  const qrCard = document.getElementById('qr-card');
  const qrCanvasHolder = document.getElementById('qr-canvas-holder');
  const centerLogoWrapper = document.getElementById('center-logo-wrapper');
  const toastContainer = document.getElementById('toast-container');
  const toastMessage = document.getElementById('toast-message');

  let activeUrl = '';
  let toastTimeout = null;

  // Clear button visibility
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      btnClear.classList.add('show');
    } else {
      btnClear.classList.remove('show');
    }
  });

  btnClear.addEventListener('click', () => {
    urlInput.value = '';
    btnClear.classList.remove('show');
    urlInput.focus();
  });

  // Normalize URL helper
  function normalizeUrl(rawText) {
    let text = rawText.trim();
    if (!text) return '';
    if (!/^https?:\/\//i.test(text) && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(text)) {
      return `https://${text}`;
    }
    return text;
  }

  // Generate QR code and trigger layout animation
  function generateQRCode(rawUrl) {
    const finalUrl = normalizeUrl(rawUrl);
    if (!finalUrl) {
      showToast('URL을 입력해주세요.');
      urlInput.focus();
      return;
    }

    activeUrl = finalUrl;
    qrCanvasHolder.innerHTML = '';

    try {
      new QRCode(qrCanvasHolder, {
        text: finalUrl,
        width: 256,
        height: 256,
        colorDark: '#11141a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Move URL bar down to bottom and display QR code in center
      appWrapper.classList.add('has-qr');
      urlInput.value = finalUrl;
      btnClear.classList.add('show');
    } catch (err) {
      console.error('QR creation error:', err);
      showToast('QR 코드 생성 실패');
    }
  }

  // Form submission
  qrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQRCode(urlInput.value);
  });

  // Download QR code as JPG
  function downloadQrAsJpg() {
    if (!activeUrl) return;

    const sourceCanvas = qrCanvasHolder.querySelector('canvas');
    if (!sourceCanvas) return;

    // Click feedback
    qrCard.style.transform = 'scale(0.96)';
    setTimeout(() => {
      qrCard.style.transform = '';
    }, 180);

    // High resolution canvas for JPG (600x600)
    const exportSize = 600;
    const padding = 50;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    // Fill pure white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // Render QR modules sharply
    ctx.imageSmoothingEnabled = false;
    const qrSize = exportSize - (padding * 2);
    ctx.drawImage(sourceCanvas, padding, padding, qrSize, qrSize);

    try {
      const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

      let domain = 'url2qr';
      try {
        const parsed = new URL(activeUrl);
        domain = parsed.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
      } catch (e) {
        domain = 'qrcode';
      }

      const now = new Date();
      const timeStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `QR_${domain}_${timeStamp}.jpg`;

      const downloadLink = document.createElement('a');
      downloadLink.href = jpgDataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast('QR코드가 JPG 파일로 다운로드되었습니다!');
    } catch (err) {
      console.error('Download error:', err);
      showToast('JPG 다운로드에 실패했습니다.');
    }
  }

  // Click on QR card to download JPG
  qrCard.addEventListener('click', downloadQrAsJpg);
  qrCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      downloadQrAsJpg();
    }
  });

  // Clicking the logo returns to the initial center view
  centerLogoWrapper.addEventListener('click', () => {
    appWrapper.classList.remove('has-qr');
    urlInput.value = '';
    btnClear.classList.remove('show');
    activeUrl = '';
    urlInput.focus();
  });

  // Toast feedback
  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toastContainer.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastContainer.classList.remove('show');
    }, 2800);
  }

  // Focus input on load
  urlInput.focus();
});
