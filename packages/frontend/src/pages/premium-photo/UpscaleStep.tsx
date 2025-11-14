import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize2, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../../services/api';
import { usePhotoSession } from '../../contexts/PhotoSessionContext';
import PremiumPhotoLayout from './PremiumPhotoLayout';

export default function UpscaleStep() {
  const navigate = useNavigate();
  const { sessionId, productPhotos } = usePhotoSession();

  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [isUpscaling, setIsUpscaling] = useState(false);

  const handleUpscaleImage = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      navigate('/premium-photo/upload');
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

  const handleNext = () => {
    navigate('/premium-photo/animate');
  };

  const handleBack = () => {
    navigate('/premium-photo/variations');
  };

  return (
    <PremiumPhotoLayout>
      <div className="bg-gray-900 rounded-lg p-8">
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
