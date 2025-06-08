import { DocumentNode, print } from 'graphql'

interface ExecuteParams<V extends Record<string, unknown>> {
    document: DocumentNode,
    variables?: V,
    operationName?: string
}

export default class NanoQLClient
{
    private readonly _url: URL
    private readonly _options?: RequestInit

    constructor(url: string|URL, defaultOptions?: RequestInit) {
        this._url = typeof url === 'string'
            ? new URL(url)
            : url

        this._options = defaultOptions
    }

    execute<V extends Record<string, unknown>>({ document, variables, operationName }: ExecuteParams<V>) {
        const controller = new AbortController()
        const signal = controller.signal

        const body: Record<string, unknown> = { query: print(document) };
        if (variables) body.variables = variables;
        if (operationName) body.operationName = operationName;


        const request = {
            ...this.options,
            method: 'POST',
            headers: {
                ...this.options?.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal
        }

        return {
            response: fetch(this.url, request),
            abort(reason?: any) {
                controller.abort(reason)
            }
        }
    }

    public get url() {
        return this._url.toString()
    }

    public get options() {
        return this._options
    }
}