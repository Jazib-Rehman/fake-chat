import React, { useEffect, useRef, useState } from 'react';
import FeatherIcon from 'feather-icons-react';
import './App.css';

function App() {
    const [chat, setChat] = useState([]);
    const [playVoices, setPlayVoices] = useState(false);
    const [textArea, setTextArea] = useState('test');
    const queryParameters = new URLSearchParams(window.location.search);
    let onlyVideo = queryParameters.get('onlyVideo');
    let videoSrc = queryParameters.get('src');
    let imgSrc = queryParameters.get('img');
    const [decadedSrc, setDecadedSrc] = useState('');

    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stream, setStream] = useState(null);
    const [recorder, setRecorder] = useState(null);
    const [img, setImg] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const videoRef = useRef(null);
    const [selectedImageBlobUrl, setSelectedImageBlobUrl] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const blob = new Blob([e.target.result], { type: file.type });
                const blobUrl = URL.createObjectURL(blob);
                setSelectedImageBlobUrl(blobUrl);
            };

            reader.readAsArrayBuffer(file);
        }
    };

    const startRecording = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            const mediaRecorder = new MediaRecorder(mediaStream);
            const chunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/mp4' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'recorded-video.mp4';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                window.close();
            };

            mediaRecorder.start();
            setMediaRecorder(mediaRecorder);
            setRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };
    async function cropVideo(blobURL, width, height) {
        return new Promise(async (resolve, reject) => {
            try {
                // Load the video from the Blob URL into a video element
                const videoElement = document.createElement('video');
                videoElement.src = blobURL;

                // Wait for the video to load metadata
                videoElement.addEventListener('loadedmetadata', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // Calculate cropping dimensions
                    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
                    const targetWidth = Math.min(videoElement.videoWidth, width);
                    const targetHeight = targetWidth / aspectRatio;

                    const xOffset = (videoElement.videoWidth - targetWidth) / 2;
                    const yOffset = (videoElement.videoHeight - targetHeight) / 2;

                    // Draw the cropped video frame onto the canvas
                    ctx.drawImage(
                        videoElement,
                        xOffset, yOffset, targetWidth, targetHeight,
                        0, 0, width, height
                    );

                    // Convert the canvas to a Blob with the desired MIME type 'video/mp4'
                    canvas.toBlob(
                        (blob) => {
                            // Manually specify the MIME type as 'video/mp4'
                            const croppedBlob = new Blob([blob], { type: 'video/mp4' });
                            // Resolve with the cropped video Blob
                            resolve(croppedBlob);
                        },
                        'video/mp4' // Manually specify the MIME type here
                    );
                });
            } catch (error) {
                // Handle any errors
                reject(error);
            }
        });
    }




    // Modify your stopRecording function to include cropping
    const stopRecording = async () => {
        if (recorder) {
            recorder.stopRecording(async () => {
                const blob = recorder.getBlob();
                const videoElement = document.createElement('video');
                videoElement.src = URL.createObjectURL(blob);

                videoElement.addEventListener('loadeddata', async () => {
                    // Crop the video
                    const croppedBlob = await cropVideo(videoElement, 500, 800);
                    downloadCroppedVideo(croppedBlob);

                    // Revoke object URLs
                    URL.revokeObjectURL(videoElement.src);
                    setRecording(false);
                });
            });
        }

        if (mediaRecorder && recording) {
            mediaRecorder.stop();
            setRecording(false);
        }

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        window.close();
    };

    // Define a function to download the cropped video
    function downloadCroppedVideo(blob) {
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'cropped-video.mp4';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Revoke object URL
        URL.revokeObjectURL(url);
    }

    const [recorderCount, setRecorderCount] = useState(0);

    const handleRecording = () => {
        setRecorderCount(recorderCount + 1);
        startRecording();
        setSrc(videoSrc);
        setImg(imgSrc)
        setDecadedSrc(decodeURIComponent(videoSrc));
    }
    useEffect(() => {
        if (onlyVideo && recorderCount < 1) {
            handleRecording()
        }
        if (onlyVideo) {
            setPlayVoices(false);
        } else {
            setPlayVoices(true);
        }
    }, []);

    const jsonData = [
        {
            name: 'John',
            gender: 'male',
            text: "Hey there! Did you know that I'm writing a novel?",
            timestamp: '2024-01-08T12:00:00',
        },
        {
            name: 'Alex',
            gender: 'female',
            text: "Oh, really? What's it about?",
            timestamp: '2024-01-08T12:05:00',
        },
        {
            name: 'John',
            gender: 'male',
            text: "It's a thrilling story about a snail who dreams of becoming a race car driver.",
            timestamp: '2024-01-08T12:10:00',
        },
        {
            name: 'Alex',
            gender: 'female',
            text: 'A snail race car',
            timestamp: '2024-01-08T12:05:00',
        },
    ];

    useEffect(() => {
        setTextArea(JSON.stringify(jsonData));
        console.log('calling useEffect');
    }, []);

    function openNewTab() {
        setShowChat(true);
        onlyVideo = true;
        setPlayVoices(false)
        setImg(selectedImageBlobUrl);
        const newWindow = window.open(
            `https://fake-chat-simm.vercel.app?onlyVideo=true&src=${encodeURIComponent(src)}&img=${selectedImageBlobUrl}`,
            'MyWindow',
            'width=800, height=800'
        );
    }

    const fetchVoicePromise = (text, gender) => {
        const API_KEY = '0ea13d65abb2bdc23f4066d50256c61c';
        const voiceId = gender === 'male' ? 'SOYHLrjzK2X1ezoPC6cr' : 'EXAVITQu4vr4xnSDxMaL';
        const textToSpeechUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const options = {
            method: 'POST',
            headers: {
                Accept: 'audio/mpeg',
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice_settings: {
                    similarity_boost: 1,
                    stability: 1,
                },
            }),
        };

        return fetch(textToSpeechUrl, options);
    }

    const playConversation = async (chatWithAudio) => {
        const chatEvents = chatWithAudio.map((item) => {
            return () => new Promise((resolve) => {
                item.audio.play();
                item.audio.onended = () => {
                    resolve(item);
                };
            });
        });

        for (let i = 0; i < chatEvents.length; i++) {
            console.log(chatWithAudio[i]);
            setChat((prevChat) => [...prevChat, chatWithAudio[i]]);
            await chatEvents[i]();
        }
    }

    const onStartConversation = async () => {
        setPlayVoices(true);
        const jsonObject = JSON.parse(textArea);
        const voicePromiseList = jsonObject.map(({ text, gender }) => fetchVoicePromise(text, gender));
        console.log('loading.... voices');
        const voiceBlobs = await Promise.all((await Promise.all(voicePromiseList)).map((streamItem) => streamItem.blob()));
        const audioUrlList = voiceBlobs.map((blob) => URL.createObjectURL(blob));
        const chatArrayWithAudio = jsonObject.map((item, i) => ({ ...item, audio: new Audio(audioUrlList[i]) }));
        console.log('loaded... voices');
        console.log(chatArrayWithAudio);
        playConversation(chatArrayWithAudio);
    };

    const [src, setSrc] = useState('');

    const handleChange = (event) => {
        try {
            // Get the uploaded file
            const file = event.target.files[0];

            // Transform file into blob URL
            setSrc(URL.createObjectURL(file));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className='relative flex justify-center items-center h-auto sm:h-auto md:min-h-screen w-screen'>
            <div className='fixed top-0 left-0 w-full z-0'>
                {src ? (
                    <video className='w-full h-screen object-cover' muted src={src} autoPlay loop>
                        Sorry, your browser doesn't support embedded videos.
                    </video>)
                    : null}
            </div>

            {showChat || onlyVideo ?

                onlyVideo ?
                    <div className='relative z-20 border border-red-400 w-full h-screen bg-white flex justify-center items-center'>
                        <button className='w-40 h-20 text-2xl bg-red-500 text-white' onClick={stopRecording}>
                            Stop
                        </button>
                    </div> : (
                        <>
                            <div className='relative z-10 w-full sm:w-full md:w-[450px] border rounded bg-white flex flex-col justify-start sm:justify-start md:justify-center p-2 shadow h-screen md:h-[600px]'>
                                {!playVoices ? (
                                    <button className='w-40 h-20 text-2xl bg-green-500 text-white' onClick={onStartConversation}>
                                        Play
                                    </button>
                                ) : null
                                    // <button className='w-40 h-20 text-2xl bg-red-500 text-white' onClick={stopRecording}>
                                    //     Stop
                                    // </button>
                                }
                                <div>
                                    <div className='flex items-center space-x-4 p-2'>
                                        <img className='h-16 w-16 rounded-full' src={img || './male.jpg'} alt='logo' />
                                        <span className='font-bold'>Alex</span>
                                    </div>

                                    <section id='chatSection' className='border-t-2 border-gray-200 pt-12 h-[500px] sm:h-[500px] md:h-[400px] overflow-hidden space-y-4'>
                                        {chat.map((item, i) => {
                                            if (i % 2 === 0) {
                                                return (
                                                    <div className='p-2 flex items-start' key={i}>
                                                        <img className='h-10 w-10 rounded-full' src={img || './male.jpg'} alt='logo' />
                                                        <div className='inline-block max-w-xs bg-gray-200 rounded-xl p-2 ml-1'>
                                                            <p className='text-md'> {item.text} </p>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className='p-2 flex justify-end items-start' key={i}>
                                                        <div className='inline-block max-w-xs bg-blue-500 rounded-xl text-white p-2'>
                                                            <p className='text-md'>{item.text}</p>
                                                        </div>
                                                        {/* <img className='h-10 w-10 rounded-full' src='./male.jpg' alt='logo' /> */}
                                                    </div>
                                                );
                                            }
                                        })}
                                    </section>
                                </div>
                                <div className='border-t-2 border-gray-200 p-2 flex items-center'>
                                    <input className='w-full rounded p-2 border-gray-300 focus:outline-none' type='text' placeholder='Type a message...' />
                                    <div>
                                        <FeatherIcon icon='send' />
                                    </div>
                                </div>
                            </div>
                            {/* <video style={{ height: '800px', width: "500px" }} ref={videoRef} controls autoPlay muted /> */}
                        </>
                    ) : (
                    <main className='h-screen flex w-full flex-col relative z-10'>
                        <header className='p-4 bg-white shadow text-2xl font-bold col-span-2 h-16'>FakeChatGenerator</header>
                        <div className='flex flex-col sm:flex-col md:flex-row w-full space-x-0 sm:space-x-0 md:space-x-3 p-8 h-screen justify-center'>
                            <div className='h-full flex flex-col w-full sm:w-full md:w-1/3 border rounded bg-white p-4 shadow'>
                                <div className='pb-2'>
                                    <button style={{ paddingTop: "5px", paddingBottom: "5px" }} className='cursor-pointer bg-red-600 text-white px-8 rounded shadow hover:bg-green-500' onClick={openNewTab}>
                                        Record
                                    </button>
                                    <label htmlFor="fileInput" style={{ paddingTop: "7px", paddingBottom: "8px" }} className="cursor-pointer ml-2 bg-green-600 text-white px-8 rounded shadow hover:bg-green-500">
                                        Upload File
                                    </label>
                                    <input
                                        type="file"
                                        id="fileInput"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleChange}
                                    />

                                </div>
                                <div className='h-full'>
                                    <textarea value={textArea} onChange={(ev) => setTextArea(ev.target.value)} className='text-sm w-full h-full border rounded bg-gray-200 p-4'></textarea>
                                </div>
                            </div>
                            <div className='mt-3 sm:mt-3 md:mt-0 w-full sm:w-full md:w-[500px] border rounded bg-white flex flex-col justify-between p-2 shadow h-screen md:h-[800px]'>
                                <div>
                                    <div className="flex items-center space-x-4 p-2">
                                        <label htmlFor="imageInput" className="cursor-pointer">
                                            {selectedImageBlobUrl ? (
                                                <img
                                                    className="h-16 w-16 rounded-full"
                                                    src={selectedImageBlobUrl}
                                                    alt="Uploaded"
                                                />
                                            ) : (
                                                <img
                                                    className="h-16 w-16 rounded-full"
                                                    src="./male.jpg"
                                                    alt="Default"
                                                />
                                            )}
                                            <input
                                                type="file"
                                                id="imageInput"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        <span className="font-bold">Alex</span>
                                    </div>
                                    <section id='chatSection' className='border-t-2 border-gray-200 pt-12 h-[600px] overflow-hidden space-y-4'>
                                        {chat.map((item, i) => {
                                            if (i % 2 === 0) {
                                                return (
                                                    <div className='p-2 flex items-start' key={i}>
                                                        <img className='h-10 w-10 rounded-full' src='./male.jpg' alt='logo' />
                                                        <div className='inline-block max-w-xs bg-gray-200 rounded-xl p-2'>
                                                            <p className='text-md'> {item.text} </p>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className='p-2 flex justify-end items-start' key={i}>
                                                        <div className='inline-block max-w-xs bg-blue-500 rounded-xl text-white p-2'>
                                                            <p className='text-md'>{item.text}</p>
                                                        </div>
                                                        <img className='h-10 w-10 rounded-full' src='./male.jpg' alt='logo' />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </section>
                                </div>

                                <div className='border-t-2 border-gray-200 p-2 flex items-center'>
                                    <input className='w-full rounded p-2 border-gray-300 focus:outline-none' type='text' placeholder='Type a message...' />
                                    <div>
                                        <FeatherIcon icon='send' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}
        </div>
    );
}

export default App;
