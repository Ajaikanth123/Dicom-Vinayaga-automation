import React, { useState } from 'react';
import './ToothSelector.css';

const ToothSelector = ({
  selectedTeeth = [],
  onToothSelect,
  maxSelection = 1,
  disabled = false,
  label = "Select Tooth / Teeth"
}) => {
  const [isChild, setIsChild] = useState(false);

  const handleDentitionChange = (isChildValue) => {
    setIsChild(isChildValue);
    // CRITICAL: Reset selection when switching dentition types to prevent state leakage
    onToothSelect([]);
  };

  const handleToothClick = (e) => {
    if (disabled) return;
    const toothId = parseInt(e.target.getAttribute('data-tooth'));
    if (!toothId) return;

    let newSelection = [...selectedTeeth];

    if (selectedTeeth.includes(toothId)) {
      newSelection = selectedTeeth.filter(tooth => tooth !== toothId);
    } else {
      if (maxSelection === 1) {
        newSelection = [toothId];
      } else {
        if (selectedTeeth.length < maxSelection) {
          newSelection = [...selectedTeeth, toothId];
        }
      }
    }
    onToothSelect(newSelection);
  };

  const getValidationMessage = () => {
    if (disabled) return '';
    if (maxSelection === 1) {
      return selectedTeeth.length === 0 ? 'Please select exactly one tooth' : '';
    } else {
      if (selectedTeeth.length === 0) return 'Please select at least one tooth';
      if (selectedTeeth.length > maxSelection) return `Maximum ${maxSelection} teeth allowed`;
      return '';
    }
  };

  const validationMessage = getValidationMessage();

  // Simplified tooth path shapes
  // Molar-ish shape
  const molarPath = "M5,5 Q15,0 25,5 L28,20 Q20,35 15,33 Q10,35 2,20 Z";

  // A generic tooth path centered roughly at 0,0 to 30,40
  const toothPath = "M2,5 Q15,-5 28,5 L26,35 Q15,45 4,35 Z";

  // Data for teeth positions. 
  // Row 1 (Upper): 18-11, 21-28
  // Row 2 (Lower): 48-41, 31-38
  const adultTeethData = [
    // Upper Right (18-11)
    { id: 18, x: 10, y: 10 }, { id: 17, x: 45, y: 10 }, { id: 16, x: 80, y: 10 }, { id: 15, x: 115, y: 10 },
    { id: 14, x: 150, y: 10 }, { id: 13, x: 185, y: 10 }, { id: 12, x: 220, y: 10 }, { id: 11, x: 255, y: 10 },

    // Upper Left (21-28)
    { id: 21, x: 305, y: 10 }, { id: 22, x: 340, y: 10 }, { id: 23, x: 375, y: 10 }, { id: 24, x: 410, y: 10 },
    { id: 25, x: 445, y: 10 }, { id: 26, x: 480, y: 10 }, { id: 27, x: 515, y: 10 }, { id: 28, x: 550, y: 10 },

    // Lower Right (48-41)
    { id: 48, x: 10, y: 70 }, { id: 47, x: 45, y: 70 }, { id: 46, x: 80, y: 70 }, { id: 45, x: 115, y: 70 },
    { id: 44, x: 150, y: 70 }, { id: 43, x: 185, y: 70 }, { id: 42, x: 220, y: 70 }, { id: 41, x: 255, y: 70 },

    // Lower Left (31-38)
    { id: 31, x: 305, y: 70 }, { id: 32, x: 340, y: 70 }, { id: 33, x: 375, y: 70 }, { id: 34, x: 410, y: 70 },
    { id: 35, x: 445, y: 70 }, { id: 36, x: 480, y: 70 }, { id: 37, x: 515, y: 70 }, { id: 38, x: 550, y: 70 },
  ];

  // Data for children teeth positions (Primary Dentition)
  // Upper Right (55-51), Upper Left (61-65)
  // Lower Right (85-81), Lower Left (71-75)
  // Spaced out to be centered in the quadrants
  const childTeethData = [
    // Upper Right (55-51)
    { id: 55, x: 60, y: 15 }, { id: 54, x: 110, y: 15 }, { id: 53, x: 160, y: 15 }, { id: 52, x: 210, y: 15 }, { id: 51, x: 260, y: 15 },

    // Upper Left (61-65)
    { id: 61, x: 310, y: 15 }, { id: 62, x: 360, y: 15 }, { id: 63, x: 410, y: 15 }, { id: 64, x: 460, y: 15 }, { id: 65, x: 510, y: 15 },

    // Lower Right (85-81)
    { id: 85, x: 60, y: 75 }, { id: 84, x: 110, y: 75 }, { id: 83, x: 160, y: 75 }, { id: 82, x: 210, y: 75 }, { id: 81, x: 260, y: 75 },

    // Lower Left (71-75)
    { id: 71, x: 310, y: 75 }, { id: 72, x: 360, y: 75 }, { id: 73, x: 410, y: 75 }, { id: 74, x: 460, y: 75 }, { id: 75, x: 510, y: 75 },
  ];

  const currentTeethData = isChild ? childTeethData : adultTeethData;
  const dentitionType = isChild ? 'child' : 'adult';

  return (
    <div className="tooth-selector">
      <div className="tooth-type-toggle" style={{ marginBottom: '15px', textAlign: 'center' }}>
        <span style={{ marginRight: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Is the patient a child?</span>
        <label style={{ marginRight: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="radio"
            name="isChild"
            checked={isChild === true}
            onChange={() => handleDentitionChange(true)}
            style={{ marginRight: '6px' }}
          />
          Yes
        </label>
        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="radio"
            name="isChild"
            checked={isChild === false}
            onChange={() => handleDentitionChange(false)}
            style={{ marginRight: '6px' }}
          />
          No
        </label>
      </div>

      <label className="tooth-selector-label">
        {label}
        {maxSelection > 1 && (
          <span className="selection-info">
            ({selectedTeeth.length}/{maxSelection} selected)
          </span>
        )}
      </label>

      <div className="svg-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        {/* Key on SVG ensures full remount when dentition changes, preventing ghost highlights */}
        <svg
          key={dentitionType}
          viewBox="0 0 600 120"
          width="100%"
          height="120"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}
        >
          {/* Midline */}
          <line x1="295" y1="10" x2="295" y2="110" stroke="#ccc" strokeWidth="1" />

          {/* Teeth */}
          {currentTeethData.map((tooth) => (
            <g
              key={`${dentitionType}-${tooth.id}`}
              transform={`translate(${tooth.x}, ${tooth.y}) ${isChild ? 'scale(0.9)' : ''}`}
            >
              <path
                d={toothPath}
                className="tooth-interactive-path"
                data-tooth={tooth.id}
                data-type={dentitionType}
                onClick={handleToothClick}
                fill={selectedTeeth.includes(tooth.id) ? '#90ee90' : 'white'}
                stroke="#333"
                strokeWidth="1"
                style={{
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'fill 0.2s',
                  // Hover effect handled by CSS .tooth-interactive-path:hover when not selected
                }}
              />
              <text
                x="15"
                y="50" // below the tooth
                textAnchor="middle"
                fontSize="10"
                fill="#666"
                pointerEvents="none" // let clicks pass through to svg/div if missed
              >
                {tooth.id}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {selectedTeeth.length > 0 && (
        <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          Selected Tooth: {selectedTeeth.sort((a, b) => a - b).join(', ')}
        </div>
      )}

      {validationMessage && (
        <div className="validation-message" style={{ textAlign: 'center' }}>
          {validationMessage}
        </div>
      )}
    </div>
  );
};

export default ToothSelector;