declare const parseQuery: (search: string | URLSearchParams) => Record<string, string | string[]>;
export default parseQuery;
