import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const ResumeUploader = ({ onUpload, isLoading, currentResume }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
          isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900/50",
          isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-sm">
            {isLoading ? (
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isDragActive ? "Drop your resume here" : "Upload your resume"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
            Drag and drop your PDF or Word document here, or click to browse files.
          </p>
          <p className="mt-4 text-xs font-medium text-gray-400">Max file size: 5MB</p>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="flex items-center p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>Please upload a valid PDF or Word document (max 5MB).</p>
        </div>
      )}

      {currentResume && !isLoading && (
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-2xl">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center mr-4">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Resume Uploaded</p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{currentResume}</p>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
