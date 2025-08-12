import React from 'react';
import { main } from './lib/infer_csv';

export default function App() {
  return (
    <div>
      <h1>Web CREPE</h1>
      <button onClick={main}>Run Inference</button>
    </div>
  );
}