import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { photoSessionApi } from '../../services/api';
import { usePhotoSession, UploadedPhoto } from '../../contexts/PhotoSessionContext';
import PremiumPhotoLayout from './PremiumPhotoLayout';

export default function UploadStep() {
  const navigate = useNavigate();
  const {
    sessionId,
    setSessionId,
    productPhotos,
    setProductPhotos,
    modelPhotos,
    setModelPhotos,
  } = usePhotoSession();

  const productInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    const newPhoto = {
      file,
      preview,
      subType,
      uploading: true,
    };

    if (subType === 'PRODUCT') {
      setProductPhotos([...productPhotos, newPhoto]);
    } else {
      setModelPhotos([...modelPhotos, newPhoto]);
    }

    try {
      const currentSessionId = await createSessionIfNeeded();
      const response = await photoSessionApi.uploadPhoto(currentSessionId, file, subType);
      const photoAsset = response.data.data.photoAsset;

      const updatedPhoto = { ...newPhoto, id: photoAsset.id, uploading: false };
      if (subType === 'PRODUCT') {
        setProductPhotos((prev: UploadedPhoto[]) =>
          prev.map((p: UploadedPhoto) => p.preview === preview ? updatedPhoto : p)
        );
      } else {
        setModelPhotos((prev: UploadedPhoto[]) =>
          prev.map((p: UploadedPhoto) => p.preview === preview ? updatedPhoto : p)
        );
      }

      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload photo');
      if (subType === 'PRODUCT') {
        setProductPhotos((prev: UploadedPhoto[]) => prev.filter((p: UploadedPhoto) => p.preview !== preview));
      } else {
        setModelPhotos((prev: UploadedPhoto[]) => prev.filter((p: UploadedPhoto) => p.preview !== preview));
      }
      URL.revokeObjectURL(preview);
    }
  };

  const removePhoto = (preview: string, subType: 'PRODUCT' | 'MODEL') => {
    if (subType === 'PRODUCT') {
      setProductPhotos((prev: UploadedPhoto[]) => prev.filter((p: UploadedPhoto) => p.preview !== preview));
    } else {
      setModelPhotos((prev: UploadedPhoto[]) => prev.filter((p: UploadedPhoto) => p.preview !== preview));
    }
    URL.revokeObjectURL(preview);
  };

  const handleNext = () => {
    if (productPhotos.length === 0 || modelPhotos.length === 0) {
      toast.error('Please upload both product and model photos');
      return;
    }
    navigate('/premium-photo/enhance');
  };

  return (
    <PremiumPhotoLayout>
      <div className="bg-gray-900 rounded-lg p-8">
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
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
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
