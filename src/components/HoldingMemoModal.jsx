import { useState } from 'react';

function HoldingMemoModal({ onClose, onSave }) {
  const [memo, setMemo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(memo);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <h3 style={{ marginTop: 0 }}>홀딩 사유 입력</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="홀딩 사유를 입력하세요"
            style={{
              width: '100%',
              height: '100px',
              margin: '10px 0',
              padding: '8px',
              resize: 'none',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HoldingMemoModal; 