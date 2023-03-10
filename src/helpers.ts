import fs = require('node:fs');

/**
 * Read a specified directory and grab compiled javascript files
 * @param path Exact path of directory to read
 */
export function getJsFiles(path: string): string[] {
    return fs.readdirSync(path).filter((file) => file.endsWith('.js'));
}

export default {}
