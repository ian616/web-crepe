import React from 'react';
import { inferCSV } from '../lib/infer_csv';
import { inferMIC, stopMIC } from '../lib/infer_mic';

export default function App() {
  return (
    <div>
      <h1>Web CREPE</h1>
      <button onClick={inferMIC}>Run Inference</button>
      <button onClick={stopMIC}>Stop Inference</button>
    </div>
  );
}