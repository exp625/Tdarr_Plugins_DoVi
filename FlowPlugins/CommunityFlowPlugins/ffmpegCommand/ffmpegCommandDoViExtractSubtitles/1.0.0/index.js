"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
    name: 'Extract Subtitles from DoVi File',
    description: "\n  Extract subtitles from DoVi file and convert all possible types to srt format.\n  Picture based subtitles will be stored in a .mks file.\n  ",
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
            label: 'Subtitle languages',
            name: 'subtitle_languages',
            type: 'string',
            defaultValue: 'eng,de',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify subtitle languages to keep using comma seperated list e.g. eng,hun',
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
var getOuputStreamIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (!stream.removed) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var subtitle_languages = String(args.inputs.subtitle_languages).trim().split(',');
    args.variables.ffmpegCommand.container = 'hevc';
    args.variables.ffmpegCommand.shouldProcess = true;
    var subs_dir = "".concat(args.workDir, "/sub_streams");
    var streams = args.variables.ffmpegCommand.streams;
    var pictureFormats = ['hdmv_pgs_subtitle', 'dvd_subtitle'];
    var textFormats = ['ass', 'subrip', 'srt'];
    var pictureSubtitles = {};
    streams.forEach(function (stream) {
        var _a;
        var index = getOuputStreamIndex(streams, stream);
        if (stream.codec_type === 'subtitle') {
            var lang = ((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) ? stream.tags.language : 'und';
            var format = stream.codec_name.toLowerCase();
            var dir = subs_dir;
            if (textFormats.includes(format)) {
                if (subtitle_languages.length !== 0 && !subtitle_languages.includes(lang)) {
                    stream.removed = true;
                }
                else {
                    // eslint-disable-next-line no-prototype-builtins
                    if (stream.hasOwnProperty('disposition')) {
                        var def = stream.disposition.default === 1 ? '.default' : '';
                        var forced = stream.disposition.forced === 1 ? '.forced' : '';
                        var sdh = stream.disposition.hearing_impaired === 1 ? '.sdh' : '';
                        lang = "".concat(lang).concat(def).concat(forced).concat(sdh);
                    }
                    args.deps.fsextra.ensureDirSync(dir);
                    stream.outputArgs.push('-c:s:0');
                    stream.outputArgs.push(format === 'ass' ? 'srt' : 'copy');
                    stream.outputArgs.push("".concat(dir, "/").concat(index, ".").concat(lang, ".srt"));
                }
            }
            else if (pictureFormats.includes(format)) {
                if (!pictureSubtitles[lang]) {
                    pictureSubtitles[lang] = [];
                }
                pictureSubtitles[lang].push("-map 0:".concat(stream.index));
                stream.removed = true;
            }
            else {
                stream.removed = true;
            }
        }
        else {
            stream.removed = true;
        }
    });
    Object.keys(pictureSubtitles).forEach(function (lang) {
        var _a;
        var mksFile = "".concat(subs_dir, "/picture_subs_").concat(lang, ".mks");
        (_a = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_a, __spreadArray(__spreadArray([], pictureSubtitles[lang], false), ['-c:s copy', mksFile], false));
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
