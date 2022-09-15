import Conf from "conf"
import Glob from "glob"
import fs from 'fs';
import path from 'path'

let defaultComment = "Don't modify auto-generated by figma2Tokens"

const schema = {
    Glob: {
        type: 'string',
        default: '**/*.json'
    },
    In: {
        type: 'string',
        default: "./tokens/"
    },
    Out: {
        type: 'string',
        default: './css/'
    },
    Block: {
        type: 'string',
        default: '@mixin mode'
    },
    Ext: {
        type: 'string',
        default: 'scss'
    },
    Mark: {
        type: 'string',
        default: defaultComment
    },
    Pfx: {
        type: 'string',
        default: "--"
    },
    Sep: {
        type: 'string',
        default: '-'
    },
    Ref: {
        type: 'array',
        default: ["{", "var(", "}", ")"]
    },
    BlockTokens: {
        type: 'array',
        default: ["{", "}"]
    }
};

let defaults = {
    Cfg: "figma2Tokens.cfg",
    Glob: '**/*.json',
    Dry: false,
    In: "./tokens/",
    Out: "./css/",
    Mark: defaultComment,
    Block: '@mixin mode ',
    Ext: "scss",
    Pfx: "--",
    Sep: "-",
    Ref: ["{", "var(", "}", ")"],
    BlockTokens: ["{", "}"]
}

function flattenTokens (treeTokens, processSwitches) {
    const flatTokens = {};

    recursiveFlatten(treeTokens, '');

    return flatTokens;

    function recursiveFlatten (currentObject, previousKeyName) {

        for (let key in currentObject) {
            let contents = currentObject[key];

            if (contents.constructor !== Object || contents?.value) {
                if (contents?.value[0] === "{") {
                    contents.value = "var(--" + contents.value.substring(1, contents.value.length - 1) + ")";
                }
                flatTokens["-" + previousKeyName + '-' + key] = contents.value;
            } else {
                recursiveFlatten(contents, previousKeyName + '-' + key);
            }
        }
    }
}

function getTokens (treeTokens, processSwitches, inFile) {
    let flatTokens;
    let tokenCount = 0;

    flatTokens = flattenTokens(treeTokens, processSwitches);
    tokenCount = Object.keys(flatTokens).length;

    if (tokenCount <= 0) {
        flatTokens = null;
    }

    return [flatTokens, tokenCount]
}

function createBlock (tokens, comment, blockStart) {
    let nl = "\n"
    let tab = "\t"
    let data = "";

    if (comment)
        data += "/*" + comment + "*/" + nl;

    if (blockStart)
        data += blockStart + " {" + nl;

    for (let key in tokens) {
        let value = tokens[key];
        data += (tab + key + " : " + value + nl);
    }

    if (blockStart)
        data += "}";

    data += nl;

    return data;
}

function mergeOptions (opts) {

    // Default structure
    let switches = Object.assign({}, defaults);
    let conf = new Conf({ schema, configName: opts?.Cfg ? opts.Cfg : switches.Cfg, cwd: "./" });

    // Assign cfg file choices
    switches = Object.assign(switches, conf.store);

    // Merge command line options 
    switches = Object.assign(switches, opts)

    // Computed 
    switches.search = switches.In + switches.Glob;

    return switches;
}

function extractFileSwitches (treeTokens) {
    let fileSwitches = {};

    if (treeTokens["figma2Tokens"]) {
        fileSwitches = treeTokens["figma2Tokens"];
        delete treeTokens["figma2Tokens"];
    }

    return fileSwitches
}

function createTokensObject (data) {
    let treeTokens;
    let fileSwitches;

    try {
        treeTokens = JSON.parse(data)
        fileSwitches = extractFileSwitches(treeTokens);

    } catch (err) {
        return [null, null, 0]
    }

    return [treeTokens, fileSwitches, Object.keys(treeTokens).length];
}

function build (opts) {

    let switches = mergeOptions(opts);

    let glob = new Glob(switches.search, {}, function (err, files) {
        let block;

        if (err) {
            console.log("Glob " + switches.Glob + " had a search error " + err)
        } else {

            if (switches.Dry) console.log("Dry run found " + files.length + " files using glob " + switches.search);

            files.forEach(function (file) {

                let parsed = path.parse(file)
                let outFile;

                fs.readFile(file, function (err, data) {
                    if (err) {
                        console.log("Could not open token file! " + err);
                    } else {

                        const [treeTokens, fileSwitches, rawCount] = createTokensObject(data);

                        if (!switches.Dry) {

                            const [tokens, tokenCount] = getTokens(treeTokens, file);

                            if (tokens) {
                                outFile = switches.Out + parsed.name + "." + switches.Ext;
                                console.log(file + " has " + tokenCount + " tokens");
                                block = createBlock(tokens, switches.Mark, switches.Block);
                                fs.writeFile(outFile, block, null, function (err) {
                                    if (!err) {
                                        console.log("\n" + outFile + " --> " + block);
                                    } else {
                                        console.log("Error writing " + outFile);
                                    }

                                });
                            }
                        }
                        else {
                            console.log("    " + file);
                        }
                    }
                });


            })
        }
    })
}

export { build }; 