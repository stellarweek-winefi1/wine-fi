"use client";

import { useState, useRef } from "react";
import { Wine, Upload, DollarSign, CheckCircle, X, File, Image as ImageIcon, Download, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

export default function NuevoLotePage() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    wineName: "",
    region: "",
    vintage: "",
    description: "",
    bottleCount: "",
    varietal: "",
    priceUSDC: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isCertified, setIsCertified] = useState(false);
  const [wttToken, setWttToken] = useState<string>("");
  const [lotId, setLotId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 1,
      title: t.newLot.steps.step1.title,
      description: t.newLot.steps.step1.description,
      icon: Wine,
    },
    {
      id: 2,
      title: t.newLot.steps.step2.title,
      description: t.newLot.steps.step2.description,
      icon: Upload,
    },
    {
      id: 3,
      title: t.newLot.steps.step3.title,
      description: t.newLot.steps.step3.description,
      icon: DollarSign,
    },
    {
      id: 4,
      title: t.newLot.steps.step4.title,
      description: t.newLot.steps.step4.description,
      icon: CheckCircle,
    },
  ];

  // Validation functions
  const isStep1Complete = () => {
    return !!(
      formData.wineName.trim() &&
      formData.varietal.trim() &&
      formData.region.trim() &&
      formData.vintage.trim() &&
      formData.bottleCount.trim() &&
      parseInt(formData.bottleCount) > 0 &&
      formData.priceUSDC.trim() &&
      parseFloat(formData.priceUSDC) > 0
    );
  };

  const isStep2Complete = () => {
    return uploadedFiles.length > 0;
  };

  const isStep3Complete = () => {
    // Step 3 is just informational, so it's always complete if we reached it
    return true;
  };

  const canProceedToStep = (step: number) => {
    if (step <= currentStep) return true; // Can always go back or stay on current
    if (step === 2) return isStep1Complete();
    if (step === 3) return isStep1Complete() && isStep2Complete();
    if (step === 4) return isStep1Complete() && isStep2Complete() && isStep3Complete();
    return false;
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.wineName.trim()) {
        errors.wineName = t.newLot.form.wineName.required;
      }
      if (!formData.varietal.trim()) {
        errors.varietal = t.newLot.form.varietal.required;
      }
      if (!formData.region.trim()) {
        errors.region = t.newLot.form.region.required;
      }
      if (!formData.vintage.trim()) {
        errors.vintage = t.newLot.form.vintage.required;
      }
      if (!formData.bottleCount.trim()) {
        errors.bottleCount = t.newLot.form.bottleCount.required;
      } else if (parseInt(formData.bottleCount) <= 0) {
        errors.bottleCount = t.newLot.form.bottleCount.invalid;
      }
      if (!formData.priceUSDC.trim()) {
        errors.priceUSDC = t.newLot.form.priceUSDC.required;
      } else if (parseFloat(formData.priceUSDC) <= 0) {
        errors.priceUSDC = t.newLot.form.priceUSDC.invalid;
      }
    } else if (currentStep === 2) {
      if (uploadedFiles.length === 0) {
        errors.files = t.newLot.documentation.filesRequired;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
        setValidationErrors({});
      }
    }
  };

  const generateWTTToken = () => {
    // Generate a unique Certificate token based on wine name and timestamp
    const timestamp = Date.now();
    const wineNameSlug = formData.wineName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .substring(0, 20);
    const token = `${wineNameSlug}-${formData.vintage}-CERT-${timestamp.toString().slice(-6)}`;
    return token;
  };

  const generateLotId = () => {
    // Generate a unique lot ID
    const timestamp = Date.now();
    const wineNameSlug = formData.wineName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .substring(0, 20);
    return `${wineNameSlug}-${timestamp}`;
  };

  const handleCertifyLot = () => {
    // Generate Certificate token and lot ID
    const token = generateWTTToken();
    const id = generateLotId();
    
    setWttToken(token);
    setLotId(id);
    setIsCertified(true);
    
    // In a real app, this would make an API call to create the Certificate
    console.log("Certificate Token generated:", token);
    console.log("Lot ID:", id);
  };

  const handleDownloadQR = () => {
    // Create a canvas element to download the QR code
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${wttToken}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const handleStepClick = (stepId: number) => {
    if (canProceedToStep(stepId)) {
      setCurrentStep(stepId);
      setValidationErrors({});
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = { id, file };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, preview: reader.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      return uploadedFile;
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    
    // Clear validation errors when files are uploaded
    if (validationErrors.files) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.files;
        return newErrors;
      });
    }
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return ImageIcon;
    }
    return File;
  };

  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/lotes"
          className="inline-flex items-center gap-2 text-black hover:text-gray-800 mb-4 sm:mb-6 md:mb-8 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          <span className="font-medium">{t.newLot.backToLots}</span>
        </Link>

        {/* Header */}
        <motion.div
          className="text-center mb-6 sm:mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            {t.newLot.title} <span className="text-black">{t.newLot.titleHighlight}</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black px-4">
            {t.newLot.subtitle}
          </p>
        </motion.div>

        {/* Step Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <motion.div
                key={step.id}
                className={cn(
                  "rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 transition-all duration-300",
                  isActive
                    ? "bg-black text-white border-black"
                    : isCompleted
                    ? "bg-gray-100 text-black border-black"
                    : "bg-white text-black border-black",
                  canProceedToStep(step.id) ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors",
                      isActive
                        ? "bg-white bg-opacity-20"
                        : isCompleted
                        ? "bg-black bg-opacity-10"
                        : "bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" aria-hidden="true" />
                  </div>
                  <div className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">{step.title}</div>
                  <div className={cn(
                    "text-[10px] sm:text-xs leading-tight",
                    isActive ? "text-white" : "text-black"
                  )}>
                    {step.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Form Content */}
        <motion.div
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8 border border-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">
                {t.newLot.form.lotInfo}
              </h2>

              <div>
                <label
                  htmlFor="wineName"
                  className="block text-sm font-medium text-black mb-2"
                >
                  {t.newLot.form.wineName.label} <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  id="wineName"
                  name="wineName"
                  value={formData.wineName}
                  onChange={handleInputChange}
                  placeholder={t.newLot.form.wineName.placeholder}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                    validationErrors.wineName ? "border-red-500" : "border-black"
                  )}
                  required
                />
                {validationErrors.wineName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.wineName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="varietal"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    {t.newLot.form.varietal.label} <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="varietal"
                    name="varietal"
                    value={formData.varietal}
                    onChange={handleInputChange}
                    placeholder={t.newLot.form.varietal.placeholder}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                      validationErrors.varietal ? "border-red-500" : "border-black"
                    )}
                    required
                  />
                  {validationErrors.varietal && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.varietal}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    {t.newLot.form.region.label} <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder={t.newLot.form.region.placeholder}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                      validationErrors.region ? "border-red-500" : "border-black"
                    )}
                    required
                  />
                  {validationErrors.region && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.region}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="vintage"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    {t.newLot.form.vintage.label} <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="vintage"
                    name="vintage"
                    value={formData.vintage}
                    onChange={handleInputChange}
                    placeholder={t.newLot.form.vintage.placeholder}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                      validationErrors.vintage ? "border-red-500" : "border-black"
                    )}
                    required
                  />
                  {validationErrors.vintage && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.vintage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="bottleCount"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    {t.newLot.form.bottleCount.label} <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    id="bottleCount"
                    name="bottleCount"
                    value={formData.bottleCount}
                    onChange={handleInputChange}
                    placeholder={t.newLot.form.bottleCount.placeholder}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                      validationErrors.bottleCount ? "border-red-500" : "border-black"
                    )}
                    required
                    min="1"
                  />
                  {validationErrors.bottleCount && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.bottleCount}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="priceUSDC"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    {t.newLot.form.priceUSDC.label} <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    id="priceUSDC"
                    name="priceUSDC"
                    value={formData.priceUSDC}
                    onChange={handleInputChange}
                    placeholder={t.newLot.form.priceUSDC.placeholder}
                    step="0.01"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                      validationErrors.priceUSDC ? "border-red-500" : "border-black"
                    )}
                    required
                    min="0.01"
                  />
                  {validationErrors.priceUSDC && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.priceUSDC}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-black mb-2"
                >
                  {t.newLot.form.description.label}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t.newLot.form.description.placeholder}
                  rows={6}
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">{t.newLot.documentation.title}</h2>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                aria-label={t.newLot.documentation.selectFiles}
              />

              {/* Upload area */}
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-black mx-auto mb-4" />
                <p className="text-black mb-4">
                  {t.newLot.documentation.uploadText}
                </p>
                <button
                  onClick={handleFileSelect}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  {t.newLot.documentation.selectFiles}
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  {t.newLot.documentation.acceptedFormats}
                </p>
                {validationErrors.files && (
                  <p className="mt-4 text-sm text-red-600 font-medium">{validationErrors.files}</p>
                )}
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">
                    {t.newLot.documentation.uploadedFiles} ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedFiles.map((uploadedFile) => {
                      const Icon = getFileIcon(uploadedFile.file);
                      const isImage = uploadedFile.file.type.startsWith("image/");

                      return (
                        <motion.div
                          key={uploadedFile.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 border-2 border-black rounded-lg p-4 relative group"
                        >
                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveFile(uploadedFile.id)}
                            className="absolute top-2 right-2 p-1 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
                            aria-label={`${t.newLot.documentation.removeFile} ${uploadedFile.file.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Image preview or file icon */}
                          {isImage && uploadedFile.preview ? (
                            <div className="mb-3">
                              <img
                                src={uploadedFile.preview}
                                alt={uploadedFile.file.name}
                                className="w-full h-32 object-cover rounded-lg border border-black"
                              />
                            </div>
                          ) : (
                            <div className="mb-3 flex items-center justify-center h-32 bg-white rounded-lg border border-black">
                              <Icon className="w-12 h-12 text-black" />
                            </div>
                          )}

                          {/* File info */}
                          <div className="space-y-1">
                            <p className="font-semibold text-black text-sm truncate" title={uploadedFile.file.name}>
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {uploadedFile.file.type || t.newLot.documentation.fileType}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">
                {t.newLot.certificate.title}
              </h2>
              <div className="text-center py-12">
                <p className="text-base sm:text-lg md:text-xl text-black mb-8">
                  {t.newLot.certificate.description}
                </p>
                <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto border border-black">
                  <div className="text-sm text-black mb-2">{t.newLot.certificate.lotToCertify}</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
                    {formData.wineName || "N/A"}
                  </div>
                  <div className="text-sm text-black">
                    {formData.bottleCount || "0"} {t.newLot.certificate.bottles} • {formData.region || "N/A"}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-6">
                  {t.newLot.certificate.note}
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">{t.newLot.confirm.title}</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6 border border-black">
                  <h3 className="font-semibold mb-4 text-black">{t.newLot.confirm.summary}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.wineName}</span>
                      <span className="font-semibold text-black">{formData.wineName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.varietal}</span>
                      <span className="font-semibold text-black">{formData.varietal || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.region}</span>
                      <span className="font-semibold text-black">{formData.region || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.vintage}</span>
                      <span className="font-semibold text-black">{formData.vintage || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.bottleCount}</span>
                      <span className="font-semibold text-black">{formData.bottleCount || "N/A"} {t.newLot.certificate.bottles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.price}</span>
                      <span className="font-semibold text-black">{formData.priceUSDC ? `${parseFloat(formData.priceUSDC).toLocaleString()} USDC` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">{t.newLot.confirm.documents}</span>
                      <span className="font-semibold text-black">{uploadedFiles.length} {t.newLot.confirm.files}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCertifyLot}
                  className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
                >
                  {t.newLot.confirm.certifyButton}
                </button>
              </div>
            </div>
          )}

          {/* Success Screen with QR Code */}
          <AnimatePresence>
            {isCertified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    // Don't close on background click, require explicit action
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-black"
                >
                  <div className="text-center">
                    {/* Success Icon */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-green-100 rounded-full p-4">
                        <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                      </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
                      {t.newLot.success.title}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-8">
                      {t.newLot.success.description}
                    </p>

                    {/* Certificate Token Display */}
                    <div className="bg-black text-white rounded-xl p-4 sm:p-6 mb-8">
                      <div className="text-xs sm:text-sm text-gray-300 mb-2">{t.newLot.success.certificateToken}</div>
                      <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold break-all">
                        {wttToken}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-black mb-6 inline-block">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                        <h3 className="text-lg sm:text-xl font-semibold text-black">
                          {t.newLot.success.qrTitle}
                        </h3>
                      </div>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <div id="qr-code-container">
                          <QRCodeSVG
                            id="qr-code-svg"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trazabilidad/${lotId}`}
                            size={256}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-4 max-w-xs mx-auto">
                        {t.newLot.success.qrDescription}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={handleDownloadQR}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        {t.newLot.success.downloadQR}
                      </button>
                      <Link
                        href={`/lote/${lotId}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                      >
                        {t.newLot.success.viewLotDetails}
                      </Link>
                      <Link
                        href="/lotes"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        {t.newLot.success.backToLots}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-8 border-t border-black">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-colors",
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              )}
            >
              {t.newLot.navigation.previous}
            </button>

            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !isStep1Complete()) ||
                (currentStep === 2 && !isStep2Complete())
              }
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-colors",
                (currentStep === 1 && !isStep1Complete()) ||
                (currentStep === 2 && !isStep2Complete())
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              )}
            >
              {currentStep === 4 ? t.newLot.navigation.finish : t.newLot.navigation.next}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

