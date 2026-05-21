import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const contextDetector = () => {
  const [currentPage, setCurrentPage] = useState(null);
  const [relevantEntities, setRelevantEntities] = useState({});
  const location = useLocation();

  useEffect(() => {
    // Detect current page and relevant entities based on location
    switch (location.pathname) {
      case '/budgets':
        setCurrentPage('Budgets');
        setRelevantEntities({ budgets: [] });
        break;
      case '/fournisseurs':
        setCurrentPage('Fournisseurs');
        setRelevantEntities({ suppliers: [] });
        break;
      // Handle other pages
      default:
        break;
    }
  }, [location]);

  return {
    currentPage,
    relevantEntities,
  };
};

export default contextDetector;