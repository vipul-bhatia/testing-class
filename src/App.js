import logo from './logo.svg';
import './App.css';
import Transcriber from './classes/dgVad';
import Quib from './classes/quib';
import { useEffect, useQueue } from 'react';
import { v4 as uuidv4 } from "uuid";

function App() {

  const { add, remove, first, size, queue, clear } = useQueue([]);

  const quib = new Quib({ host: 'quibbleai.io:8888', uid: uuidv4() })
  const transcriber = new Transcriber({ apiKey: '656759acdbd9f56cf70b91f71f38cd2eddacf5c4' })
  transcriber.on('transcription', (text) => {
    console.log(text)
  })


  async function microphone() {


    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
      },
    });

    const microphone = new MediaRecorder(userMedia);
    microphone.start(500);
    microphone.onstart = () => {
      console.log("Now Call Started.");
    };
    microphone.ondataavailable = (e) => {
      // add(e.data);
      transcriber.send(e.data)
      // remove()

    };

  }

  // useEffect(() => {

  // }, [queue])


  return (
    <div className="App">
      <header className="App-header">

        <button onClick={microphone}>Start Call</button>

      </header>
    </div>
  );
}

export default App;
