import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../../services/api';
import { usePhotoSession } from '../../contexts/PhotoSessionContext';
import PremiumPhotoLayout from './PremiumPhotoLayout';

export default function AnimateStep() {
  const navigate = useNavigate();
  const { sessionId, productPhotos } = usePhotoSession();

  const [animationStyle, setAnimationStyle] = useState<'SUBTLE_CINEMATIC' | 'LOOKBOOK' | 'DYNAMIC'>('SUBTLE_CINEMATIC');
  const [animationDuration, setAnimationDuration] = useState(7);
  const [isCreatingAnimation, setIsCreatingAnimation] = useState(false);

  const handleCreateAnimation = async () => {
    if (!sessionId || productPhotos.length === 0) {
      toast.error('Please complete previous steps first');
      navigate('/premium-photo/upload');
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

  const handleBack = () => {
    navigate('/premium-photo/upscale');
  };

  return (
    <PremiumPhotoLayout>
      <div className="bg-gray-900 rounded-lg p-8">
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

        <div className="flex items-center space-x-3">
          {sessionId && (
            <button
              onClick={() => navigate(`/analytics/${sessionId}`)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Kalite Analizi</span>
            </button>
          )}
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg"
          >
            <span>Tamamla</span>
          </button>
        </div>
      </div>
    </PremiumPhotoLayout>
  );
}
