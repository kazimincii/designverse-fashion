import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Star, Lock, Globe } from 'lucide-react';
import { templateApi } from '../services/api';
import toast from 'react-hot-toast';

interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  templateData: any;
  isPublic: boolean;
  usageCount: number;
  tags: string[];
  createdAt: string;
  owner: {
    id: string;
    handle: string;
    displayName: string;
  };
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

  const { data: myTemplatesData, isLoading: loadingMy } = useQuery({
    queryKey: ['my-templates'],
    queryFn: async () => {
      const response = await templateApi.getMyTemplates();
      return response.data.data.templates as SessionTemplate[];
    },
    enabled: activeTab === 'my',
  });

  const { data: publicTemplatesData, isLoading: loadingPublic } = useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const response = await templateApi.getPublicTemplates();
      return response.data.data.templates as SessionTemplate[];
    },
    enabled: activeTab === 'public',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-templates'] });
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  const handleDelete = (template: SessionTemplate) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const isLoading = activeTab === 'my' ? loadingMy : loadingPublic;
  const templates = activeTab === 'my' ? myTemplatesData : publicTemplatesData;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/workspace')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Session Templates
              </h1>
            </div>
            {activeTab === 'my' && (
              <button
                onClick={() => toast('Create template feature coming soon!')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Template</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Templates
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Discover Public Templates
          </button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading templates...</div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      {template.isPublic ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    {template.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Copy className="w-4 h-4" />
                    <span>{template.usageCount} uses</span>
                  </div>
                  {activeTab === 'public' && (
                    <span className="text-xs">by @{template.owner.handle}</span>
                  )}
                </div>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {activeTab === 'my' ? (
                    <>
                      <button
                        onClick={() => toast('Edit feature coming soon!')}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toast('Use template feature coming soon!')}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {activeTab === 'my'
                ? 'No templates yet. Create your first one!'
                : 'No public templates available'}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => toast('Create template feature coming soon!')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Create Template
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
