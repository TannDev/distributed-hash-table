export enum MessageType {
    JOIN = 'JOIN', // Request from a node trying to join the network.
    ACCEPT = 'ACCEPT', // Acceptance of the previous message.
    REJECT = 'REJECT' // Rejection of the previous message.
}

export class Message {

    static deserialize(buffer: Buffer) {
        const string = buffer.toString();
        const json = JSON.parse(string);
        const {type, data} = json;
        return new Message(type, data);
    }

    readonly type: MessageType;
    readonly data: any;

    constructor(type: MessageType, data?: any) {
        this.type = type;
        this.data = data;
    }

    serialize() {
        // TODO Make this smaller by taking better advantage of buffer parsing.
        return Buffer.from(JSON.stringify(this));
    }
}