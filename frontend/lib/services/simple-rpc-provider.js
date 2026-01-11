/**
 * Simple RPC Provider using native fetch (works in Next.js API routes)
 */
export class SimpleRpcProvider {
    constructor(url) {
        this.url = url;
        this.id = 1;
    }

    async call(method, params = []) {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: this.id++,
                method,
                params
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
    }

    async getBlockNumber() {
        return parseInt(await this.call('eth_blockNumber'), 16);
    }

    async getLogs(filter) {
        return await this.call('eth_getLogs', [filter]);
    }
}
