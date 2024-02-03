import React, { useState } from 'react';

const VideoBackground = () => {
    const [videoURL, setVideoURL] = useState('');

    const handleFileInputChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const objectURL = URL.createObjectURL(file);
            setVideoURL(objectURL);
        }
    };

    const backgroundStyle = {
        background: `url('${videoURL}') no-repeat center center fixed`,
        backgroundSize: 'cover',
    };

    return (
        <div className="border video-background" style={backgroundStyle}>
            <input type="file" onChange={handleFileInputChange} />
        </div>
    );
};

export default VideoBackground;
