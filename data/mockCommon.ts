// Common UI data used across multiple screens

export const propertyFilters = ['Trending', 'High Yield', 'New Listings', 'Completed'] as const;

export type PropertyFilter = typeof propertyFilters[number];

