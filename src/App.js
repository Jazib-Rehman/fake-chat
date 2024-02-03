import React, { useEffect, useRef, useState } from 'react';
import FeatherIcon from 'feather-icons-react';
import './App.css';
import RecordRTC from 'recordrtc';

function App() {
    const [chat, setChat] = useState([]);
    const [playVoices, setPlayVoices] = useState(false);
    const [textArea, setTextArea] = useState('test');
    const queryParameters = new URLSearchParams(window.location.search);
    const onlyVideo = queryParameters.get('onlyVideo');
    const videoSrc = queryParameters.get('src');
    const [decadedSrc, setDecadedSrc] = useState('');

    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stream, setStream] = useState(null);
    const [recorder, setRecorder] = useState(null);
    const videoRef = useRef(null);

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

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/mp4' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'recorded-video.mp4';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
            };

            mediaRecorder.start();
            setMediaRecorder(mediaRecorder);
            setRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    // Define a function to crop the video
    function cropVideo(videoElement, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, width, height);

        // Convert the cropped canvas to a blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'video/mp4');
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
    useEffect(() => {
        if (onlyVideo && recorderCount < 1) {
            setRecorderCount(recorderCount + 1);
            startRecording();
            setSrc(videoSrc);
            setDecadedSrc(decodeURIComponent(videoSrc));
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
        const newWindow = window.open(
            `https://fake-chat-simm.vercel.app?onlyVideo=true&src=${encodeURIComponent(src)}`,
            'MyWindow',
            'width=500, height=800'
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
        <div className='relative  flex justify-center items-center min-h-screen w-full'>
            <div className='fixed top-0 left-0 w-full z-0'>
                {src ? (
                    onlyVideo ? (
                        <video className='w-full h-screen object-cover' muted src={decadedSrc} autoPlay loop>
                            Sorry, your browser doesn't support embedded videos.
                        </video>
                    ) : (
                        <video className='w-full h-screen object-cover' muted src={src} autoPlay loop>
                            Sorry, your browser doesn't support embedded videos.
                        </video>
                    )
                ) : null}
            </div>

            {onlyVideo ? (
                <div className='relative z-10 w-[450px] border rounded bg-white flex flex-col justify-center p-2 shadow h-[600px]'>
                    {!playVoices ? (
                        <button className='w-40 h-20 text-2xl bg-green-500 text-white' onClick={onStartConversation}>
                            Play
                        </button>
                    ) : (
                        <button className='w-40 h-20 text-2xl bg-red-500 text-white' onClick={stopRecording}>
                            Stop
                        </button>
                    )}
                    <div>
                        <div className='flex items-center space-x-4 p-2'>
                            <img className='h-16 w-16 rounded-full' src='./male.jpg' alt='logo' />
                            <span className='font-bold'>Alex</span>
                        </div>

                        <section id='chatSection' className='border-t-2 border-gray-200 pt-12 h-[400px] overflow-hidden space-y-4'>
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
                    <video style={{ visibility: 'hidden', height: '0px' }} ref={videoRef} controls autoPlay muted />
                </div>
            ) : (
                <main className='h-screen flex w-full flex-col relative z-10'>
                    <header className='p-4 bg-white shadow text-2xl font-bold col-span-2 h-16'>FakeChatGenerator</header>
                    <div className='flex w-full space-x-3 p-8 h-screen justify-center'>
                        <div className='w-1/3 border rounded bg-white p-4 shadow'>
                            <div>
                                <button className='bg-pink-600 text-white px-8 rounded shadow mb-2 hover:bg-pink-500' onClick={onStartConversation}>
                                    Play
                                </button>
                                <button className='ml-2 bg-red-600 text-white px-8 rounded shadow mb-2 hover:bg-red-500' onClick={openNewTab}>
                                    Record
                                </button>
                                <input type='file' onChange={handleChange} className='ml-2 bg-green-600 text-white px-8 rounded shadow mb-2 hover:bg-green-500' />
                            </div>

                            <textarea value={textArea} onChange={(ev) => setTextArea(ev.target.value)} className='text-sm w-full h-full border rounded bg-gray-200 p-4'></textarea>
                        </div>
                        <div className='w-[500px] border rounded bg-white flex flex-col justify-between p-2 shadow h-[800px]'>
                            <div>
                                <div className='flex items-center space-x-4 p-2'>
                                    <img className='h-16 w-16 rounded-full' src='./male.jpg' alt='logo' />
                                    <span className='font-bold'>Alex</span>
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
