import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js';

const PdfPreview = ({ pdfUrl }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div onClick={toggleFullscreen} style={{ cursor: 'pointer' }}>
        <Worker workerUrl={pdfjsWorker}>
          <div style={{ height: '100px' }}>
            <Viewer fileUrl={pdfUrl} />
          </div>
        </Worker>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          onClick={toggleFullscreen}  // Close when clicking outside
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
        >
          <div className="relative w-full h-full max-w-4xl max-h-full">
            <div className="absolute top-0 right-0 p-2 cursor-pointer">
              <span
                className="text-white text-xl"
                onClick={toggleFullscreen}  // Close button
              >
                X
              </span>
            </div>
            <Worker workerUrl={pdfjsWorker}>
              <div className="w-full h-full">
                <Viewer fileUrl={pdfUrl} />
              </div>
            </Worker>
          </div>
        </div>
      )}
    </>
  );
};

export default PdfPreview;
