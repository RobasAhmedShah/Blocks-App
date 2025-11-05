import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { mockProperties } from '@/data/mockProperties';

export function useProperty(id: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = mockProperties.find(p => p.id === id);
    setProperty(found || null);
    setLoading(false);
  }, [id]);

  return { property, loading };
}

