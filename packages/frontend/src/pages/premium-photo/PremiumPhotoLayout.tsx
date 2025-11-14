import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, Maximize2, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PremiumPhotoLayoutProps {
  children: ReactNode;
}

const steps = [
  {
    number: 1,
    title: 'Ürün & Manken Yükle',
    path: '/premium-photo/upload',
    icon: Upload,
  },
  {
    number: 2,
    title: 'AI İyileştirme',
    path: '/premium-photo/enhance',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Poz & Açı Varyasyonları',
    path: '/premium-photo/variations',
    icon: ImageIcon,
  },
  {
    number: 4,
    title: 'Yüksek Çözünürlük',
    path: '/premium-photo/upscale',
    icon: Maximize2,
  },
  {
    number: 5,
    title: 'Video Animasyon',
    path: '/premium-photo/animate',
    icon: Play,
  },
];

export default function PremiumPhotoLayout({ children }: PremiumPhotoLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepIndex = steps.findIndex(step => location.pathname.startsWith(step.path));
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

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
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent'
                        : currentStep > step.number
                        ? 'bg-green-600 border-transparent'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                    onClick={() => navigate(step.path)}
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
        {children}
      </main>
    </div>
  );
}
