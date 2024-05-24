const EventEmitter = require("events");
const { LiveTranscriptionEvents, createClient } = require("@deepgram/sdk");

class Transcriber extends EventEmitter {
    constructor(config) {
        super();
        this.deepgramApiKey = config.apiKey;
        this.finalResult = "";
        this.speechFinal = false;
        this.timeOutCheck = null;

        this.initDeepgram();
    }

    initDeepgram() {
        this.deepgram = createClient(this.deepgramApiKey);
        this.deepgramLive = this.deepgram.listen.live({
            model: "nova-2-general",
            language: "en-IN",
            interim_results: true,
            filler_words: true,
            smart_format: true,
            endpointing: 450,
            utterance_end_ms: 1000,
            utterances: true,
            vad_events: true,
        });

        this.setEventListeners();
    }

    setEventListeners() {
        this.deepgramLive.on(LiveTranscriptionEvents.Open, () => {
            console.log("Deepgram Connection Established")
            this.emit("connected", "deegpram connected")
        }
        );

        this.deepgramLive.addListener("error", (error) => console.error(error));

        this.deepgramLive.on(LiveTranscriptionEvents.Error, (error) =>
            console.error(error)
        );

        this.deepgramLive.on(LiveTranscriptionEvents.Close, () =>
            console.log("connection closed")
        );

        this.deepgramLive.on(
            LiveTranscriptionEvents.Transcript,
            this.handleTranscript.bind(this)
        );
    }

    handleTranscript(transcription) {
        const alternatives = transcription.channel?.alternatives;
        const text = alternatives ? alternatives[0]?.transcript : "";

        if (text) {
            console.log(transcription);
            this.clearTimeoutCheck();
        }

        if (text.length > 0 && transcription.is_final === true) {
            this.finalResult += `${text} `;
        }

        if (transcription.is_final === true) {
            this.setTimeoutCheck();

            if (text.length > 0 && transcription.speech_final === true) {
                this.clearTimeoutCheck();
                this.emitTranscription();
                this.speechFinal = true;
            } else {
                this.speechFinal = false;
            }
        }
    }

    setTimeoutCheck() {
        this.timeOutCheck = setTimeout(() => {
            console.log("timeout triggered");
            if (this.finalResult.length > 1) {
                this.emitTranscription();
                console.log("failsafe triggered, speechFinal not received");
            }
        }, 1500);
    }

    clearTimeoutCheck() {
        if (this.timeOutCheck) {
            clearTimeout(this.timeOutCheck);
            this.timeOutCheck = null;
        }
    }

    emitTranscription() {
        this.emit("transcription", this.finalResult);
        this.finalResult = "";
    }

    send(data) {
        if (this.deepgramLive.getReadyState() === 1) {
            this.deepgramLive.send(data);
        }
    }

    keepAlive() {
        if (this.deepgramLive.getReadyState() === 1) {
            this.deepgramLive.send(JSON.stringify({ type: "KeepAlive" }));
        }
    }

    close() {
        this.deepgramLive.send(JSON.stringify({ type: "CloseStream" }));
    }
}

module.exports = Transcriber;
