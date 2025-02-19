"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Extract Audio from DoVi File',
    description: "\n  Extract audio from DoVi file\n  ",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Audio languages',
            name: 'audio_languages',
            type: 'string',
            defaultValue: 'eng,de',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify audio languages to keep using comma seperated list e.g. eng,de',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
var getOutputStreamIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (!streams[idx].removed) {
            index += 1;
        }
        if (streams[idx].index === stream.index) {
            break;
        }
    }
    return index;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var audio_languages = String(args.inputs.audio_languages).trim().split(',');
    args.variables.ffmpegCommand.container = 'hevc';
    args.variables.ffmpegCommand.shouldProcess = true;
    var audio_dir = "".concat(args.workDir, "/sub_streams");
    var streams = args.variables.ffmpegCommand.streams;
    var audioTracks = {};
    streams.forEach(function (stream) {
        var _a;
        var index = getOutputStreamIndex(streams, stream);
        if (stream.codec_type === 'audio' && ['dca', 'truehd'].includes(stream.codec_name)) {
            var lang = ((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) ? stream.tags.language : 'und';
            var format = stream.codec_name.toLowerCase();
            var dir = audio_dir;
            if (audio_languages.length !== 0 && !audio_languages.includes(lang)) {
                stream.removed = true;
            }
            else {
                // eslint-disable-next-line no-prototype-builtins
                if (stream.hasOwnProperty('disposition')) {
                    var def = stream.disposition.default === 1 ? '.default' : '';
                    var forced = stream.disposition.forced === 1 ? '.forced' : '';
                    lang = "".concat(lang).concat(def).concat(forced);
                }
                args.deps.fsextra.ensureDirSync(dir);
                if (!audioTracks[lang]) {
                    audioTracks[lang] = [];
                }
                audioTracks[lang].push("-map 0:".concat(stream.index));
            }
        }
        else {
            stream.removed = true;
        }
    });
    Object.keys(audioTracks).forEach(function (lang) {
        var _a;
        var audioFile = "".concat(audio_dir, "/audio_").concat(lang, ".mka");
        (_a = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_a, __spreadArray(__spreadArray([], audioTracks[lang], false), ['-c:a copy', audioFile], false));
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
