import { useEffect, useState } from 'react';
import packageJson from '../package.json';

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function useVersionCheck() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const currentVersion = packageJson.version;

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.version && data.version !== currentVersion) {
            setNewVersionAvailable(true);
          }
        }
      } catch (error) {
        // Silently fail - don't disrupt the user experience
        console.log('Version check failed:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Then check periodically
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [currentVersion]);

  const reload = () => {
    window.location.reload();
  };

  return { newVersionAvailable, reload };
}
