const fileInput = document.getElementById('file-input');
const pdfContainer = document.getElementById('pdf-container');
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const pageCountDisplay = document.getElementById('page-count-display');
const pageNumDisplay = document.getElementById('page-num');
const pageCountElement = document.getElementById('page-count');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null;

// Debugging: Check if elements are correctly referenced
console.log('fileInput:', fileInput);
console.log('pdfContainer:', pdfContainer);
console.log('canvas:', canvas);
console.log('context:', context);
console.log('pageCountDisplay:', pageCountDisplay);
console.log('pageNumDisplay:', pageNumDisplay);
console.log('pageCountElement:', pageCountElement);
console.log('prevPageButton:', prevPageButton);
console.log('nextPageButton:', nextPageButton);

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function(event) {
      const pdfData = new Uint8Array(event.target.result);
      pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
        pdfDoc = pdf;
        pageCountElement.textContent = pdf.numPages;
        if (pageCountDisplay) {
          pageCountDisplay.classList.remove('hidden');
        } else {
          console.error('pageCountDisplay is null');
        }
        renderPage(pageNum);
      }).catch((error) => {
        console.error('Error while loading PDF: ', error);
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    console.error('The selected file is not a PDF.');
  }
});

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = pdfContainer.clientWidth;
    const containerHeight = pdfContainer.clientHeight;
    const pageWidthScale = containerWidth / viewport.width;
    const pageHeightScale = containerHeight / viewport.height;
    const bestScale = Math.min(pageWidthScale, pageHeightScale);

    const scaledViewport = page.getViewport({ scale: bestScale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Adjust the container size to match the canvas size
    pdfContainer.style.width = `${canvas.width}px`;
    pdfContainer.style.height = `${canvas.height}px`;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(() => {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
      // Position the arrows dynamically
      positionArrows();
    });
  }).catch((error) => {
    console.error('Error while rendering page: ', error);
  });

  pageNumDisplay.textContent = num;
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

function positionArrows() {
  const containerRect = pdfContainer.getBoundingClientRect();
  const arrowOffset = 10; // Adjust this value if needed

  prevPageButton.style.top = `${containerRect.top + containerRect.height / 2 - prevPageButton.offsetHeight / 2}px`;
  prevPageButton.style.left = `${containerRect.left - prevPageButton.offsetWidth - arrowOffset}px`;

  nextPageButton.style.top = `${containerRect.top + containerRect.height / 2 - nextPageButton.offsetHeight / 2}px`;
  nextPageButton.style.right = `${containerRect.left + containerRect.width + arrowOffset}px`;
}

document.getElementById('prev-page').addEventListener('click', () => {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
});

window.addEventListener('resize', positionArrows);
