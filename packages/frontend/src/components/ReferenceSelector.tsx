import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, ExternalLink } from 'lucide-react';
import { referenceApi } from '../services/api';
import toast from 'react-hot-toast';
import type { CharacterReference, GarmentReference, StyleReference } from '../types/reference';

interface ReferenceSelectorProps {
  sessionId: string;
  type: 'character' | 'garment' | 'style';
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  label?: string;
  required?: boolean;
}

export default function ReferenceSelector({
  sessionId,
  type,
  selectedId,
  onSelect,
  label,
  required = false,
}: ReferenceSelectorProps) {
  const [references, setReferences] = useState<
    (CharacterReference | GarmentReference | StyleReference)[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferences();
  }, [sessionId, type]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      let response;

      if (type === 'character') {
        response = await referenceApi.getCharacters(sessionId, true);
      } else if (type === 'garment') {
        response = await referenceApi.getGarments(sessionId, true);
      } else {
        response = await referenceApi.getStyles(sessionId, undefined, true);
      }

      const data = response.data.data;
      setReferences(
        type === 'character'
          ? data.characters
          : type === 'garment'
          ? data.garments
          : data.styles
      );
    } catch (error: any) {
      console.error('Error loading references:', error);
      toast.error('Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (label) return label;
    if (type === 'character') return 'Character Reference';
    if (type === 'garment') return 'Garment Reference';
    return 'Style Reference';
  };

  const getIcon = () => {
    if (type === 'character') return '👤';
    if (type === 'garment') return '👔';
    return '🎨';
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="text-sm text-gray-400">Loading {type} references...</div>
      </div>
    );
  }

  if (references.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="text-center">
          <div className="text-4xl mb-2">{getIcon()}</div>
          <h3 className="font-semibold mb-2">{getLabel()}</h3>
          <p className="text-sm text-gray-400 mb-4">
            No {type} references yet. Create one for better AI consistency!
          </p>
          <Link
            to={`/references/create?type=${type}s&sessionId=${sessionId}`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create {type} reference</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          {getLabel()} {required && <span className="text-red-400">*</span>}
        </label>
        <Link
          to={`/references/manage?sessionId=${sessionId}`}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
        >
          <span>Manage</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* None Option */}
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={`relative border-2 rounded-lg p-3 transition-all ${
            selectedId === undefined
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-700 hover:border-gray-600 bg-gray-900'
          }`}
        >
          <div className="aspect-square flex items-center justify-center bg-gray-800 rounded mb-2">
            <span className="text-2xl">❌</span>
          </div>
          <div className="text-xs text-center truncate">None</div>
          {selectedId === undefined && (
            <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </button>

        {/* Reference Options */}
        {references.map((ref) => {
          const isSelected = selectedId === ref.id;
          let imageUrl = '';
          let name = ref.name;

          if (type === 'character') {
            const charRef = ref as CharacterReference;
            imageUrl = charRef.thumbnailUrl || charRef.faceImageUrl;
          } else if (type === 'garment') {
            const garmentRef = ref as GarmentReference;
            imageUrl = garmentRef.thumbnailUrl || garmentRef.referenceImageUrl;
          } else {
            const styleRef = ref as StyleReference;
            imageUrl = styleRef.thumbnailUrl || styleRef.referenceImageUrl || '';
          }

          return (
            <button
              key={ref.id}
              type="button"
              onClick={() => onSelect(ref.id)}
              className={`relative border-2 rounded-lg p-3 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900'
              }`}
            >
              <div className="aspect-square overflow-hidden rounded mb-2 bg-gray-800">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {getIcon()}
                  </div>
                )}
              </div>
              <div className="text-xs text-center truncate" title={name}>
                {name}
              </div>
              <div className="text-xs text-gray-500 text-center">
                Used {ref.usageCount}×
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}

        {/* Add New Option */}
        <Link
          to={`/references/create?type=${type}s&sessionId=${sessionId}`}
          className="relative border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-lg p-3 transition-all bg-gray-900 flex flex-col items-center justify-center"
        >
          <Plus className="w-8 h-8 text-gray-600 mb-2" />
          <div className="text-xs text-center text-gray-400">Add New</div>
        </Link>
      </div>

      {selectedId && (
        <div className="text-xs text-green-400 flex items-center space-x-1">
          <Check className="w-3 h-3" />
          <span>Reference selected - AI will maintain consistency</span>
        </div>
      )}
    </div>
  );
}
