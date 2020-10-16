/**
 * Serialized settings for {@link NetworkConfig}.
 */
interface NetworkConfigDocument {
    b?: number;
    leafRange?: number;
}


export default class NetworkConfig {
    /**
     * A general configuration parameter used to calculate other settings.
     * For example, the numeric base used to split nodeIds and keys will always be exactly 2^b.
     *
     * Typical value: 4
     *
     * @see NetworkConfig.base
     */
    readonly b: number;

    /**
     * The number of nodes, in each direction, that a node should consider to be in its leaf set.
     * This also represents the minimum number of adjacent nodes that must fail before data or route integrity is lost.
     *
     * (Note: Pastry uses L to define the total size of the leaf set. So this is equivalent to L/2.)
     *
     * Typical values: 8 or 16
     */
    readonly leafRange: number;

    // TODO Add neighborhood size ('M').

    /**
     * Creates a new NetworkConfig instance.
     *
     * @param [config] Settings to use for the network configuration.
     * @param [config.b] Sets the base configuration value {@link NetworkConfig.b}. Default: 4.
     * @param [config.leafRange] Sets {@link NetworkConfig.leafRange}. Default: 2^(b-1).
     */
    constructor({b, leafRange}: NetworkConfigDocument = {}) {
        // Initialize settings as provided, or to their defaults.
        this.b = b ?? 4;
        this.leafRange = leafRange ?? 2 ** (this.b - 1);

        // Make sure the values are valid.
        this.validate()
    }

    get base() {
        return 2 ** this.b;
    }

    validate(): void {
        const {b, leafRange} = this;

        // Validate the settings.
        if (!Number.isInteger(b) || b < 1 || b > 6)
            throw new Error('<NetworkConfig>.beta must be an integer >= 1 and <= 6');

        if (!Number.isInteger(leafRange) || leafRange < 1)
            throw new Error('<NetworkConfig>.range must be an integer >= 1')
    }

    serialize(): NetworkConfigDocument {
        return {...this};
    }

    toString(): string {
        return `b: ${this.b}, L: ${this.leafRange * 2}, base: ${this.base}`;
    }
}