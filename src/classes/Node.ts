import crypto = require('crypto');
import net = require('net');

import NetworkConfig from './NetworkConfig';
import {NetworkConfigDocument} from './NetworkConfig';

export default class Node {
    readonly #server: net.Server;
    readonly #routes: Route[][];
    readonly nodeId: string;
    readonly networkConfig: NetworkConfig;

    /**
     * Resolved when the node has successfully started listening.
     * Returns the port being used to listen.
     */
    ready: Promise<number>;

    static async startNetwork(networkConfig: NetworkConfig): Promise<Node> {
        const {hashLength} = networkConfig;

        // Create an initial node id.
        // TODO Externalize this properly.
        const nodeId = crypto.randomBytes(hashLength / 8).toString('hex');

        // Create the node.
        const node = new Node(nodeId, networkConfig);

        // TODO Contact the network.
        // TODO Get a node idea.
        // TODO Join the network.

        // Return the boostrapper node.
        return node;
    }

    static async joinNetwork(host: string, port: number): Promise<Node> {
        // Initialize a socket client.
        const socket = new net.Socket();

        // Promisify the connection process.
        return new Promise((resolve) => {
            // Try to connect to the bootstrapper.
            console.log("Starting to join a new network node...")
            socket.connect(port, host, () => {
                console.log('Connected to bootstrapper node. Asking to join...')
                // TODO Define a request language. Ideally not using JSON.
                const request = {instruction: 'JOIN'}
                socket.write(JSON.stringify(request));

                socket.on('data', (data) => {
                    console.log('Received an answer from bootstrapper node.');
                    console.log('It said:', data.toString());
                    // TODO Handle the response.

                    const {nodeId, networkConfig} = JSON.parse(data.toString());
                    if (!nodeId) throw new Error("Bootstrapper rejected the join request.");

                    const node = new Node(nodeId, networkConfig);
                    resolve(node);
                })

                socket.on('close', () => {
                    console.log('Hung up with the bootstrapper node.')
                })
            })
            socket.once('connect', () => {
                console.log("Trying to join new node...")

                // Ask the bootstrapper for permission to join.
                socket.emit('join', {message: 'testing'}, (response: joinResponse) => {
                    const {nodeId, networkConfig} = response;
                    if (!nodeId) throw new Error("Bootstrapper rejected the join request.");

                    const node = new Node(nodeId, networkConfig);
                    resolve(node);
                })
            })

            // Create the node.
            // const node = new Node(nodeId, networkConfig);

            // TODO Contact the network.
            // TODO Get a node idea.
            // TODO Join the network.

            // Return the initialized node.
            // return node;
        })
    }

    protected constructor(nodeId: string, config: NetworkConfigDocument, port?: number) {
        this.nodeId = nodeId;
        this.networkConfig = new NetworkConfig(config);

        // Initialize the routing table.
        const {hashLength, base} = this.networkConfig;
        this.#routes = new Array(hashLength / base)
            .fill(null)
            .map(() => new Array(base).fill(null));

        // Start a new TCP server;
        this.#server = net.createServer();

        this.#server.on('connection', (socket) => {
            this.log(`CONNECTED from ${socket.remoteAddress}:${socket.remotePort}`);

            socket.on('data', (data) => {
                this.log(`DATA from ${socket.remoteAddress}:${socket.remotePort}`, data.toString());
                // TODO Capture data longer than one burst.
                const request = JSON.parse(data.toString());

                // Handle JOIN events.
                if (request?.instruction === 'JOIN') {
                    const response = {
                        nodeId: crypto.randomBytes(hashLength / 8).toString('hex'),
                        networkConfig: this.networkConfig.serialize()
                    }
                    socket.write(JSON.stringify(response));

                    // TODO _Actually_ handle JOIN events.
                }

                // TODO Handle all the other events.
            })

            socket.on('close', (data) => {
                this.log(`CLOSED from ${socket.remoteAddress}:${socket.remotePort}`);
                // TODO Something with the close.
            })
        })

        // Listen on the server and create a promise for it.
        this.ready = new Promise((resolve, reject) => {
            this.#server.listen(port, () => {
                const port = (this.#server.address() as net.AddressInfo).port
                this.log(`Listening on ${port}`);
                resolve(port);
            })
            this.#server.on('error', error => reject(error));
        })
    }

    log(message: string, ...params: any) {
        console.log(`Node ${this.nodeId}: ${message}`, ...params);
    }

    // TODO Add event handlers for delivered and forwarded values.
}

export class Route {
    // TODO Add proximity metric.

    /**
     * @param id - The nodeID of the target node.
     * @param host - The hostname and port of the target node.
     */
    constructor(readonly id: string, readonly host: string) {
        // TODO Validate these.
    }
}

interface joinResponse {
    /**
     * The nodeId of the new node, if accepted.
     */
    nodeId: string

    networkConfig: NetworkConfigDocument
}