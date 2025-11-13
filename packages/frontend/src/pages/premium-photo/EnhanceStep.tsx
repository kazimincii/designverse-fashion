import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../../services/api';
import { usePhotoSession } from '../../contexts/PhotoSessionContext';
import PremiumPhotoLayout from './PremiumPhotoLayout';
import ReferenceSelector from '../../components/ReferenceSelector';

export default function EnhanceStep() {
  const navigate = useNavigate();
  const {
    sessionId,
    productPhotos,
    modelPhotos,
    selectedStyle,
    setSelectedStyle,
    selectedLighting,
    setSelectedLighting,
    generatedResults,
    setGeneratedResults,
  } = usePhotoSession();

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharacterRef, setSelectedCharacterRef] = useState<string | undefined>();
  const [selectedGarmentRef, setSelectedGarmentRef] = useState<string | undefined>();

  const handleGenerateEditorialShots = async () => {
    if (!sessionId || productPhotos.length === 0 || modelPhotos.length === 0) {
      toast.error('Please upload photos first');
      navigate('/premium-photo/upload');
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    navigate('/premium-photo/variations');
  };

  const handleBack = () => {
    navigate('/premium-photo/upload');
  };

  return (
    <PremiumPhotoLayout>
      <div className="bg-gray-900 rounded-lg p-8">
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

          {/* Reference Selectors */}
          {sessionId && (
            <div className="space-y-6 bg-gray-800/50 rounded-lg p-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>AI Consistency References</span>
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Select references to maintain consistent character and garment appearance across generations
                </p>
              </div>

              <ReferenceSelector
                sessionId={sessionId}
                type="character"
                selectedId={selectedCharacterRef}
                onSelect={setSelectedCharacterRef}
                label="Character Reference (Optional)"
              />

              <ReferenceSelector
                sessionId={sessionId}
                type="garment"
                selectedId={selectedGarmentRef}
                onSelect={setSelectedGarmentRef}
                label="Garment Reference (Optional)"
              />
            </div>
          )}

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
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg"
        >
          <span>İleri</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </PremiumPhotoLayout>
  );
}
