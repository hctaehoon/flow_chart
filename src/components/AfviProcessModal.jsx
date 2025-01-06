import { useState } from 'react';
import { AFVI_SUB_PROCESSES } from '../constants/afviProcess';

function AfviProcessModal({ product, onClose, onSave }) {
  const [selectedMachine, setSelectedMachine] = useState('');
  
  const currentSubProcess = product.afviStatus?.currentSubProcess 
    ? AFVI_SUB_PROCESSES[product.afviStatus.currentSubProcess].nextProcess 
    : '3D_BGA';

  const availableMachines = AFVI_SUB_PROCESSES[currentSubProcess].machines;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      subProcess: currentSubProcess,
      machine: selectedMachine,
      startTime: new Date().toISOString()
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <h2>AFVI 세부 공정 선택</h2>
      <p>다음 단계: {currentSubProcess}</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            설비 선택:
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              required
            >
              <option value="">선택하세요</option>
              {availableMachines.map(machine => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">확인</button>
          <button type="button" onClick={onClose}>취소</button>
        </div>
      </form>
    </div>
  );
}

export default AfviProcessModal; 