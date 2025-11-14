import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Sparkles } from 'lucide-react';
import { referenceApi } from '../services/api';
import toast from 'react-hot-toast';
import { ReferenceType } from '../types/reference';

export default function CreateReferencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'characters' | 'garments' | 'styles';
  const sessionId = searchParams.get('sessionId');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('clothing');
  const [styleType, setStyleType] = useState<ReferenceType>(ReferenceType.STYLE);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [lightingSetup, setLightingSetup] = useState('');
  const [mood, setMood] = useState('');
  const [cameraAngle, setCameraAngle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [autoExtracting, setAutoExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!sessionId) {
    navigate('/premium-photo/upload');
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAutoExtract = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setAutoExtracting(true);
    try {
      const response = await referenceApi.autoExtract(selectedFile);
      const data = response.data.data;

      // Auto-fill based on extracted data
      if (type === 'characters' && data.characterData) {
        toast.success('Character features extracted!');
      } else if (type === 'garments' && data.garmentData) {
        setCategory(data.garmentData.category);
        toast.success('Garment info extracted!');
      } else if (type === 'styles' && data.styleData) {
        if (data.styleData.promptSuggestions && data.styleData.promptSuggestions.length > 0) {
          setPromptTemplate(data.styleData.promptSuggestions.join(', '));
        }
        toast.success('Style features extracted!');
      }
    } catch (error: any) {
      console.error('Auto-extract error:', error);
      toast.error('Failed to extract features');
    } finally {
      setAutoExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId) {
      toast.error('No session ID');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!selectedFile && type !== 'styles') {
      toast.error('Please select an image');
      return;
    }

    if (type === 'styles' && !promptTemplate.trim()) {
      toast.error('Please enter a prompt template');
      return;
    }

    setIsCreating(true);

    try {
      if (type === 'characters' && selectedFile) {
        await referenceApi.createCharacter({
          sessionId,
          name,
          description,
          image: selectedFile,
        });
        toast.success('Character reference created!');
      } else if (type === 'garments' && selectedFile) {
        await referenceApi.createGarment({
          sessionId,
          name,
          description,
          category,
          image: selectedFile,
        });
        toast.success('Garment reference created!');
      } else if (type === 'styles') {
        await referenceApi.createStyle({
          sessionId,
          type: styleType,
          name,
          description,
          promptTemplate,
          negativePrompt,
          lightingSetup,
          mood,
          cameraAngle,
          image: selectedFile || undefined,
        });
        toast.success('Style reference created!');
      }

      navigate(`/references/manage?sessionId=${sessionId}`);
    } catch (error: any) {
      console.error('Create reference error:', error);
      toast.error(error.response?.data?.error || 'Failed to create reference');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/references/manage?sessionId=${sessionId}`)}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                Create {type === 'characters' ? 'Character' : type === 'garments' ? 'Garment' : 'Style'} Reference
              </h1>
              <p className="text-sm text-gray-400">Add a new reference for AI consistency</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-gray-900 rounded-lg p-6">
            <label className="block text-sm font-medium mb-2">
              {type === 'styles' ? 'Reference Image (Optional)' : 'Reference Image *'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Remove
                </button>
                {type !== 'styles' && (
                  <button
                    type="button"
                    onClick={handleAutoExtract}
                    disabled={autoExtracting}
                    className="absolute bottom-2 right-2 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg disabled:opacity-50"
                  >
                    {autoExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Auto-Extract</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all"
              >
                <Upload className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-sm text-gray-400 text-center">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-gray-900 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'characters'
                    ? 'e.g., Model A, Ana Karakter'
                    : type === 'garments'
                    ? 'e.g., Kırmızı Elbise, Siyah Ceket'
                    : 'e.g., Studio Lighting, Urban Scene'
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add details about this reference..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {type === 'garments' && (
            <div className="bg-gray-900 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="clothing">Clothing</option>
                <option value="dress">Dress</option>
                <option value="jacket">Jacket</option>
                <option value="pants">Pants</option>
                <option value="shirt">Shirt</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          )}

          {type === 'styles' && (
            <div className="bg-gray-900 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Style Type *</label>
                <select
                  value={styleType}
                  onChange={(e) => setStyleType(e.target.value as ReferenceType)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value={ReferenceType.STYLE}>Style</option>
                  <option value={ReferenceType.LOCATION}>Location</option>
                  <option value={ReferenceType.LIGHTING}>Lighting</option>
                  <option value={ReferenceType.MOOD}>Mood</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prompt Template *</label>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  rows={3}
                  placeholder="e.g., studio lighting, soft shadows, high-key photography"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be added to prompts for consistency
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Negative Prompt (Optional)</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  placeholder="e.g., harsh lighting, dark shadows"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Lighting Setup</label>
                  <input
                    type="text"
                    value={lightingSetup}
                    onChange={(e) => setLightingSetup(e.target.value)}
                    placeholder="e.g., soft, dramatic"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mood</label>
                  <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="e.g., minimalist"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Camera Angle</label>
                  <input
                    type="text"
                    value={cameraAngle}
                    onChange={(e) => setCameraAngle(e.target.value)}
                    placeholder="e.g., eye-level"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/references/manage?sessionId=${sessionId}`)}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Reference</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
