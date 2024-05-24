const EventEmitter = require("events");
const WebSocket = require("ws");

class Quib extends EventEmitter {
    constructor(config) {
        super();
        this.counter = 0;
        this.host = config.host;
        this.uid = config.uid;
        this.ws = new WebSocket(`wss://${this.host}/home?uid=${this.uid}`);

        this.ws.on("open", () => {
            console.log(`Connected to ${this.host}`);
            this.emit("connected", "websocket connection created");
        });

        this.ws.on("message", (data) => {
            const { event, media, text } = JSON.parse(data);
            switch (event) {
                case "media":
                    /*
                        this will emit a media event
                        it will contain mp3 bufferData
                    */
                    this.emit("media", media.payload);

                    break;
                case "mark":
                    /*
                        this will emit a mark event
                        it will mark the end of audio data for the current counter
                    */
                    this.emit("mark", "audio data completely received");

                    break;
                case "clear":
                    /*
                        this will emit a clear event
                        it will tell the user when to clear the audio queue 
                    */
                    this.emit(
                        "clear",
                        "Clear current media stream , up until mark event"
                    );

                    break;
                case "userText":
                    /*
                        this will emit a userText event
                        it will contain a string of text that is passed to LLM
                    */
                    this.emit("userText", text);

                    break;
                case "assistantText":
                    /*
                        this will emit a assistantText event
                        it will contain a string of text that is returned by LLM
                    */
                    this.emit("assistantText", text);

                    break;
                case "endCall":
                    /*
                        this will emit a media event
                        it will contain mp3 bufferData
                    */
                    this.emit("endCall", "Conversation end is found");

                    break;
                default:
                    /*
                        this will not emit any event
                        if this point is reached, please contact support@quibbleai.io to get more info
                    */
                    console.log(
                        `Unknown event (${event}) caught by websocket, contact support@quibbleai.io to get more info`
                    );
                    break;
            }
            this.counter++;
        });

        this.ws.on("error", (error) => {
            console.error(`WebSocket error: ${error}`);
        });

        this.ws.on("close", (code, reason) => {
            console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        });
    }

    sendData(event, data = {}) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event, ...data }));
            this.counter++;
        } else {
            console.error("Cannot send data, WebSocket is not open");
        }
    }

    start() {
        this.sendData("start", { start: { streamSid: this.uid } });
    }

    stop() {
        this.sendData("stop");
    }

    mark() {
        this.sendData("mark", { mark: { name: this.counter } });
    }

    gpt(data) {
        this.sendData("gpt", { text: data });
    }

    interruption(data) {
        this.sendData("interruption", { text: data });
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            this.counter++;
        } else {
            console.error("Cannot send data, WebSocket is not open");
        }
    }
}

module.exports = Quib;
