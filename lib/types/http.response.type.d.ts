type HttpResponseType = {
    status: number;
    headers: Record<string, string>;
    body?: unknown;
};
export default HttpResponseType;
