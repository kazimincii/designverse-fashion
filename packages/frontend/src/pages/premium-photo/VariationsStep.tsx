import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../../services/api';
import { usePhotoSession } from '../../contexts/PhotoSessionContext';
import PremiumPhotoLayout from './PremiumPhotoLayout';

export default function VariationsStep() {
  const navigate = useNavigate();
  const { sessionId, productPhotos } = usePhotoSession();

  const [selectedMood, setSelectedMood] = useState('minimalist');
  const [selectedFraming, setSelectedFraming] = useState('full-body');
  const [variationCount, setVariationCount] = useState(4);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  const handleGenerateVariations = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      navigate('/premium-photo/upload');
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

  const handleNext = () => {
    navigate('/premium-photo/upscale');
  };

  const handleBack = () => {
    navigate('/premium-photo/enhance');
  };

  return (
    <PremiumPhotoLayout>
      <div className="bg-gray-900 rounded-lg p-8">
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
