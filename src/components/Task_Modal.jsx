import React from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ children, onClose }) {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}  // 배경 클릭 시 닫기
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6 relative"
        onClick={e => e.stopPropagation()} // 내부 클릭 시 이벤트 전파 차단
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
