import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, Sparkles, Image as ImageIcon, Maximize2, Play, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../services/api';

interface UploadedPhoto {
  id?: string;
  file: File;
  preview: string;
  subType: 'PRODUCT' | 'MODEL';
  uploading?: boolean;
}

export default function PremiumPhotoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [productPhotos, setProductPhotos] = useState<UploadedPhoto[]>([]);
  const [modelPhotos, setModelPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('Studio');
  const [selectedLighting, setSelectedLighting] = useState('Soft');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState('minimalist');
  const [selectedFraming, setSelectedFraming] = useState('full-body');
  const [variationCount, setVariationCount] = useState(4);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [animationStyle, setAnimationStyle] = useState<'SUBTLE_CINEMATIC' | 'LOOKBOOK' | 'DYNAMIC'>('SUBTLE_CINEMATIC');
  const [animationDuration, setAnimationDuration] = useState(7);
  const [isCreatingAnimation, setIsCreatingAnimation] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      number: 1,
      title: 'Ürün & Manken Yükle',
      description: 'Ürün fotoğraflarınızı ve mankeninizi yükleyin',
      icon: Upload,
    },
    {
      number: 2,
      title: 'AI İyileştirme',
      description: 'Gelişmiş AI ile profesyonel çekimler',
      icon: Sparkles,
    },
    {
      number: 3,
      title: 'Poz & Açı Varyasyonları',
      description: 'Farklı pozlar ve kamera açıları oluşturun',
      icon: ImageIcon,
    },
    {
      number: 4,
      title: 'Yüksek Çözünürlük',
      description: 'Baskı kalitesinde büyütme (2×, 4×)',
      icon: Maximize2,
    },
    {
      number: 5,
      title: 'Video Animasyon',
      description: 'Sinematik videolara dönüştürün',
      icon: Play,
    },
  ];

  const createSessionIfNeeded = async () => {
    if (!sessionId) {
      try {
        const response = await photoSessionApi.createSession({
          title: `Photo Session ${new Date().toLocaleDateString()}`,
        });
        const newSessionId = response.data.data.session.id;
        setSessionId(newSessionId);
        return newSessionId;
      } catch (error: any) {
        toast.error('Failed to create session');
        throw error;
      }
    }
    return sessionId;
  };

  const handleFileSelect = async (files: FileList | null, subType: 'PRODUCT' | 'MODEL') => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    const newPhoto: UploadedPhoto = {
      file,
      preview,
      subType,
      uploading: true,
    };

    // Add to state
    if (subType === 'PRODUCT') {
      setProductPhotos([...productPhotos, newPhoto]);
    } else {
      setModelPhotos([...modelPhotos, newPhoto]);
    }

    try {
      // Create session if needed
      const currentSessionId = await createSessionIfNeeded();

      // Upload photo
      const response = await photoSessionApi.uploadPhoto(currentSessionId, file, subType);
      const photoAsset = response.data.data.photoAsset;

      // Update with asset ID
      const updatedPhoto = { ...newPhoto, id: photoAsset.id, uploading: false };
      if (subType === 'PRODUCT') {
        setProductPhotos(prev =>
          prev.map(p => p.preview === preview ? updatedPhoto : p)
        );
      } else {
        setModelPhotos(prev =>
          prev.map(p => p.preview === preview ? updatedPhoto : p)
        );
      }

      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload photo');
      // Remove from state on error
      if (subType === 'PRODUCT') {
        setProductPhotos(prev => prev.filter(p => p.preview !== preview));
      } else {
        setModelPhotos(prev => prev.filter(p => p.preview !== preview));
      }
      URL.revokeObjectURL(preview);
    }
  };

  const removePhoto = (preview: string, subType: 'PRODUCT' | 'MODEL') => {
    if (subType === 'PRODUCT') {
      setProductPhotos(prev => prev.filter(p => p.preview !== preview));
    } else {
      setModelPhotos(prev => prev.filter(p => p.preview !== preview));
    }
    URL.revokeObjectURL(preview);
  };

  const handleGenerateEditorialShots = async () => {
    if (!sessionId || productPhotos.length === 0 || modelPhotos.length === 0) {
      toast.error('Please upload photos first');
      return;
    }

    const productAssetId = productPhotos[0].id;
    const modelAssetId = modelPhotos[0].id;

    if (!productAssetId || !modelAssetId) {
      toast.error('Please wait for photos to finish uploading');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await photoSessionApi.applyVirtualTryOn(sessionId, {
        productAssetId,
        modelAssetId,
      });

      const job = response.data.data.job;
      toast.success('Virtual try-on job started! This may take a few minutes...');

      // Store job info
      setGeneratedResults([job]);

      // TODO: Poll for job completion or use WebSocket
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      return;
    }

    const baseAssetId = productPhotos[0].id;
    if (!baseAssetId) {
      toast.error('No base image found');
      return;
    }

    setIsGeneratingVariations(true);
    try {
      await photoSessionApi.generateVariations(sessionId, {
        baseAssetId,
        mood: selectedMood,
        framing: selectedFraming,
        count: variationCount,
      });

      toast.success(`Generating ${variationCount} variations! This may take a few minutes...`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start generation');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleUpscaleImage = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      return;
    }

    const assetId = productPhotos[0].id;
    if (!assetId) {
      toast.error('No image found to upscale');
      return;
    }

    setIsUpscaling(true);
    try {
      await photoSessionApi.upscaleImage(sessionId, {
        assetId,
        factor: upscaleFactor,
      });

      toast.success(`Upscaling to ${upscaleFactor}x! This may take a few minutes...`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start upscaling');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleCreateAnimation = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      return;
    }

    const assetIds = productPhotos.map(p => p.id).filter(Boolean) as string[];
    if (assetIds.length === 0) {
      toast.error('No images found to animate');
      return;
    }

    setIsCreatingAnimation(true);
    try {
      await photoSessionApi.createAnimation(sessionId, {
        assetIds,
        duration: animationDuration,
        style: animationStyle,
      });

      toast.success('Creating cinematic animation! This may take a few minutes...');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start animation');
    } finally {
      setIsCreatingAnimation(false);
    }
  };

  const handleNext = () => {
    // Validate before moving to next step
    if (currentStep === 1) {
      if (productPhotos.length === 0 || modelPhotos.length === 0) {
        toast.error('Please upload both product and model photos');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/workspace')}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Premium Photo Mode (Beta)</h1>
                <p className="text-sm text-gray-400">5 Adımda Premium Moda Çekimi</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Credits: {user?.creditsBalance || 0}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent'
                        : currentStep > step.number
                        ? 'bg-green-600 border-transparent'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium">Adım {step.number}</div>
                    <div className="text-xs text-gray-400 max-w-[100px]">{step.title}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-lg p-8">
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ürün & Manken Fotoğraflarını Yükleyin</h2>
                <p className="text-gray-400">
                  Ürün fotoğraflarınızı ve model görselinizi yükleyin. AI'mız görsellerinizi analiz eder.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Product Photos */}
                <div>
                  <input
                    ref={productInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, 'PRODUCT')}
                  />
                  <div
                    onClick={() => productInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-blue-500 cursor-pointer transition-all"
                  >
                    <Upload className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="font-semibold mb-2">Ürün Fotoğrafları</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Flat lay, ghost mannequin veya packshot
                    </p>
                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm">
                      Dosya Seç
                    </button>
                  </div>

                  {/* Product Photos Preview */}
                  {productPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {productPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt="Product"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {photo.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <div className="text-xs">Uploading...</div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(photo.preview, 'PRODUCT');
                            }}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Photos */}
                <div>
                  <input
                    ref={modelInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, 'MODEL')}
                  />
                  <div
                    onClick={() => modelInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-purple-500 cursor-pointer transition-all"
                  >
                    <Upload className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="font-semibold mb-2">Manken Fotoğrafları</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Yüz + vücut görselieri
                    </p>
                    <button className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-sm">
                      Dosya Seç
                    </button>
                  </div>

                  {/* Model Photos Preview */}
                  {modelPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {modelPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt="Model"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {photo.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <div className="text-xs">Uploading...</div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(photo.preview, 'MODEL');
                            }}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📌 İpuçları:</h4>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>Minimum 1024px çözünürlük</li>
                  <li>JPG veya PNG formatında</li>
                  <li>İyi aydınlatılmış, net görüntüler</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: AI Enhancement */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">AI İyileştirme Süreci</h2>
                <p className="text-gray-400">
                  Gelişmiş AI'mız yeni pozlar ve sahneler oluşturur, profesyonel aydınlatma uygular.
                </p>
              </div>

              {/* Preview uploaded photos */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {productPhotos.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Ürün</div>
                    <img
                      src={productPhotos[0].preview}
                      alt="Product"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {modelPhotos.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Manken</div>
                    <img
                      src={modelPhotos[0].preview}
                      alt="Model"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sahne Stili</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Studio', 'Urban', 'Editorial', 'Lifestyle'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`py-3 rounded-lg transition-all border ${
                          selectedStyle === style
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Aydınlatma</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Soft', 'Dramatic', 'High-key', 'Natural'].map((lighting) => (
                      <button
                        key={lighting}
                        onClick={() => setSelectedLighting(lighting)}
                        className={`py-3 rounded-lg transition-all border ${
                          selectedLighting === lighting
                            ? 'bg-purple-600 border-purple-500'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-purple-500'
                        }`}
                      >
                        {lighting}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateEditorialShots}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-lg font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {isGenerating
                        ? 'Generating...'
                        : 'Generate Editorial Shots (15 credits)'}
                    </span>
                  </span>
                </button>

                {/* Show generation results */}
                {generatedResults.length > 0 && (
                  <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">✓ Job Started</h4>
                    <p className="text-sm text-gray-400">
                      Your virtual try-on is being processed. This may take a few minutes.
                      You can proceed to the next steps or wait for results.
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Job ID: {generatedResults[0].id}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Pose Variations */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Poz & Açı Varyasyonları</h2>
                <p className="text-gray-400">
                  Aynı konseptle farklı pozlar ve kamera açıları oluşturun.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mood</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['minimalist', 'dramatic', 'playful'].map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`py-3 rounded-lg transition-all border capitalize ${
                          selectedMood === mood
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Framing</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['full-body', 'medium-shot', 'close-up'].map((framing) => (
                      <button
                        key={framing}
                        onClick={() => setSelectedFraming(framing)}
                        className={`py-3 rounded-lg transition-all border capitalize ${
                          selectedFraming === framing
                            ? 'bg-purple-600 border-purple-500'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-purple-500'
                        }`}
                      >
                        {framing.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Varyasyon Sayısı: {variationCount}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={variationCount}
                    onChange={(e) => setVariationCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>4</span>
                    <span>6</span>
                    <span>8</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateVariations}
                  disabled={isGeneratingVariations}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-lg font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>
                      {isGeneratingVariations
                        ? 'Generating...'
                        : `Generate ${variationCount} Variations (${variationCount * 5} credits)`}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Upscaling */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Yüksek Çözünürlük Büyütme</h2>
                <p className="text-gray-400">
                  Baskı kalitesinde yüksek çözünürlüklü görüntüler elde edin.
                </p>
              </div>

              {/* Preview */}
              {productPhotos.length > 0 && (
                <div className="flex justify-center">
                  <div className="max-w-md">
                    <div className="text-sm text-gray-400 mb-2">Mevcut Görüntü</div>
                    <img
                      src={productPhotos[0].preview}
                      alt="Current"
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Büyütme Faktörü</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[2, 3, 4].map((factor) => {
                      const credits = factor === 2 ? 5 : factor === 3 ? 10 : 15;
                      return (
                        <button
                          key={factor}
                          onClick={() => setUpscaleFactor(factor)}
                          className={`py-4 rounded-lg transition-all border ${
                            upscaleFactor === factor
                              ? 'bg-blue-600 border-blue-500'
                              : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500'
                          }`}
                        >
                          <div className="font-bold text-lg">{factor}x</div>
                          <div className="text-xs text-gray-400 mt-1">{credits} credits</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📊 Çıktı Boyutları</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>2x: 2048×2048px (Social Media, Web)</li>
                    <li>3x: 3072×3072px (A4 Baskı, Katalog)</li>
                    <li>4x: 4096×4096px (Poster, Billboard)</li>
                  </ul>
                </div>

                <button
                  onClick={handleUpscaleImage}
                  disabled={isUpscaling}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-lg font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Maximize2 className="w-5 h-5" />
                    <span>
                      {isUpscaling
                        ? 'Upscaling...'
                        : `Upscale to ${upscaleFactor}x (${
                            upscaleFactor === 2 ? 5 : upscaleFactor === 3 ? 10 : 15
                          } credits)`}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Animation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Sinematik Video Animasyon</h2>
                <p className="text-gray-400">
                  Fotoğraflarınızı profesyonel sinematik videolara dönüştürün.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Animasyon Stili</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'SUBTLE_CINEMATIC', label: 'Subtle Cinematic', desc: 'Yumuşak geçişler' },
                      { value: 'LOOKBOOK', label: 'Lookbook', desc: 'Moda kataloğu' },
                      { value: 'DYNAMIC', label: 'Dynamic', desc: 'Hareketli & enerji' },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setAnimationStyle(style.value as any)}
                        className={`py-4 rounded-lg transition-all border ${
                          animationStyle === style.value
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500'
                        }`}
                      >
                        <div className="font-semibold">{style.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Süre: {animationDuration} saniye
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    value={animationDuration}
                    onChange={(e) => setAnimationDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5s</span>
                    <span>10s</span>
                    <span>15s</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🎬 Video Özellikleri</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 1080p Full HD çözünürlük</li>
                    <li>• Profesyonel renk paletleri</li>
                    <li>• Instagram Reels, TikTok uyumlu</li>
                    <li>• Story editörüne eklenebilir</li>
                  </ul>
                </div>

                <button
                  onClick={handleCreateAnimation}
                  disabled={isCreatingAnimation}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-lg font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>
                      {isCreatingAnimation
                        ? 'Creating Animation...'
                        : 'Create Video Animation (12 credits)'}
                    </span>
                  </span>
                </button>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => navigate('/workspace')}
                    className="text-sm text-gray-400 hover:text-white flex items-center space-x-2"
                  >
                    <span>← Workspace'e Dön</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === 5}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg disabled:opacity-50"
          >
            <span>{currentStep === 5 ? 'Tamamla' : 'İleri'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
