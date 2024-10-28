// components/PinataTest.jsx

import { useState } from 'react';
import { pinataService } from '@/lib/services/pinataervices.js';
import { Button } from "@/components/ui/button";

export default function PinataTest() {
  const [status, setStatus] = useState(null);
  const [testFile, setTestFile] = useState(null);

  const checkConnection = async () => {
    const result = await pinataService.checkHealth();
    setStatus(result);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const result = await pinataService.uploadFile(file);
      setTestFile(result);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Button onClick={checkConnection}>
          Tester la connexion Pinata
        </Button>
        {status && (
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(status, null, 2)}
          </pre>
        )}
      </div>

      <div>
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          id="test-file"
        />
        <Button onClick={() => document.getElementById('test-file').click()}>
          Tester l'upload
        </Button>
        {testFile && (
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(testFile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}