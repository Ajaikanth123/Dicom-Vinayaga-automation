import React, { useState } from 'react';
import dentalChartImg from '../assets/dental_chart.png';

const DentalChartInteractive = () => {
    const [selectedTooth, setSelectedTooth] = useState(null);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                    src={dentalChartImg}
                    alt="Dental Chart"
                    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />

                {/* Top Left Teeth (18, 17, 16, 15) */}

                {/* 18 */}
                <div
                    onClick={() => setSelectedTooth(18)}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '3%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 18 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 17 */}
                <div
                    onClick={() => setSelectedTooth(17)}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '9%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 17 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 16 */}
                <div
                    onClick={() => setSelectedTooth(16)}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '15%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 16 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 15 */}
                <div
                    onClick={() => setSelectedTooth(15)}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '21%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 15 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />


                {/* Bottom Right Teeth (31, 32, 33, 34) - Starting from midline approx 50% */}

                {/* 31 */}
                <div
                    onClick={() => setSelectedTooth(31)}
                    style={{
                        position: 'absolute',
                        top: '55%',
                        left: '51%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 31 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 32 */}
                <div
                    onClick={() => setSelectedTooth(32)}
                    style={{
                        position: 'absolute',
                        top: '55%',
                        left: '57%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 32 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 33 */}
                <div
                    onClick={() => setSelectedTooth(33)}
                    style={{
                        position: 'absolute',
                        top: '55%',
                        left: '63%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 33 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

                {/* 34 */}
                <div
                    onClick={() => setSelectedTooth(34)}
                    style={{
                        position: 'absolute',
                        top: '55%',
                        left: '69%',
                        width: '5%',
                        height: '35%',
                        backgroundColor: selectedTooth === 34 ? 'rgba(144, 238, 144, 0.5)' : 'transparent',
                        cursor: 'default',
                    }}
                />

            </div>

            {/* Display text below the image */}
            {selectedTooth && (
                <div style={{ marginTop: '20px', fontSize: '18px' }}>
                    Selected Tooth: {selectedTooth}
                </div>
            )}
        </div>
    );
};

export default DentalChartInteractive;
