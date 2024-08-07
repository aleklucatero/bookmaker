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

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function(event) {
      const pdfData = new Uint8Array(event.target.result);
      pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
        pdfDoc = pdf;
        pageCountElement.textContent = pdf.numPages;
        pageCountDisplay.classList.remove('hidden');
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
    const pageWidthScale = containerWidth / viewport.width;

    const scaledViewport = page.getViewport({ scale: pageWidthScale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

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
  const arrowOffset = 10;

  prevPageButton.style.top = `${containerRect.top + containerRect.height / 2 - prevPageButton.offsetHeight / 2}px`;
  prevPageButton.style.left = `${containerRect.left - prevPageButton.offsetWidth - arrowOffset}px`;

  nextPageButton.style.top = `${containerRect.top + containerRect.height / 2 - nextPageButton.offsetHeight / 2}px`;
  nextPageButton.style.right = `${containerRect.right - nextPageButton.offsetWidth + arrowOffset}px`;
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
