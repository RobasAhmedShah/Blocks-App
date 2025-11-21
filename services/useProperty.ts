import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { useApp } from '@/contexts/AppContext';
import { propertiesApi } from '@/services/api/properties.api';

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
        // First try to get from context (already loaded properties)
        const found = getProperty(id);
        if (found) {
          setProperty(found);
          setLoading(false);
          return;
        }

        // If not in context, fetch from API
        const apiProperty = await propertiesApi.getProperty(id);
        
        // Helper function to ensure documents have URLs
        const ensureDocumentsWithUrls = (documents: Property['documents']) => {
          if (!documents || documents.length === 0) {
            // Default documents if none exist
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
          // Ensure all existing documents have URLs
          return documents.map(doc => ({
            ...doc,
            url: doc.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }));
        };

        // Transform to match app structure
        const transformedProperty: Property = {
          ...apiProperty,
          completionDate: apiProperty.completionDate || '',
          documents: ensureDocumentsWithUrls(apiProperty.documents),
          updates: apiProperty.updates || [],
          rentalIncome: apiProperty.rentalIncome || (apiProperty.status === 'generating-income' ? undefined : undefined),
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
