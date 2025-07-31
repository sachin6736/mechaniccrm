import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const useApiLoading = () => {
  const [loading, setLoading] = useState({});

  const withLoading = useCallback(
    async (key, asyncFn, options = {}) => {
      const { onError = (err) => toast.error(err.message || 'An error occurred') } = options;
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const result = await asyncFn();
        setLoading((prev) => ({ ...prev, [key]: false }));
        return result;
      } catch (error) {
        setLoading((prev) => ({ ...prev, [key]: false }));
        onError(error);
        throw error;
      }
    },
    []
  );

  return { loading, withLoading };
};

export default useApiLoading;