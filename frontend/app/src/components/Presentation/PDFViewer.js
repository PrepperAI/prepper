// import React, { useEffect, useRef, useState } from "react";
// import styles from "./PDFViewer.module.css";

// const PDFViewer = ({ fileUrl, fileName, onReupload }) => {
//   const canvasRef = useRef(null);
//   const [pdf, setPdf] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(0);

//   useEffect(() => {
//     const loadPDF = async () => {
//       if (!window.pdfjsLib || !fileUrl) return;
//       const loadingTask = window.pdfjsLib.getDocument(fileUrl);
//       const loadedPdf = await loadingTask.promise;
//       setPdf(loadedPdf);
//       setTotalPages(loadedPdf.numPages);
//       renderPage(loadedPdf, 1);
//     };

//     loadPDF();
//   }, [fileUrl]);

//   useEffect(() => {
//     if (pdf) renderPage(pdf, currentPage);
//   }, [currentPage]);

//   const renderPage = async (pdfDoc, pageNum) => {
//     const page = await pdfDoc.getPage(pageNum);
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");

//     const { width, height } = canvas.parentElement.getBoundingClientRect();
//     const unscaled = page.getViewport({ scale: 1 });
//     const scale =
//       Math.min(width / unscaled.width, height / unscaled.height) * 0.98;
//     const viewport = page.getViewport({ scale });

//     canvas.width = viewport.width;
//     canvas.height = viewport.height;

//     await page.render({ canvasContext: context, viewport }).promise;
//   };

//   return (
//     <div className={styles.viewerContainer}>
//       <canvas ref={canvasRef} className={styles.canvas} />
//       <div className={styles.overlay}>
//         <button
//           className={`${styles.navButton} ${styles.prevButton}`}
//           onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//           disabled={currentPage === 1}
//         >
//           &lt;
//         </button>
//         <button
//           className={`${styles.navButton} ${styles.nextButton}`}
//           onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
//           disabled={currentPage === totalPages}
//         >
//           &gt;
//         </button>

//         <div className={styles.topLeft}>
//           <span className={styles.fileName}>{fileName}</span>
//           <button onClick={onReupload} className={styles.controlButton}>
//             Change PDF
//           </button>
//         </div>

//         <div className={styles.pageInfo}>
//           Page {currentPage} of {totalPages}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PDFViewer;

import React, { useEffect, useState } from "react";
import styles from "./PDFViewer.module.css";

const PDFViewer = ({
  fileUrl,
  fileName,
  onReupload,
  canvasRef,
  currentPage,
  setCurrentPage,
}) => {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadPDF = async () => {
      if (!window.pdfjsLib || !fileUrl) return;
      const loadingTask = window.pdfjsLib.getDocument(fileUrl);
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
      setTotalPages(loadedPdf.numPages);
      renderPage(loadedPdf, 1);
      setCurrentPage(1);
    };

    loadPDF();
  }, [fileUrl]);

  useEffect(() => {
    if (pdf) renderPage(pdf, currentPage);
  }, [pdf, currentPage]);

  const renderPage = async (pdfDoc, pageNum) => {
    const page = await pdfDoc.getPage(pageNum);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");

    const { width, height } = canvas.parentElement.getBoundingClientRect();
    const unscaled = page.getViewport({ scale: 1 });
    const scale =
      Math.min(width / unscaled.width, height / unscaled.height) * 0.98;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
  };

  return (
    <div className={styles.viewerContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.overlay}>
        <button
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        <button
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>

        <div className={styles.topLeft}>
          <span className={styles.fileName}>{fileName}</span>
          <button onClick={onReupload} className={styles.controlButton}>
            Change PDF
          </button>
        </div>

        <div className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
