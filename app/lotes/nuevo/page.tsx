"use client";

import { useState, useRef, useEffect } from "react";
import { Wine, Upload, DollarSign, CheckCircle, X, File, Image as ImageIcon, Download, QrCode, Loader2, AlertCircle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import StatusManager from "./components/StatusManager";
import { getCurrentLotStatusByAddress } from "@/lib/wine-tokens";

const steps = [
  {
    id: 1,
    title: "Información del Lote",
    description: "Detalles del lote",
    icon: Wine,
  },
  {
    id: 2,
    title: "Documentación",
    description: "Certificados y fotos",
    icon: Upload,
  },
  {
    id: 3,
    title: "Certificado de Vino",
    description: "Crear certificado único",
    icon: DollarSign,
  },
  {
    id: 4,
    title: "Confirmar",
    description: "Revisa y certifica",
    icon: CheckCircle,
  },
];

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

export default function NuevoLotePage() {
  const router = useRouter();
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
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedLotId, setSavedLotId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push(`/auth/login?redirect=${encodeURIComponent("/lotes/nuevo")}`);
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

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
        errors.wineName = "El nombre del lote es requerido";
      }
      if (!formData.varietal.trim()) {
        errors.varietal = "El varietal es requerido";
      }
      if (!formData.region.trim()) {
        errors.region = "La región es requerida";
      }
      if (!formData.vintage.trim()) {
        errors.vintage = "La añada es requerida";
      }
      if (!formData.bottleCount.trim()) {
        errors.bottleCount = "La cantidad de botellas es requerida";
      } else if (parseInt(formData.bottleCount) <= 0) {
        errors.bottleCount = "La cantidad debe ser mayor a 0";
      }
      if (!formData.priceUSDC.trim()) {
        errors.priceUSDC = "El precio es requerido";
      } else if (parseFloat(formData.priceUSDC) <= 0) {
        errors.priceUSDC = "El precio debe ser mayor a 0";
      }
    } else if (currentStep === 2) {
      if (uploadedFiles.length === 0) {
        errors.files = "Debes subir al menos un archivo";
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

  const uploadFileToStorage = async (file: File, lotId: string, index: number): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lotId}/${Date.now()}-${index}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabaseClient.storage
        .from('wine-lots')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        // If bucket doesn't exist, log a helpful message
        if (error.message.includes('not found') || error.message.includes('Bucket')) {
          console.warn('Storage bucket "wine-lots" may not exist. Please create it in Supabase Storage settings.');
        }
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('wine-lots')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadFileToStorage:', error);
      return null;
    }
  };

  const handleCertifyLot = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get authenticated user session
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Debes iniciar sesión para crear un lote. Por favor, inicia sesión e intenta nuevamente.");
      }

      // Generate lot ID and token code
      const id = generateLotId();
      const tokenCode = generateWTTToken().substring(0, 12).toUpperCase() || id.toUpperCase().substring(0, 12);

      // Extract region and country from region field (format: "City, Country")
      const regionParts = formData.region.split(',').map(s => s.trim());
      const region = regionParts[0] || formData.region;
      const country = regionParts[1] || 'Unknown';

      // Upload files to Supabase Storage
      const documentationUrls: string[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const url = await uploadFileToStorage(uploadedFiles[i].file, id, i);
        if (url) {
          documentationUrls.push(url);
        }
      }

      // Generate symbol from wine name (first 3-4 letters + vintage)
      const symbol = formData.wineName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4) + formData.vintage.slice(-2);

      // Prepare wine_metadata matching WineLotMetadata type
      const wine_metadata = {
        lot_id: id,
        winery_name: formData.wineName,
        region: region,
        country: country,
        vintage: parseInt(formData.vintage),
        varietal: formData.varietal,
        bottle_count: parseInt(formData.bottleCount),
        description: formData.description || null,
        token_code: tokenCode,
        // Additional metadata
        price_usdc: parseFloat(formData.priceUSDC),
        documentation_urls: documentationUrls,
      };

      // Call wine-tokens-create edge function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurado");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/wine-tokens-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.wineName,
          symbol: symbol,
          decimal: 0,
          wine_metadata: wine_metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error al crear el token: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error("Error al crear el token de vino. Por favor, intenta nuevamente.");
      }

      // Set state for success UI
      setTokenAddress(result.token.address);
      setWttToken(result.token.address); // Keep for backward compatibility
      setLotId(id);
      setTransactionHash(result.token.transaction_hash);
      setSavedLotId(result.token.address); // Use token address as identifier
      setIsCertified(true);
      
      // Load current status (if any)
      await loadCurrentStatus(result.token.address);
      
      console.log("Token creado exitosamente:", {
        tokenAddress: result.token.address,
        transactionHash: result.token.transaction_hash,
        lotId: id,
      });
    } catch (error) {
      console.error("Error certifying lot:", error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "Ocurrió un error al certificar el lote. Por favor, intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCurrentStatus = async (tokenAddr: string) => {
    if (!tokenAddr) return;
    
    setIsLoadingStatus(true);
    try {
      const statusEvent = await getCurrentLotStatusByAddress(tokenAddr);
      if (statusEvent) {
        setCurrentStatus(statusEvent.status);
      }
    } catch (error) {
      console.error("Error loading status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleStatusUpdated = async (event: any) => {
    if (event && event.status) {
      setCurrentStatus(event.status);
    }
    // Reload status to get latest
    if (tokenAddress) {
      await loadCurrentStatus(tokenAddress);
    }
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

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/lotes"
          className="inline-flex items-center gap-2 text-black hover:text-gray-800 mb-4 sm:mb-6 md:mb-8 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          <span className="font-medium">Volver a Lotes</span>
        </Link>

        {/* Header */}
        <motion.div
          className="text-center mb-6 sm:mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            Registrar Nuevo <span className="text-black">Lote</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black px-4">
            Certifica un lote de vino y genera su Certificado de Autenticidad con la mejor tecnología
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
                Información del Lote
              </h2>

              <div>
                <label
                  htmlFor="wineName"
                  className="block text-sm font-medium text-black mb-2"
                >
                  Nombre del Lote/Vino <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  id="wineName"
                  name="wineName"
                  value={formData.wineName}
                  onChange={handleInputChange}
                  placeholder="Ej: Malbec Reserva 2020"
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
                    Varietal <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="varietal"
                    name="varietal"
                    value={formData.varietal}
                    onChange={handleInputChange}
                    placeholder="Ej: Malbec, Cabernet Sauvignon"
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
                    Región <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder="Ej: Mendoza, Argentina"
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
                    Añada <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    id="vintage"
                    name="vintage"
                    value={formData.vintage}
                    onChange={handleInputChange}
                    placeholder="Ej: 2020"
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
                    Cantidad de Botellas <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    id="bottleCount"
                    name="bottleCount"
                    value={formData.bottleCount}
                    onChange={handleInputChange}
                    placeholder="Ej: 5000"
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
                    Precio (USDC) <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    id="priceUSDC"
                    name="priceUSDC"
                    value={formData.priceUSDC}
                    onChange={handleInputChange}
                    placeholder="Ej: 1500.50"
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
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe el lote: varietal, proceso de elaboración, características del terroir..."
                  rows={6}
                  className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">Documentación</h2>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Seleccionar archivos"
              />

              {/* Upload area */}
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-black mx-auto mb-4" />
                <p className="text-black mb-4">
                  Sube certificados de autenticidad, fotos de las botellas y cualquier documentación relevante
                </p>
                <button
                  onClick={handleFileSelect}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Seleccionar Archivos
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  Formatos aceptados: Imágenes (JPG, PNG), PDF, DOC, DOCX
                </p>
                {validationErrors.files && (
                  <p className="mt-4 text-sm text-red-600 font-medium">{validationErrors.files}</p>
                )}
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">
                    Archivos Subidos ({uploadedFiles.length})
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
                            aria-label={`Eliminar ${uploadedFile.file.name}`}
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
                              {uploadedFile.file.type || "Tipo desconocido"}
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
                Certificado de Vino
              </h2>
              <div className="text-center py-12">
                <p className="text-base sm:text-lg md:text-xl text-black mb-8">
                  Se generará un Certificado de Autenticidad único para este lote. El certificado representará este lote de forma inmutable usando la mejor tecnología.
                </p>
                <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto border border-black">
                  <div className="text-sm text-black mb-2">Lote a certificar</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
                    {formData.wineName || "N/A"}
                  </div>
                  <div className="text-sm text-black">
                    {formData.bottleCount || "0"} botellas • {formData.region || "N/A"}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-6">
                  Una vez generado, el Certificado de Autenticidad quedará registrado permanentemente con la mejor tecnología
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-black">Confirmar Certificación</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6 border border-black">
                  <h3 className="font-semibold mb-4 text-black">Resumen del Lote</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black">Lote/Vino:</span>
                      <span className="font-semibold text-black">{formData.wineName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Varietal:</span>
                      <span className="font-semibold text-black">{formData.varietal || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Región:</span>
                      <span className="font-semibold text-black">{formData.region || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Añada:</span>
                      <span className="font-semibold text-black">{formData.vintage || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Cantidad:</span>
                      <span className="font-semibold text-black">{formData.bottleCount || "N/A"} botellas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Precio (USDC):</span>
                      <span className="font-semibold text-black">{formData.priceUSDC ? `${parseFloat(formData.priceUSDC).toLocaleString()} USDC` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Documentos:</span>
                      <span className="font-semibold text-black">{uploadedFiles.length} archivo(s)</span>
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">Error al certificar</p>
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleCertifyLot}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2",
                    isSubmitting
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Generar Certificado de Vino y Certificar Lote"
                  )}
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
                      ¡Lote Certificado Exitosamente!
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-8">
                      Tu Certificado de Autenticidad ha sido generado y registrado con la mejor tecnología
                    </p>

                    {/* Certificate Token Display */}
                    <div className="bg-black text-white rounded-xl p-4 sm:p-6 mb-8 space-y-4">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-300 mb-2">Dirección del Token (Blockchain)</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold break-all">
                          {tokenAddress || wttToken}
                        </div>
                      </div>
                      {transactionHash && (
                        <div>
                          <div className="text-xs sm:text-sm text-gray-300 mb-2">Hash de Transacción</div>
                          <div className="text-sm sm:text-base font-mono break-all text-gray-200">
                            {transactionHash}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs sm:text-sm text-gray-300 mb-2">ID del Lote</div>
                        <div className="text-sm sm:text-base font-mono break-all text-gray-200">
                          {lotId}
                        </div>
                      </div>
                    </div>

                    {/* Status Section */}
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-black" />
                          <h3 className="text-lg sm:text-xl font-semibold text-black">
                            Estado del Lote
                          </h3>
                        </div>
                        {tokenAddress && (
                          <button
                            onClick={() => setShowStatusManager(true)}
                            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                          >
                            <Settings className="w-4 h-4" />
                            {currentStatus ? "Actualizar Estado" : "Establecer Estado"}
                          </button>
                        )}
                      </div>
                      
                      {isLoadingStatus ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Cargando estado...</span>
                        </div>
                      ) : currentStatus ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Estado actual:</span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold capitalize">
                              {currentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            El estado está registrado en la blockchain para trazabilidad inmutable
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            No se ha establecido un estado inicial para este lote.
                          </p>
                          <p className="text-xs text-gray-500">
                            Establece el estado inicial para comenzar el seguimiento del ciclo de vida del vino.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-xl p-6 sm:p-8 border-2 border-black mb-6 inline-block">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                        <h3 className="text-lg sm:text-xl font-semibold text-black">
                          Código QR de Trazabilidad
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
                        Escanea este código para ver la trazabilidad completa del lote
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={handleDownloadQR}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Descargar QR
                      </button>
                      {tokenAddress && (
                        <Link
                          href={`/lote/${tokenAddress}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                        >
                          Ver Detalles del Token
                        </Link>
                      )}
                      {lotId && (
                        <Link
                          href={`/trazabilidad/${lotId}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                        >
                          Ver Trazabilidad
                        </Link>
                      )}
                      <Link
                        href="/lotes"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Volver a Lotes
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Manager Modal */}
          <AnimatePresence>
            {showStatusManager && tokenAddress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
                onClick={() => setShowStatusManager(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border-2 border-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-black">Gestionar Estado del Lote</h3>
                    <button
                      onClick={() => setShowStatusManager(false)}
                      className="text-gray-500 hover:text-black transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <StatusManager
                    tokenAddress={tokenAddress}
                    currentStatus={currentStatus}
                    onStatusUpdated={handleStatusUpdated}
                    onClose={() => setShowStatusManager(false)}
                  />
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
              Anterior
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
              {currentStep === 4 ? "Finalizar" : "Siguiente"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
