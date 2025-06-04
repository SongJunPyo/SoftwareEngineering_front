import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

/** ─────────── Settings 버튼 (기존) ─────────── **/
export const SettingsButton = () => {
    const navigate = useNavigate();
    
    return (
        <StyledWrapper>
        <div className="btn-cont settings-cont">
        <button
          className="button"
          onClick={() => {
            navigate('/settings');
          }}
        >
            <svg
                className="settings-btn"
                xmlns="http://www.w3.org/2000/svg"
                height={24}
                viewBox="0 -960 960 960"
                width={24}
                fill="#ffffff"
            >
                {/* Material Icons 'settings' 경로 */}
                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
            </svg>
            <span className="tooltip">settings</span>
            </button>
        </div>
        </StyledWrapper>
    );
};

/** ─────────── Alert(🔔) 버튼 (Loader 컴포넌트 → alert 용) ─────────── **/
export const AlertButton = ({ onClick }) => {
  return (
    <StyledWrapper>
      <div className="loader" onClick={onClick}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          height={24}
          width={24}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-6 h-6 text-gray-800 dark:text-white bell-icon"
        >
          <path
            d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            stroke="currentColor"
          />
        </svg>
        <div className="point" />
      </div>
    </StyledWrapper>
  );
};

/** ─────────── 두 버튼이 공유하는 스타일 정의 ─────────── **/
const StyledWrapper = styled.div`
  /* ───────── Settings(cont) ───────── */
  .settings-cont {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #FAE882;
    margin: 0;
    border: 1px solid #ffffff;
    border-radius: 10px;
  }
  .settings-cont .button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    border-radius: 5px;
    position: relative;
    transition: background-color 0.2s ease;
  }
  .settings-cont .button:hover .tooltip {
    background-color: rgba(255, 255, 255, 0.1);
    visibility: visible;
    opacity: 1;
  }
  .settings-btn {
    display: block;
    transition: transform 0.4s ease-in;
  }
  .settings-btn:hover {
    transform: rotate(60deg);
  }
  .settings-btn:active {
    animation: rot 1s linear infinite;
  }
  @keyframes rot {
    from {
      transform: rotate(-100deg);
    }
    to {
      transform: rotate(180deg);
    }
  }
  .tooltip {
    visibility: hidden;
    width: 120px;
    background-color: black;
    color: #fff;
    text-align: center;
    border-radius: 5px;
    padding: 5px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -60px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  /* ───────── Alert(Loader) ───────── */
  .loader {
    width: fit-content;
    height: fit-content;
    background-color: rgb(250, 232, 130);
    border-radius: 7px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition: 0.2s;
  }
  .loader:hover {
    background-color: rgb(26, 26, 26);
  }
  .loader:hover .bell-icon {
    color: white;
  }
  .bell-icon {
    color: rgba(255, 255, 255);
    transform: scale(1.2);
    transition: 0.2s;
  }
  .point {
    position: absolute;
    bottom: 5px;
    left: 5px;
    width: 6px;
    height: 6px;
    background-color: rgb(255, 0, 0);
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .point::before {
    content: "";
    position: absolute;
    width: 1px;
    height: 1px;
    background-color: rgb(255, 0, 0);
    border-radius: 25px;
    animation: loop 1s 0s infinite;
  }
  @keyframes loop {
    0% {
      background-color: rgb(255, 0, 0);
      width: 1px;
      height: 1px;
    }
    100% {
      background-color: rgba(255, 0, 0, 0);
      width: 30px;
      height: 30px;
    }
  }
`;
