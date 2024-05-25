import { EventEmitter } from "events";

class Quib extends EventEmitter {
    constructor({ host, uid }) {
        super();
        this.counter = 0;
        this.host = host;
        this.uid = uid;
        this.ws = new WebSocket(`wss://${this.host}/home?uid=${this.uid}`);

        this.eventHandlers = {
            media: (media) => this.emit("media", media.payload),
            mark: () => this.emit("mark", "audio data completely received"),
            clear: () => this.emit("clear", "Clear current media stream , up until mark event"),
            userText: (text) => this.emit("userText", text),
            assistantText: (text) => this.emit("assistantText", text),
            endCall: () => this.emit("endCall", "Conversation end is found")
        };

        this.ws.onopen = () => {
            console.log(`Connected to ${this.host}`);
            this.emit("connected", "websocket connection created");
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const handler = this.eventHandlers[data.event];
            if (handler) {
                handler(data);
            } else {
                console.log(`Unknown event (${data.event}) caught by websocket, contact support@quibbleai.io to get more info`);
            }
            this.counter++;
        };

        this.ws.onerror = (error) => {
            console.error(`WebSocket error: ${error}`);
        };

        this.ws.onclose = ({ code, reason }) => {
            console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        };
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
        this.sendData(data.event, data);
    }
}

export default Quib;