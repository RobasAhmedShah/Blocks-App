import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { useApp } from '@/contexts/AppContext';

export function useProperty(id: string) {
  const { getProperty } = useApp();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      const found = getProperty(id);
      setProperty(found || null);
      setLoading(false);
    };
    fetchProperty();
  }, [id, getProperty]);

  return { property, loading };
}
