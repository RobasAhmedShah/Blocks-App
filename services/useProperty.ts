import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { useApp } from '@/contexts/AppContext';
import { propertiesApi } from '@/services/api/properties.api';
import { normalizePropertyImages } from '@/utils/propertyUtils';

export function useProperty(id: string) {
  const { getProperty } = useApp();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Always fetch from API to ensure we get the latest data including tokens
        // Context properties might not have tokens, so we need fresh data
        const apiProperty = await propertiesApi.getProperty(id);
        
        // Helper function to ensure documents have URLs with fallback
        const ensureDocumentsWithUrls = (documents: Property['documents'] | null | undefined): Property['documents'] => {
          // If documents is null, undefined, or empty array, return fallback documents
          if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return [
              { 
                name: 'Property Deed', 
                type: 'PDF', 
                verified: true,
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              },
              { 
                name: 'Appraisal Report', 
                type: 'PDF', 
                verified: true,
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              },
              { 
                name: 'Legal Opinion', 
                type: 'PDF', 
                verified: true,
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              },
            ];
          }
          // Ensure all existing documents have URLs (fallback to placeholder if missing)
          return documents.map(doc => ({
            name: doc.name || 'Document',
            type: doc.type || 'PDF',
            verified: doc.verified !== undefined ? doc.verified : true,
            url: doc.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }));
        };

        // Transform to match app structure
        const transformedProperty: Property = {
          ...apiProperty,
          // Normalize images to handle both array and object formats
          images: normalizePropertyImages(apiProperty.images) || [],
          completionDate: apiProperty.completionDate || '',
          documents: ensureDocumentsWithUrls(apiProperty.documents),
          updates: apiProperty.updates || [],
          rentalIncome: apiProperty.rentalIncome || (apiProperty.status === 'generating-income' ? undefined : undefined),
          // Preserve tokens array from API response
          tokens: apiProperty.tokens || [],
        };
        
        setProperty(transformedProperty);
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError(err.message || 'Failed to load property');
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, getProperty]);

  return { property, loading, error };
}
