const tsConfig = require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");
const dotenv = require("dotenv")
dotenv.config()

const {paths, baseUrl, outDir} = tsConfig.compilerOptions;
const isDevelopment = process.env.NODE_ENV !== "production";
tsConfigPaths.register({
    baseUrl: isDevelopment ? baseUrl : outDir,
    paths: isDevelopment ? paths : Object.keys(paths).reduce((pathObj, pathKey) =>  {
        pathObj[pathKey] = paths[pathKey].map(pathVal => pathVal.replace(/^src\//g, ""))
        return pathObj
    }, {}),
});