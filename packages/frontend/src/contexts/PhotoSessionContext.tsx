import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export interface UploadedPhoto {
  id?: string;
  file: File;
  preview: string;
  subType: 'PRODUCT' | 'MODEL';
  uploading?: boolean;
}

interface PhotoSessionContextType {
  sessionId: string | null;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  productPhotos: UploadedPhoto[];
  setProductPhotos: Dispatch<SetStateAction<UploadedPhoto[]>>;
  modelPhotos: UploadedPhoto[];
  setModelPhotos: Dispatch<SetStateAction<UploadedPhoto[]>>;
  selectedStyle: string;
  setSelectedStyle: Dispatch<SetStateAction<string>>;
  selectedLighting: string;
  setSelectedLighting: Dispatch<SetStateAction<string>>;
  generatedResults: any[];
  setGeneratedResults: Dispatch<SetStateAction<any[]>>;
}

const PhotoSessionContext = createContext<PhotoSessionContextType | undefined>(undefined);

export function PhotoSessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [productPhotos, setProductPhotos] = useState<UploadedPhoto[]>([]);
  const [modelPhotos, setModelPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('Studio');
  const [selectedLighting, setSelectedLighting] = useState('Soft');
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);

  return (
    <PhotoSessionContext.Provider
      value={{
        sessionId,
        setSessionId,
        productPhotos,
        setProductPhotos,
        modelPhotos,
        setModelPhotos,
        selectedStyle,
        setSelectedStyle,
        selectedLighting,
        setSelectedLighting,
        generatedResults,
        setGeneratedResults,
      }}
    >
      {children}
    </PhotoSessionContext.Provider>
  );
}

export function usePhotoSession() {
  const context = useContext(PhotoSessionContext);
  if (context === undefined) {
    throw new Error('usePhotoSession must be used within a PhotoSessionProvider');
  }
  return context;
}
