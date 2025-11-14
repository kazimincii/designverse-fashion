import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return null;
      const response = await searchApi.globalSearch({
        query: debouncedQuery,
        limit: 10,
      });
      return response.data.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Fetch suggestions for autocomplete
  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return null;
      const response = await searchApi.getSuggestions(debouncedQuery);
      return response.data.data.suggestions;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    setShowResults(false);
    setQuery('');

    if (type === 'story') {
      navigate(`/watch/${id}`);
    } else if (type === 'template') {
      navigate(`/templates`);
    } else if (type === 'session') {
      navigate(`/premium-photo`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search stories, templates..."
            className="w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (query.length >= 2 || suggestions) && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg border border-gray-800 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Suggestions */}
              {suggestions && suggestions.length > 0 && (
                <div className="p-2 border-b border-gray-800">
                  <div className="text-xs text-gray-500 px-2 mb-1">Suggestions</div>
                  {suggestions.map((suggestion: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        setDebouncedQuery(suggestion);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-gray-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Stories */}
              {searchResults?.results?.stories && searchResults.results.stories.length > 0 && (
                <div className="p-2 border-b border-gray-800">
                  <div className="text-xs text-gray-500 px-2 mb-1">Stories</div>
                  {searchResults.results.stories.map((story: any) => (
                    <button
                      key={story.id}
                      onClick={() => handleResultClick('story', story.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded"
                    >
                      <div className="font-medium text-white text-sm">{story.title}</div>
                      <div className="text-xs text-gray-400">
                        by @{story.owner.handle} • {story.viewCount} views
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Templates */}
              {searchResults?.results?.templates && searchResults.results.templates.length > 0 && (
                <div className="p-2 border-b border-gray-800">
                  <div className="text-xs text-gray-500 px-2 mb-1">Templates</div>
                  {searchResults.results.templates.map((template: any) => (
                    <button
                      key={template.id}
                      onClick={() => handleResultClick('template', template.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded"
                    >
                      <div className="font-medium text-white text-sm">{template.name}</div>
                      <div className="text-xs text-gray-400">
                        {template.category && `${template.category} • `}
                        {template.usageCount} uses
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Photo Sessions */}
              {searchResults?.results?.photoSessions &&
                searchResults.results.photoSessions.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs text-gray-500 px-2 mb-1">Photo Sessions</div>
                    {searchResults.results.photoSessions.map((session: any) => (
                      <button
                        key={session.id}
                        onClick={() => handleResultClick('session', session.id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded"
                      >
                        <div className="font-medium text-white text-sm">{session.title}</div>
                        <div className="text-xs text-gray-400">
                          {session._count.photoAssets} assets
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {/* No Results */}
              {searchResults && searchResults.totalResults === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No results found for "{query}"
                </div>
              )}

              {/* View All Results */}
              {searchResults && searchResults.totalResults > 0 && (
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setShowResults(false);
                  }}
                  className="w-full p-3 text-center text-blue-400 hover:bg-gray-800 text-sm font-medium border-t border-gray-800"
                >
                  View all {searchResults.totalResults} results
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
