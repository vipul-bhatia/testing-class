import logo from './logo.svg';
import './App.css';
import { Quib, Transcriber } from "@fadedrifleman/web-sdk"
// import Transcriber from './classes/dgVad';
import { useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";


function App() {

  // const { add, remove, first, size, queue, clear } = useQueue([]);

  const quib = new Quib({ host: 'quibbleai.io:8888', uid: uuidv4() });
  const transcriber = new Transcriber({ apiKey: '' })
  transcriber.on('transcription', (text) => {
    console.log(text)
  })
  quib.on('connected', () => {
    console.log('Connected to Quib')
    quib.start()
    quib.send('hello')
  })

  quib.on('media', (data) => {
    console.log(data)
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
      console.log(e.data)
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
