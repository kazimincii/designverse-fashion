import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Shirt, Palette, Trash2, Edit2 } from 'lucide-react';
import { referenceApi } from '../services/api';
import { usePhotoSession } from '../contexts/PhotoSessionContext';
import toast from 'react-hot-toast';
import type {
  CharacterReference,
  GarmentReference,
  StyleReference,
  ReferenceStats,
} from '../types/reference';

type TabType = 'characters' | 'garments' | 'styles';

export default function ReferenceManagementPage() {
  const navigate = useNavigate();
  const { sessionId } = usePhotoSession();

  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [characters, setCharacters] = useState<CharacterReference[]>([]);
  const [garments, setGarments] = useState<GarmentReference[]>([]);
  const [styles, setStyles] = useState<StyleReference[]>([]);
  const [stats, setStats] = useState<ReferenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadReferences();
      loadStats();
    }
  }, [sessionId]);

  const loadReferences = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const response = await referenceApi.getSessionReferences(sessionId, true);
      const data = response.data.data;

      setCharacters(data.characters || []);
      setGarments(data.garments || []);
      setStyles(data.styles || []);
    } catch (error: any) {
      console.error('Error loading references:', error);
      toast.error('Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!sessionId) return;

    try {
      const response = await referenceApi.getSessionStats(sessionId);
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character reference?')) return;

    try {
      await referenceApi.deleteCharacter(id);
      toast.success('Character reference deleted');
      loadReferences();
      loadStats();
    } catch (error: any) {
      toast.error('Failed to delete character reference');
    }
  };

  const handleDeleteGarment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this garment reference?')) return;

    try {
      await referenceApi.deleteGarment(id);
      toast.success('Garment reference deleted');
      loadReferences();
      loadStats();
    } catch (error: any) {
      toast.error('Failed to delete garment reference');
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this style reference?')) return;

    try {
      await referenceApi.deleteStyle(id);
      toast.success('Style reference deleted');
      loadReferences();
      loadStats();
    } catch (error: any) {
      toast.error('Failed to delete style reference');
    }
  };

  const tabs = [
    { id: 'characters' as TabType, label: 'Characters', icon: User, count: characters.length },
    { id: 'garments' as TabType, label: 'Garments', icon: Shirt, count: garments.length },
    { id: 'styles' as TabType, label: 'Styles', icon: Palette, count: styles.length },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/premium-photo/upload')}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Reference Management</h1>
                <p className="text-sm text-gray-400">Manage your AI consistency references</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="border-b border-gray-800 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.characterCount}</div>
                <div className="text-xs text-gray-400">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.garmentCount}</div>
                <div className="text-xs text-gray-400">Garments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.styleCount}</div>
                <div className="text-xs text-gray-400">Styles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {Math.round(stats.averageConsistencyScore)}%
                </div>
                <div className="text-xs text-gray-400">Avg Consistency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-400">Loading references...</div>
          </div>
        ) : (
          <div>
            {/* Add Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => navigate(`/references/create?type=${activeTab}&sessionId=${sessionId}`)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add {activeTab.slice(0, -1)}</span>
              </button>
            </div>

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {characters.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No character references yet. Add one to get started!
                  </div>
                ) : (
                  characters.map((char) => (
                    <div
                      key={char.id}
                      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={char.thumbnailUrl || char.faceImageUrl}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={() => navigate(`/references/edit/${char.id}`)}
                            className="p-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="p-2 bg-gray-900/80 hover:bg-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold truncate">{char.name}</h3>
                        {char.description && (
                          <p className="text-xs text-gray-400 truncate">{char.description}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Used {char.usageCount}×</span>
                          {char.visualFeatures?.colorNames && (
                            <div className="flex space-x-1">
                              {char.visualFeatures.colorNames.slice(0, 3).map((color, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-800 rounded text-xs"
                                >
                                  {color}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Garments Tab */}
            {activeTab === 'garments' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {garments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No garment references yet. Add one to get started!
                  </div>
                ) : (
                  garments.map((garment) => (
                    <div
                      key={garment.id}
                      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 transition-all"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={garment.thumbnailUrl || garment.referenceImageUrl}
                          alt={garment.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={() => navigate(`/references/edit/${garment.id}`)}
                            className="p-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGarment(garment.id)}
                            className="p-2 bg-gray-900/80 hover:bg-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold truncate">{garment.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{garment.category}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Used {garment.usageCount}×</span>
                          <div className="flex space-x-1">
                            {garment.colorPalette.slice(0, 3).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-700"
                                style={{ backgroundColor: color }}
                                title={garment.colorNames[idx]}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Styles Tab */}
            {activeTab === 'styles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {styles.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No style references yet. Add one to get started!
                  </div>
                ) : (
                  styles.map((style) => (
                    <div
                      key={style.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-green-500 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-green-600 text-xs rounded">
                              {style.type}
                            </span>
                            <h3 className="font-semibold">{style.name}</h3>
                          </div>
                          {style.description && (
                            <p className="text-sm text-gray-400 mb-2">{style.description}</p>
                          )}
                          <div className="bg-gray-800 p-2 rounded text-xs font-mono text-gray-300 mb-2">
                            {style.promptTemplate}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {style.lightingSetup && (
                              <span className="px-2 py-1 bg-gray-800 rounded">
                                💡 {style.lightingSetup}
                              </span>
                            )}
                            {style.mood && (
                              <span className="px-2 py-1 bg-gray-800 rounded">😊 {style.mood}</span>
                            )}
                            {style.cameraAngle && (
                              <span className="px-2 py-1 bg-gray-800 rounded">
                                📷 {style.cameraAngle}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 ml-4">
                          <button
                            onClick={() => navigate(`/references/edit/${style.id}`)}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStyle(style.id)}
                            className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                        Used {style.usageCount} times
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
