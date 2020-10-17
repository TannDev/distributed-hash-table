import crypto = require('crypto');
import SocketIO = require('socket.io');
import net = require('net');
import http = require('http');

import NetworkConfig from './NetworkConfig';
import {NetworkConfigDocument} from './NetworkConfig';

export default class Node {
    readonly #server: http.Server;
    readonly #socket: SocketIO.Server;
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
        const nodeId = crypto.randomBytes(hashLength / 8).toString('hex')

        // Create the node.
        const node = new Node(nodeId, networkConfig);

        // TODO Contact the network.
        // TODO Get a node idea.
        // TODO Join the network.

        // Return the boostrapper node.
        return node;
    }

    static async joinNetwork(bootstrapperUrl: string): Promise<Node> {
        // Initialize a socket client.
        const IO = require('socket.io-client');
        const socket = IO(bootstrapperUrl);

        // Promisify the connection process.
        return new Promise((resolve) => {
            // Try to connect to the bootstrapper.
            // TODO De-socket this. Sockets are a horrible way to do this.
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
        // Start a new socket server.
        // TODO Don't use Socket.io.
        this.#server = http.createServer();
        this.#socket = new SocketIO(this.#server);

        this.nodeId = nodeId;
        this.networkConfig = new NetworkConfig(config);

        // Initialize the routing table.
        const {hashLength, base} = this.networkConfig;
        this.#routes = new Array(hashLength / base)
            .fill(null)
            .map(() => new Array(base).fill(null));

        // Mount handlers for the socket.
        this.#socket.on('connection', client => {
            client.on('join', (data, callback) => {
                this.log(`RECV from ${client.id}:`, data);
                callback({
                    nodeId: crypto.randomBytes(hashLength / 8).toString('hex'),
                    networkConfig: this.networkConfig.serialize()
                    // TODO Add routes.
                });
            })
        })

        // Prepare a promise for connections.
        this.ready = new Promise((resolve, reject) => {
            this.#server.on('listening', () => {
                const port = (this.#server.address() as net.AddressInfo).port
                this.log(`Listening on ${port}`);
                resolve(port);
            })
            this.#server.on('error', error => reject(error));
        })

        // Start listening for connections.
        this.#server.listen(port);

        // TODO Initialize the node.
    }

    log(message: string, ...params: any) {
        console.log(`Node ${this.nodeId}: ${message}`, ...params);
    }

    async find(key: string) {
        // TODO Route to the intended node.
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