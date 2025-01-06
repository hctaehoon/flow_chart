import { memo } from 'react';

const ProcessBlock = memo(({ title, position }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '300px',
        height: '400px',
        border: '2px dashed #666',
        borderRadius: '8px',
        backgroundColor: 'rgba(240, 240, 240, 0.5)',
        padding: '10px',
        pointerEvents: 'none', // 이를 통해 노드 드래그가 방해받지 않음
      }}
    >
      <div
        style={{
          backgroundColor: '#666',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          display: 'inline-block',
          pointerEvents: 'all', // 제목은 클릭 가능하도록
        }}
      >
        {title}
      </div>
    </div>
  );
});

ProcessBlock.displayName = 'ProcessBlock';

export default ProcessBlock; 